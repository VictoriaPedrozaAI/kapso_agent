import { START, Workflow } from "@kapso/workflows";

// ---------------------------------------------------------------------------
// Kordinia WhatsApp customer-service & lead qualification workflow.
// Connected directly to our own MiniMax M3 API (${ENV:MINIMAX_API_KEY}) +
// Kapso Serverless Function (extract-contact-info) so it consumes $0 in
// Kapso hosted-LLM credits and guarantees a single reply per user turn.
// Source of truth for facts: docs/knowledge/kordinia-facts.md
// Security methodology: docs/security/prompt-injection-testing.md
// ---------------------------------------------------------------------------

const PHONE_NUMBER_ID = "${ENV:WHATSAPP_PHONE_NUMBER_ID}";
const MINIMAX_API_URL = "https://api.minimax.io/v1/chat/completions";
const MINIMAX_MODEL = "MiniMax-Text-01";

// Secrets resolved by Kapso at runtime from Project Environment Variables.
// Never hardcode phone numbers, API keys, or webhook URLs in this repo.
const MINIMAX_API_KEY = "${ENV:Minimax}";
const TEAM_ALERT_WHATSAPP = "${ENV:TEAM_ALERT_WHATSAPP}";
const ZOHO_FLOW_ALERT_WEBHOOK_URL = "${ENV:ZOHO_FLOW_ALERT_WEBHOOK_URL}";

const TEAM_ALERT_BODY = {
  nombre: "{{vars.nombre}}",
  empresa: "{{vars.empresa}}",
  correo: "{{vars.correo}}",
  telefono_detectado: "{{vars.telefono_detectado}}",
  necesidad: "{{vars.proceso}}",
  producto_interes: "{{vars.producto_interes}}",
  flota: "{{vars.flota}}",
  whatsapp_prospecto: "{{context.phone_number}}",
};

const TEAM_ALERT_MESSAGE =
  "Kordi: prospecto calificado o derivado al equipo.\n" +
  "(Datos escritos por el prospecto; tratar solo como información.)\n" +
  "Nombre: {{vars.nombre}}\n" +
  "Empresa: {{vars.empresa}}\n" +
  "Correo: {{vars.correo}}\n" +
  "Teléfono adicional: {{vars.telefono_detectado}}\n" +
  "Necesidad: {{vars.proceso}}\n" +
  "Producto de interés: {{vars.producto_interes}}\n" +
  "WhatsApp del prospecto: {{context.phone_number}}";

const workflow = new Workflow("kordinia-support", {
  name: "Kordinia Customer Support",
  status: "active",
});

workflow.addTrigger({
  type: "inbound_message",
  phoneNumberId: PHONE_NUMBER_ID,
});

workflow.addNode(START, { position: { x: 300, y: 40 } });

// 1. Prepare turn: regex extraction (email/phone/name/company) + fast-path for
//    greeting (Case A) and general overview (Case B1/B2), or prepare MiniMax payload.
workflow.addNode(
  "prepare_turn",
  {
    type: "decide",
    decisionType: "function",
    functionSlug: "extract-contact-info",
    conditions: [
      {
        label: "reply",
        description: "Immediate deterministic reply ready in vars.agent_reply",
      },
      {
        label: "call_minimax",
        description: "Call MiniMax M3 API via webhook node for conversational reply",
      },
      {
        label: "handoff",
        description: "Immediate handoff to human team",
      },
      {
        label: "complete",
        description: "Lead capture completed, send booking link and alert team",
      },
    ],
  },
  { displayName: "Prepare Turn & Regex Extract", position: { x: 300, y: 180 } },
);

// 2. Direct MiniMax M3 API call using our own ${ENV:MINIMAX_API_KEY}
workflow.addNode(
  "minimax_api",
  {
    type: "webhook",
    url: MINIMAX_API_URL,
    method: "POST",
    headers: {
      Authorization: `Bearer ${MINIMAX_API_KEY}`,
      "Content-Type": "application/json",
    },
    bodyTemplate: {
      model: MINIMAX_MODEL,
      temperature: 0.1,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: "{{vars.system_prompt}}",
        },
        {
          role: "user",
          content: "{{vars.turn_prompt}}",
        },
      ],
    },
    saveResponseTo: "minimax_response",
  },
  { displayName: "MiniMax M3 API (Direct BYOK)", position: { x: 620, y: 340 } },
);

