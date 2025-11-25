/**
 * Outreach Types
 *
 * Types for AI-powered outreach messaging system.
 */

export type OutreachChannel = 'email' | 'linkedin' | 'phone';

export type ToneStyle = 'formal' | 'professional' | 'conversational' | 'friendly';

export type BankingPersona =
  | 'cto'
  | 'cio'
  | 'cdo'
  | 'head-of-digital'
  | 'head-of-innovation'
  | 'procurement'
  | 'vp-technology';

export interface OutreachMessage {
  id: string;
  channel: OutreachChannel;
  subject?: string; // For email
  body: string;
  tone: ToneStyle;
  persona: BankingPersona;
  signals: string[]; // Signal IDs that triggered this outreach
  timing: OutreachTiming;
  status: 'draft' | 'scheduled' | 'sent' | 'replied';
  createdAt: Date;
  scheduledFor?: Date;
}

export interface OutreachTiming {
  recommendedTime: Date;
  urgencyLevel: 'immediate' | 'this-week' | 'this-month' | 'nurture';
  reason: string;
  confidence: number; // 0-100
}

export interface OutreachTemplate {
  id: string;
  name: string;
  channel: OutreachChannel;
  persona: BankingPersona[];
  tone: ToneStyle;
  subject?: string;
  body: string;
  variables: string[]; // Placeholders like {{company_name}}, {{signal_trigger}}
  triggers: string[]; // Signal types that match this template
  industry: string;
}

export interface ComposerState {
  step: 'channel' | 'persona' | 'template' | 'customize' | 'review';
  channel: OutreachChannel | null;
  persona: BankingPersona | null;
  template: OutreachTemplate | null;
  customizations: {
    subject?: string;
    body: string;
    tone: ToneStyle;
  };
  variables: Record<string, string>;
}
