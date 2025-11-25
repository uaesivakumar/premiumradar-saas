/**
 * Outreach Workflow
 *
 * Preview and send workflow for outreach messages.
 */

import { create } from 'zustand';
import type { OutreachMessage, OutreachChannel, ToneStyle } from './types';

// ============================================================
// WORKFLOW TYPES
// ============================================================

export type WorkflowStage =
  | 'compose'
  | 'preview'
  | 'schedule'
  | 'confirm'
  | 'sending'
  | 'sent'
  | 'failed';

export interface OutreachRecipient {
  id: string;
  domain: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  whoisContact?: string;
  preferredChannel?: OutreachChannel;
}

export interface OutreachDraft {
  id: string;
  recipientId: string;
  recipient: OutreachRecipient;
  channel: OutreachChannel;
  subject?: string;
  body: string;
  tone: ToneStyle;
  templateId?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledSend {
  draftId: string;
  scheduledFor: Date;
  timezone: string;
  reason?: string;
}

export interface SendResult {
  draftId: string;
  success: boolean;
  sentAt?: Date;
  messageId?: string;
  error?: string;
  deliveryStatus?: 'pending' | 'delivered' | 'bounced' | 'opened';
}

export interface WorkflowState {
  currentStage: WorkflowStage;
  draft: OutreachDraft | null;
  schedule: ScheduledSend | null;
  sendResult: SendResult | null;
  validationErrors: string[];
}

// ============================================================
// WORKFLOW STORE
// ============================================================

interface OutreachWorkflowStore {
  // Current workflow state
  workflow: WorkflowState;

  // Draft management
  drafts: Map<string, OutreachDraft>;
  sentMessages: Map<string, SendResult>;

  // Actions
  startNewOutreach: (recipient: OutreachRecipient) => OutreachDraft;
  updateDraft: (draftId: string, updates: Partial<OutreachDraft>) => void;
  deleteDraft: (draftId: string) => void;

  // Workflow progression
  setStage: (stage: WorkflowStage) => void;
  goToPreview: (draftId: string) => boolean;
  goToSchedule: () => void;
  goToConfirm: () => void;
  goBack: () => void;

  // Scheduling
  scheduleMessage: (scheduledFor: Date, timezone: string, reason?: string) => void;
  cancelSchedule: () => void;

  // Sending
  sendNow: () => Promise<SendResult>;
  sendScheduled: () => Promise<SendResult>;

  // Validation
  validateDraft: (draft: OutreachDraft) => string[];

  // Reset
  resetWorkflow: () => void;
}

export const useOutreachWorkflowStore = create<OutreachWorkflowStore>((set, get) => ({
  workflow: {
    currentStage: 'compose',
    draft: null,
    schedule: null,
    sendResult: null,
    validationErrors: [],
  },
  drafts: new Map(),
  sentMessages: new Map(),

  startNewOutreach: (recipient) => {
    const draft: OutreachDraft = {
      id: `draft_${Date.now()}`,
      recipientId: recipient.id,
      recipient,
      channel: recipient.preferredChannel || 'email',
      body: '',
      tone: 'professional',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      drafts: new Map(state.drafts).set(draft.id, draft),
      workflow: {
        ...state.workflow,
        currentStage: 'compose',
        draft,
        sendResult: null,
        validationErrors: [],
      },
    }));

    return draft;
  },

  updateDraft: (draftId, updates) => {
    set((state) => {
      const drafts = new Map(state.drafts);
      const existing = drafts.get(draftId);
      if (!existing) return state;

      const updated = { ...existing, ...updates, updatedAt: new Date() };
      drafts.set(draftId, updated);

      return {
        drafts,
        workflow: {
          ...state.workflow,
          draft: state.workflow.draft?.id === draftId ? updated : state.workflow.draft,
        },
      };
    });
  },

  deleteDraft: (draftId) => {
    set((state) => {
      const drafts = new Map(state.drafts);
      drafts.delete(draftId);

      return {
        drafts,
        workflow:
          state.workflow.draft?.id === draftId
            ? { ...state.workflow, draft: null, currentStage: 'compose' }
            : state.workflow,
      };
    });
  },

  setStage: (stage) => {
    set((state) => ({
      workflow: { ...state.workflow, currentStage: stage },
    }));
  },

  goToPreview: (draftId) => {
    const draft = get().drafts.get(draftId);
    if (!draft) return false;

    const errors = get().validateDraft(draft);
    if (errors.length > 0) {
      set((state) => ({
        workflow: { ...state.workflow, validationErrors: errors },
      }));
      return false;
    }

    set((state) => ({
      workflow: {
        ...state.workflow,
        currentStage: 'preview',
        draft,
        validationErrors: [],
      },
    }));
    return true;
  },

  goToSchedule: () => {
    set((state) => ({
      workflow: { ...state.workflow, currentStage: 'schedule' },
    }));
  },

  goToConfirm: () => {
    set((state) => ({
      workflow: { ...state.workflow, currentStage: 'confirm' },
    }));
  },

  goBack: () => {
    set((state) => {
      const stageOrder: WorkflowStage[] = ['compose', 'preview', 'schedule', 'confirm'];
      const currentIndex = stageOrder.indexOf(state.workflow.currentStage);
      const prevStage = currentIndex > 0 ? stageOrder[currentIndex - 1] : 'compose';

      return {
        workflow: { ...state.workflow, currentStage: prevStage },
      };
    });
  },

  scheduleMessage: (scheduledFor, timezone, reason) => {
    const { draft } = get().workflow;
    if (!draft) return;

    set((state) => ({
      workflow: {
        ...state.workflow,
        schedule: {
          draftId: draft.id,
          scheduledFor,
          timezone,
          reason,
        },
      },
    }));
  },

  cancelSchedule: () => {
    set((state) => ({
      workflow: { ...state.workflow, schedule: null },
    }));
  },

  sendNow: async () => {
    const { draft } = get().workflow;
    if (!draft) {
      return { draftId: '', success: false, error: 'No draft selected' };
    }

    set((state) => ({
      workflow: { ...state.workflow, currentStage: 'sending' },
    }));

    // Simulate sending
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const success = Math.random() > 0.1; // 90% success rate
    const result: SendResult = {
      draftId: draft.id,
      success,
      sentAt: success ? new Date() : undefined,
      messageId: success ? `msg_${Date.now()}` : undefined,
      error: success ? undefined : 'Failed to deliver message',
      deliveryStatus: success ? 'pending' : undefined,
    };

    set((state) => ({
      sentMessages: new Map(state.sentMessages).set(draft.id, result),
      workflow: {
        ...state.workflow,
        currentStage: success ? 'sent' : 'failed',
        sendResult: result,
      },
    }));

    return result;
  },

  sendScheduled: async () => {
    const { draft, schedule } = get().workflow;
    if (!draft || !schedule) {
      return { draftId: '', success: false, error: 'No draft or schedule' };
    }

    // For scheduled sends, we just confirm the schedule
    const result: SendResult = {
      draftId: draft.id,
      success: true,
      deliveryStatus: 'pending',
    };

    set((state) => ({
      sentMessages: new Map(state.sentMessages).set(draft.id, result),
      workflow: {
        ...state.workflow,
        currentStage: 'sent',
        sendResult: result,
      },
    }));

    return result;
  },

  validateDraft: (draft) => {
    const errors: string[] = [];

    if (!draft.body || draft.body.trim().length < 10) {
      errors.push('Message body must be at least 10 characters');
    }

    if (draft.channel === 'email') {
      if (!draft.subject || draft.subject.trim().length < 3) {
        errors.push('Email subject is required');
      }
      if (!draft.recipient.email) {
        errors.push('Recipient email is required');
      }
    }

    if (draft.channel === 'linkedin' && !draft.recipient.linkedIn) {
      errors.push('Recipient LinkedIn profile is required');
    }

    if (draft.channel === 'phone' && !draft.recipient.phone) {
      errors.push('Recipient phone number is required');
    }

    return errors;
  },

  resetWorkflow: () => {
    set((state) => ({
      workflow: {
        currentStage: 'compose',
        draft: null,
        schedule: null,
        sendResult: null,
        validationErrors: [],
      },
    }));
  },
}));