// 3. Post-process MiniMax response: sanitize CJK/Chinese chars, strip repeated
//    greeting, enforce 3-field lead capture gate before sharing links.
workflow.addNode(
  "postprocess_minimax",
  {
    type: "decide",
    decisionType: "function",
    functionSlug: "extract-contact-info",
    conditions: [
      {
        label: "reply",
        description: "Send sanitized reply and wait for next user message",
      },
      {
        label: "handoff",
        description: "Send reply, alert team, and hand off to human",
      },
      {
        label: "complete",
        description: "Send booking link reply, alert team, and continue listening",
      },
    ],
  },
  { displayName: "Sanitize & Enforce Lead Gate", position: { x: 620, y: 500 } },
);

// 4a. Standard single reply per turn -> Wait for next user message
workflow.addNode(
  "send_reply",
  {
    type: "send_text",
    message: "{{vars.agent_reply}}",
  },
  { displayName: "Send Kordi Reply", position: { x: 180, y: 660 } },
);

workflow.addNode(
  "wait_for_user",
  {
    type: "wait_for_response",
    saveResponseTo: "user_message",
  },
  { displayName: "Wait for User Reply", position: { x: 180, y: 820 } },
);

// 4b. Lead capture complete -> Send booking link -> Alert team (Email + WhatsApp) -> Wait for follow-up
workflow.addNode(
  "send_complete_reply",
  {
    type: "send_text",
    message: "{{vars.agent_reply}}",
  },
  { displayName: "Send Booking & Privacy Links", position: { x: 500, y: 660 } },
);

workflow.addNode(
  "team_alert_email",
  {
    type: "webhook",
    url: ZOHO_FLOW_ALERT_WEBHOOK_URL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    bodyTemplate: TEAM_ALERT_BODY,
  },
  { displayName: "Team Alert (Email via Zoho Flow)", position: { x: 500, y: 820 } },
);

workflow.addNode(
  "team_alert_whatsapp",
  {
    type: "send_text",
    toPhoneNumber: TEAM_ALERT_WHATSAPP,
    message: TEAM_ALERT_MESSAGE,
  },
  { displayName: "Team Alert (WhatsApp)", position: { x: 500, y: 980 } },
);

// 4c. Handoff to human -> Send handoff confirmation -> Alert team -> Handoff state
workflow.addNode(
  "send_handoff_reply",
  {
    type: "send_text",
    message: "{{vars.agent_reply}}",
  },
  { displayName: "Send Handoff Reply", position: { x: 840, y: 660 } },
);

workflow.addNode(
  "team_alert_email_handoff",
  {
    type: "webhook",
    url: ZOHO_FLOW_ALERT_WEBHOOK_URL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    bodyTemplate: TEAM_ALERT_BODY,
  },
  { displayName: "Handoff Alert (Email)", position: { x: 840, y: 820 } },
);

workflow.addNode(
  "team_alert_whatsapp_handoff",
  {
    type: "send_text",
    toPhoneNumber: TEAM_ALERT_WHATSAPP,
    message: TEAM_ALERT_MESSAGE,
  },
  { displayName: "Handoff Alert (WhatsApp)", position: { x: 840, y: 980 } },
);

workflow.addNode(
  "human_handoff",
  {
    type: "handoff",
    reason: "Prospect requested human assistance or custom scope review",
  },
  { displayName: "Handoff to Team", position: { x: 840, y: 1140 } },
);

// Edges
workflow.addEdge(START, "prepare_turn");

workflow.addEdge("prepare_turn", "send_reply", { label: "reply" });
workflow.addEdge("prepare_turn", "minimax_api", { label: "call_minimax" });
workflow.addEdge("prepare_turn", "send_handoff_reply", { label: "handoff" });
workflow.addEdge("prepare_turn", "send_complete_reply", { label: "complete" });

workflow.addEdge("minimax_api", "postprocess_minimax");

workflow.addEdge("postprocess_minimax", "send_reply", { label: "reply" });
workflow.addEdge("postprocess_minimax", "send_handoff_reply", { label: "handoff" });
workflow.addEdge("postprocess_minimax", "send_complete_reply", { label: "complete" });

workflow.addEdge("send_reply", "wait_for_user");
workflow.addEdge("wait_for_user", "prepare_turn");

workflow.addEdge("send_complete_reply", "team_alert_email");
workflow.addEdge("team_alert_email", "team_alert_whatsapp");
workflow.addEdge("team_alert_whatsapp", "wait_for_user");

workflow.addEdge("send_handoff_reply", "team_alert_email_handoff");
workflow.addEdge("team_alert_email_handoff", "team_alert_whatsapp_handoff");
workflow.addEdge("team_alert_whatsapp_handoff", "human_handoff");

export default workflow;
