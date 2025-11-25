/**
 * Banking Outreach Templates
 *
 * Pre-built templates for banking vertical outreach.
 */

import type { OutreachTemplate, BankingPersona, ToneStyle, OutreachChannel } from './types';

export const BANKING_TEMPLATES: OutreachTemplate[] = [
  // Digital Transformation Templates
  {
    id: 'digital-transformation-cto',
    name: 'Digital Transformation Initiative',
    channel: 'email',
    persona: ['cto', 'cio', 'cdo'],
    tone: 'professional',
    subject: '{{company_name}}: Supporting Your Digital Transformation Journey',
    body: `Dear {{persona_name}},

I noticed {{company_name}} recently {{signal_trigger}}. This is an exciting time for digital transformation in the GCC banking sector.

At PremiumRadar, we help leading banks like {{reference_bank}} accelerate their transformation initiatives by providing:

• Real-time competitive intelligence on digital banking trends
• AI-powered market analysis specific to GCC regulations
• Actionable insights for strategic decision-making

Given {{company_name}}'s position as a {{banking_tier}} institution, I believe we could provide significant value in your transformation journey.

Would you be open to a 15-minute call this week to explore how we might support your initiatives?

Best regards,
{{sender_name}}`,
    variables: ['company_name', 'persona_name', 'signal_trigger', 'reference_bank', 'banking_tier', 'sender_name'],
    triggers: ['digital-banking-launch', 'legacy-modernization-initiative', 'cloud-migration-program'],
    industry: 'Banking',
  },

  {
    id: 'regulatory-compliance',
    name: 'Regulatory Compliance Support',
    channel: 'email',
    persona: ['cto', 'head-of-digital', 'procurement'],
    tone: 'formal',
    subject: 'Preparing for {{regulation_name}} - How We Can Help',
    body: `Dear {{persona_name}},

With the {{regulation_name}} deadline approaching in {{days_until_deadline}} days, I wanted to reach out regarding {{company_name}}'s compliance preparations.

Our platform has helped {{success_count}}+ GCC banks navigate regulatory requirements by providing:

• Compliance tracking dashboards tailored to CBUAE requirements
• Competitive benchmarking against peer institutions
• Early warning signals for regulatory changes

I understand that compliance initiatives require careful planning and vendor evaluation. Would it be helpful if I shared a brief overview of how we've supported similar institutions?

Best regards,
{{sender_name}}`,
    variables: ['company_name', 'persona_name', 'regulation_name', 'days_until_deadline', 'success_count', 'sender_name'],
    triggers: ['regulatory-deadline-approaching', 'open-banking-compliance'],
    industry: 'Banking',
  },

  {
    id: 'leadership-change',
    name: 'New Leadership Introduction',
    channel: 'linkedin',
    persona: ['cto', 'cio', 'cdo', 'head-of-innovation'],
    tone: 'conversational',
    body: `Hi {{persona_name}},

Congratulations on your new role at {{company_name}}!

I noticed the announcement and wanted to introduce myself. I work with banking executives in the GCC who are driving digital transformation.

Given your background in {{previous_expertise}}, I thought you might find value in some competitive intelligence we've gathered on {{market_trend}}.

Happy to share a brief overview if you're interested - no pitch, just insights that might be useful as you settle into your new role.

Best,
{{sender_name}}`,
    variables: ['company_name', 'persona_name', 'previous_expertise', 'market_trend', 'sender_name'],
    triggers: ['c-level-change'],
    industry: 'Banking',
  },

  {
    id: 'competitor-response',
    name: 'Competitor Move Response',
    channel: 'email',
    persona: ['cto', 'head-of-digital', 'head-of-innovation'],
    tone: 'professional',
    subject: 'Insights on {{competitor_name}}\'s Recent {{competitor_move}}',
    body: `Dear {{persona_name}},

You may have seen that {{competitor_name}} recently {{competitor_move}}. Our analysis suggests this could impact {{market_impact}}.

At PremiumRadar, we track these competitive moves in real-time and help banks like {{company_name}} stay ahead:

• {{insight_1}}
• {{insight_2}}
• {{insight_3}}

Would you like to see a detailed analysis of how this might affect {{company_name}}'s market position?

Best regards,
{{sender_name}}`,
    variables: ['company_name', 'persona_name', 'competitor_name', 'competitor_move', 'market_impact', 'insight_1', 'insight_2', 'insight_3', 'sender_name'],
    triggers: ['competitor-product-launch', 'competitor-deal-lost'],
    industry: 'Banking',
  },

  // Phone Scripts
  {
    id: 'phone-warm-intro',
    name: 'Warm Phone Introduction',
    channel: 'phone',
    persona: ['cto', 'cio', 'procurement'],
    tone: 'friendly',
    body: `Opening:
"Hi {{persona_name}}, this is {{sender_name}} from PremiumRadar. I'm reaching out because I noticed {{signal_trigger}} - do you have 2 minutes?"

If Yes:
"Great! We help banks in the GCC with competitive intelligence. Given {{company_name}}'s {{relevant_context}}, I thought we might be able to help with {{value_prop}}.

Would it make sense to schedule a brief call this week to explore this further?"

If Busy:
"I completely understand. When would be a better time to call back? [Or] Would you prefer I send you a brief email instead?"

Closing:
"Thank you for your time, {{persona_name}}. I'll {{follow_up_action}}."`,
    variables: ['company_name', 'persona_name', 'signal_trigger', 'relevant_context', 'value_prop', 'sender_name', 'follow_up_action'],
    triggers: ['website-visit-high-intent', 'banking-event-attended', 'whitepaper-download'],
    industry: 'Banking',
  },

  // LinkedIn InMail
  {
    id: 'linkedin-event-follow-up',
    name: 'Event Follow-Up',
    channel: 'linkedin',
    persona: ['cto', 'cdo', 'head-of-innovation', 'vp-technology'],
    tone: 'conversational',
    body: `Hi {{persona_name}},

Great seeing {{company_name}} represented at {{event_name}}! The session on {{session_topic}} raised some interesting points.

I particularly thought about how {{relevant_insight}} might apply to banks in the GCC market.

Would you be interested in exchanging thoughts on this? I've been tracking competitive dynamics in the region and happy to share what we're seeing.

Best,
{{sender_name}}`,
    variables: ['company_name', 'persona_name', 'event_name', 'session_topic', 'relevant_insight', 'sender_name'],
    triggers: ['banking-event-attended'],
    industry: 'Banking',
  },
];

/**
 * Get templates matching signals and channel
 */
export function getMatchingTemplates(
  signalTypes: string[],
  channel?: OutreachChannel,
  persona?: BankingPersona
): OutreachTemplate[] {
  return BANKING_TEMPLATES.filter((template) => {
    // Channel match
    if (channel && template.channel !== channel) return false;

    // Persona match
    if (persona && !template.persona.includes(persona)) return false;

    // Signal trigger match
    const hasMatchingTrigger = template.triggers.some((trigger) =>
      signalTypes.includes(trigger)
    );
    if (!hasMatchingTrigger) return false;

    return true;
  });
}

/**
 * Fill template variables
 */
export function fillTemplate(
  template: OutreachTemplate,
  variables: Record<string, string>
): { subject?: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    if (subject) subject = subject.replace(new RegExp(placeholder, 'g'), value);
    body = body.replace(new RegExp(placeholder, 'g'), value);
  }

  return { subject, body };
}