// ============================================================
// WORKFLOW HELPERS
// ============================================================

/**
 * Get stage display info
 */
export function getStageInfo(stage: WorkflowStage): {
  label: string;
  icon: string;
  description: string;
} {
  const info: Record<WorkflowStage, { label: string; icon: string; description: string }> = {
    compose: {
      label: 'Compose',
      icon: '✏️',
      description: 'Write your outreach message',
    },
    preview: {
      label: 'Preview',
      icon: '👁️',
      description: 'Review how your message will appear',
    },
    schedule: {
      label: 'Schedule',
      icon: '📅',
      description: 'Choose when to send',
    },
    confirm: {
      label: 'Confirm',
      icon: '✓',
      description: 'Final confirmation before sending',
    },
    sending: {
      label: 'Sending',
      icon: '📤',
      description: 'Message is being sent',
    },
    sent: {
      label: 'Sent',
      icon: '✅',
      description: 'Message sent successfully',
    },
    failed: {
      label: 'Failed',
      icon: '❌',
      description: 'Message failed to send',
    },
  };
  return info[stage];
}

/**
 * Get workflow progress percentage
 */
export function getWorkflowProgress(stage: WorkflowStage): number {
  const progress: Record<WorkflowStage, number> = {
    compose: 20,
    preview: 40,
    schedule: 60,
    confirm: 80,
    sending: 90,
    sent: 100,
    failed: 100,
  };
  return progress[stage];
}

/**
 * Check if stage allows going back
 */
export function canGoBack(stage: WorkflowStage): boolean {
  return ['preview', 'schedule', 'confirm'].includes(stage);
}

/**
 * Check if stage allows going forward
 */
export function canGoForward(stage: WorkflowStage): boolean {
  return ['compose', 'preview', 'schedule', 'confirm'].includes(stage);
}

/**
 * Get channel display info
 */
export function getChannelInfo(channel: OutreachChannel): {
  label: string;
  icon: string;
  color: string;
} {
  const info: Record<OutreachChannel, { label: string; icon: string; color: string }> = {
    email: { label: 'Email', icon: '📧', color: 'blue' },
    linkedin: { label: 'LinkedIn', icon: '💼', color: 'indigo' },
    phone: { label: 'Phone', icon: '📞', color: 'orange' },
  };
  return info[channel];
}

/**
 * Format scheduled time for display
 */
export function formatScheduledTime(schedule: ScheduledSend): string {
  const date = new Date(schedule.scheduledFor);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  };
  return date.toLocaleString('en-US', options);
}

/**
 * Get delivery status info
 */
export function getDeliveryStatusInfo(status?: SendResult['deliveryStatus']): {
  label: string;
  color: string;
  icon: string;
} {
  const info: Record<NonNullable<SendResult['deliveryStatus']>, { label: string; color: string; icon: string }> = {
    pending: { label: 'Pending', color: 'gray', icon: '⏳' },
    delivered: { label: 'Delivered', color: 'green', icon: '✅' },
    bounced: { label: 'Bounced', color: 'red', icon: '↩️' },
    opened: { label: 'Opened', color: 'blue', icon: '👁️' },
  };
  return status ? info[status] : { label: 'Unknown', color: 'gray', icon: '❓' };
}
