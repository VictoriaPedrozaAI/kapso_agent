# Concept One-Pager: Kapso WhatsApp Lead & Customer Service Agent

## 1. Problem Statement
Visitors landing on **kordinia.com** need rapid guidance on which solution solves their operational pain—whether it's **Koti**, **Ritmo40**, or a bespoke **Automation Solution**. Without instant, 24/7 qualification on WhatsApp, inbound leads drop off before booking a discovery call or leaving their contact details.

**Goal:** Deliver a smart, conversational WhatsApp assistant via Kapso's free account tier that answers product inquiries, captures qualified lead data (name, email, company, project scope), offers direct meeting bookings, and gracefully transitions complex queries to human operators without losing the lead.

---

## 2. Recommended Direction: The "Hybrid Concierge" (Kapso + MiniMax M3 + Smart Handoff)

A unified WhatsApp workflow that blends structured speed with conversational intelligence:
1. **Interactive Greeting:** Greets the lead instantly, offering quick guidance on *Koti*, *Ritmo40*, or *Custom Automations*.
2. **Conversational Advisory (MiniMax M3):** Understands user questions about features, pricing models, and use cases, providing concise, benefit-driven answers grounded in Kordinia’s offerings.
3. **Dual Conversion Engine:**
   - **Lead Capture:** Progressively captures Name, Email, and Company/Need during conversation flow.
   - **Call Booking:** Prompts high-intent leads to book a demo/discovery slot via Calendly.
4. **Resilient Human Handoff with Lead-Retention Fallback:**
   - Detects requests for human support or out-of-scope enterprise requirements.
   - Triggers an instant notification (Email / Webhook / Telegram) to the Kordinia sales team.
   - Sends an immediate fallback retention message: confirms a specialist has received their message and will respond within a defined window, while providing a direct booking link so the lead never feels abandoned.

---

## 3. Key Assumptions & Constraints
* **Kapso Free Account:** Operates within Kapso’s free sandbox and tier limits (message volume and token conservation).
* **LLM Integration:** Can plug into MiniMax M3 API (or fallback LLMs like Gemini / OpenAI) for cost-effective, high-quality Spanish/English conversational support.
* **Phone Connection:** Connected to the sandbox WhatsApp business number already registered in Kapso.
* **Knowledge Accuracy:** Requires a structured reference document of Koti, Ritmo40, and example automation workflows from `kordinia.com`.

---

## 4. MVP Scope (Phase 1)
- [ ] **WhatsApp Webhook / Kapso Agent Configuration:** Connect sandbox number to the agent runtime.
- [ ] **Product Knowledge Base Definition:** Document the exact value props, target customers, and FAQs for *Koti*, *Ritmo40*, and automation services.
- [ ] **MiniMax M3 / LLM Integration:** Prompt engineering for the customer service & SDR persona.
- [ ] **Lead Capture Pipeline:** Schema and storage/webhook for Name, Email, Company, and Interest summary.
- [ ] **Calendly Booking Trigger:** Automated delivery of discovery call link upon qualification.
- [ ] **Human Handoff & Fallback Trigger:** Webhook alert to team + reassuring WhatsApp fallback message.

---

## 5. What We Are NOT Doing (Out of Scope for MVP)
* ❌ Direct payment processing or in-chat checkout.
* ❌ Complex multi-department CRM integrations (HubSpot, Salesforce) in Phase 1 (start with simple webhook/email notifications).
* ❌ Outbound cold messaging campaigns (focus exclusively on inbound visitors from kordinia.com).
* ❌ Voice-to-voice calling (focus strictly on WhatsApp text/interactive messaging).
