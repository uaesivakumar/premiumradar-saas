/**
 * Tenant Settings Types
 * Sprint S54: Admin Panel (Tenant-Level Controls)
 *
 * Comprehensive tenant configuration for:
 * - User & role management
 * - Team configurations
 * - Feature toggles
 * - Vertical/region restrictions
 * - Workspace customizations
 * - Email templates & signatures
 * - Outreach configurations
 * - Billing visibility
 */

import { z } from 'zod';

// ============================================================
// TENANT SETTINGS SCHEMA
// ============================================================

export const TenantSettingsSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),

  // General Settings
  general: z.object({
    displayName: z.string().min(1).max(100),
    timezone: z.string().default('UTC'),
    dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).default('MM/DD/YYYY'),
    currency: z.string().length(3).default('USD'),
    language: z.string().length(2).default('en'),
    logoUrl: z.string().url().nullable(),
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable(),
  }),

  // Feature Toggles
  features: z.object({
    enableSIVA: z.boolean().default(true),
    enableAutonomousMode: z.boolean().default(false),
    enableBulkExport: z.boolean().default(true),
    enableAPIAccess: z.boolean().default(false),
    enableWebhooks: z.boolean().default(false),
    enableCustomEnrichment: z.boolean().default(false),
    enableTeamCollaboration: z.boolean().default(true),
    enableAdvancedAnalytics: z.boolean().default(false),
    enableWhiteLabeling: z.boolean().default(false),
    enableSSO: z.boolean().default(false),
    enableAuditLogs: z.boolean().default(true),
    enableDataRetention: z.boolean().default(true),
    maxDataRetentionDays: z.number().min(30).max(365).default(90),
  }),

  // Allowed Verticals
  verticals: z.object({
    allowAll: z.boolean().default(true),
    allowed: z.array(z.string()).default([]),
    blocked: z.array(z.string()).default([]),
    default: z.string().nullable(),
  }),

  // Allowed Regions
  regions: z.object({
    allowAll: z.boolean().default(true),
    allowed: z.array(z.string()).default([]),
    blocked: z.array(z.string()).default([]),
    default: z.string().nullable(),
  }),

  // Team Settings
  team: z.object({
    maxUsers: z.number().min(1).default(10),
    maxTeams: z.number().min(1).default(5),
    allowUserInvites: z.boolean().default(true),
    requireApproval: z.boolean().default(false),
    defaultRole: z.string().default('member'),
    allowRoleCreation: z.boolean().default(false),
    enforcePasswordPolicy: z.boolean().default(true),
    sessionTimeout: z.number().min(5).max(1440).default(60), // minutes
    requireMFA: z.boolean().default(false),
  }),

  // Workspace Customizations
  workspace: z.object({
    defaultView: z.enum(['radar', 'list', 'kanban', 'calendar']).default('radar'),
    showQuickActions: z.boolean().default(true),
    enableDarkMode: z.boolean().default(true),
    enableNotifications: z.boolean().default(true),
    notificationChannels: z.array(z.enum(['email', 'push', 'in-app', 'slack', 'teams'])).default(['email', 'in-app']),
    dashboardWidgets: z.array(z.string()).default(['radar', 'activity', 'tasks', 'metrics']),
    customCss: z.string().nullable(),
  }),

  // Outreach Settings
  outreach: z.object({
    enabled: z.boolean().default(true),
    defaultTone: z.enum(['professional', 'friendly', 'formal', 'casual', 'consultative']).default('professional'),
    maxDailyEmails: z.number().min(0).max(1000).default(100),
    maxDailySequences: z.number().min(0).max(100).default(10),
    requireApproval: z.boolean().default(false),
    enableTracking: z.boolean().default(true),
    enableABTesting: z.boolean().default(false),
    cooldownHours: z.number().min(0).max(168).default(24),
    excludeWeekends: z.boolean().default(true),
    workingHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('09:00'),
    workingHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('18:00'),
  }),

  // Enrichment Settings
  enrichment: z.object({
    enabled: z.boolean().default(true),
    autoEnrich: z.boolean().default(true),
    providers: z.array(z.string()).default(['apollo', 'clearbit']),
    customPipelines: z.array(z.object({
      id: z.string(),
      name: z.string(),
      steps: z.array(z.object({
        provider: z.string(),
        priority: z.number(),
        fallbackTo: z.string().nullable(),
      })),
      isActive: z.boolean(),
    })).default([]),
    refreshInterval: z.number().min(1).max(365).default(30), // days
    maxCreditsPerMonth: z.number().min(0).default(10000),
  }),

  // Billing Visibility
  billing: z.object({
    showUsage: z.boolean().default(true),
    showInvoices: z.boolean().default(true),
    showPlanDetails: z.boolean().default(true),
    allowPlanChange: z.boolean().default(true),
    allowAddOns: z.boolean().default(true),
    billingEmail: z.string().email().nullable(),
    billingAlerts: z.boolean().default(true),
    alertThreshold: z.number().min(50).max(100).default(80), // percentage
  }),

  // Metadata
  createdAt: z.date(),
  updatedAt: z.date(),
  updatedBy: z.string().uuid().nullable(),
  version: z.number().default(1),
});

export type TenantSettings = z.infer<typeof TenantSettingsSchema>;

// ============================================================
// ROLE & PERMISSION TYPES
// ============================================================

export const RoleSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  permissions: z.array(z.string()),
  isSystem: z.boolean().default(false), // Cannot be deleted
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Role = z.infer<typeof RoleSchema>;

export const PermissionCategories = {
  RADAR: ['radar:view', 'radar:create', 'radar:edit', 'radar:delete', 'radar:export'],
  LEADS: ['leads:view', 'leads:create', 'leads:edit', 'leads:delete', 'leads:export', 'leads:import'],
  OUTREACH: ['outreach:view', 'outreach:send', 'outreach:templates', 'outreach:sequences', 'outreach:analytics'],
  TEAM: ['team:view', 'team:invite', 'team:manage', 'team:roles'],
  SETTINGS: ['settings:view', 'settings:edit', 'settings:billing', 'settings:integrations'],
  ADMIN: ['admin:users', 'admin:audit', 'admin:security', 'admin:full'],
} as const;

export const DefaultRoles = {
  OWNER: {
    name: 'owner',
    displayName: 'Owner',
    permissions: Object.values(PermissionCategories).flat(),
  },
  ADMIN: {
    name: 'admin',
    displayName: 'Admin',
    permissions: [
      ...PermissionCategories.RADAR,
      ...PermissionCategories.LEADS,
      ...PermissionCategories.OUTREACH,
      ...PermissionCategories.TEAM,
      ...PermissionCategories.SETTINGS,
      'admin:users', 'admin:audit',
    ],
  },
  MANAGER: {
    name: 'manager',
    displayName: 'Manager',
    permissions: [
      ...PermissionCategories.RADAR,
      ...PermissionCategories.LEADS,
      ...PermissionCategories.OUTREACH,
      'team:view', 'team:invite',
      'settings:view',
    ],
  },
  MEMBER: {
    name: 'member',
    displayName: 'Member',
    permissions: [
      'radar:view', 'radar:create',
      'leads:view', 'leads:create', 'leads:edit',
      'outreach:view', 'outreach:send',
      'team:view',
    ],
  },
  VIEWER: {
    name: 'viewer',
    displayName: 'Viewer',
    permissions: [
      'radar:view',
      'leads:view',
      'outreach:view',
      'team:view',
    ],
  },
} as const;

// ============================================================
// TEAM TYPES
// ============================================================

export const TeamSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  leaderId: z.string().uuid().nullable(),
  members: z.array(z.string().uuid()),
  settings: z.object({
    inheritTenantSettings: z.boolean().default(true),
    allowedVerticals: z.array(z.string()).nullable(),
    allowedRegions: z.array(z.string()).nullable(),
    maxDailyEmails: z.number().nullable(),
    customTone: z.string().nullable(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Team = z.infer<typeof TeamSchema>;

export const TeamMemberSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  userId: z.string().uuid(),
  roleId: z.string().uuid(),
  joinedAt: z.date(),
  isLeader: z.boolean().default(false),
});

export type TeamMember = z.infer<typeof TeamMemberSchema>;

// ============================================================
// EMAIL TEMPLATE TYPES
// ============================================================

export const EmailTemplateSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  teamId: z.string().uuid().nullable(), // null = tenant-wide
  name: z.string().min(1).max(100),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  bodyHtml: z.string().max(50000).nullable(),
  category: z.enum(['cold_outreach', 'follow_up', 'meeting_request', 'proposal', 'thank_you', 'custom']),
  variables: z.array(z.object({
    name: z.string(),
    defaultValue: z.string().nullable(),
    required: z.boolean(),
  })),
  tone: z.enum(['professional', 'friendly', 'formal', 'casual', 'consultative']),
  vertical: z.string().nullable(), // Specific to vertical
  isActive: z.boolean().default(true),
  usageCount: z.number().default(0),
  lastUsedAt: z.date().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;

// ============================================================
// EMAIL SIGNATURE TYPES
// ============================================================

export const EmailSignatureSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().nullable(), // null = tenant default
  name: z.string().min(1).max(100),
  html: z.string().max(10000),
  plainText: z.string().max(2000),
  isDefault: z.boolean().default(false),
  includeCalendarLink: z.boolean().default(false),
  calendarUrl: z.string().url().nullable(),
  includeSocialLinks: z.boolean().default(false),
  socialLinks: z.object({
    linkedin: z.string().url().nullable(),
    twitter: z.string().url().nullable(),
    website: z.string().url().nullable(),
  }).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EmailSignature = z.infer<typeof EmailSignatureSchema>;

// ============================================================
// OUTREACH CADENCE TYPES
// ============================================================

export const OutreachCadenceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  steps: z.array(z.object({
    order: z.number(),
    type: z.enum(['email', 'linkedin', 'call', 'task', 'wait']),
    templateId: z.string().uuid().nullable(),
    delayDays: z.number().min(0).max(30),
    delayHours: z.number().min(0).max(23),
    subject: z.string().nullable(),
    content: z.string().nullable(),
    isOptional: z.boolean().default(false),
  })),
  triggers: z.object({
    onReply: z.enum(['stop', 'continue', 'branch']).default('stop'),
    onOpen: z.enum(['nothing', 'accelerate', 'notify']).default('nothing'),
    onClick: z.enum(['nothing', 'accelerate', 'notify']).default('notify'),
    onBounce: z.enum(['stop', 'retry', 'skip']).default('skip'),
  }),
  schedule: z.object({
    timezone: z.string(),
    workingDays: z.array(z.number().min(0).max(6)), // 0 = Sunday
    workingHoursStart: z.string(),
    workingHoursEnd: z.string(),
  }),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  vertical: z.string().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type OutreachCadence = z.infer<typeof OutreachCadenceSchema>;

// ============================================================
// TONE PRESET TYPES
// ============================================================

export const TonePresetSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  promptModifier: z.string().max(2000), // Instructions for LLM
  examples: z.array(z.object({
    input: z.string(),
    output: z.string(),
  })).max(5),
  settings: z.object({
    formality: z.number().min(1).max(10).default(5),
    warmth: z.number().min(1).max(10).default(5),
    directness: z.number().min(1).max(10).default(5),
    technicality: z.number().min(1).max(10).default(5),
  }),
  isSystem: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TonePreset = z.infer<typeof TonePresetSchema>;

// ============================================================
// CUSTOM ENRICHMENT PIPELINE TYPES
// ============================================================

export const EnrichmentPipelineSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  steps: z.array(z.object({
    order: z.number(),
    provider: z.string(),
    fields: z.array(z.string()),
    condition: z.object({
      field: z.string(),
      operator: z.enum(['exists', 'not_exists', 'equals', 'not_equals', 'contains']),
      value: z.string().nullable(),
    }).nullable(),
    fallback: z.object({
      provider: z.string(),
      maxRetries: z.number().min(0).max(3),
    }).nullable(),
  })),
  triggers: z.object({
    onNewLead: z.boolean().default(true),
    onImport: z.boolean().default(true),
    onManual: z.boolean().default(true),
    scheduled: z.object({
      enabled: z.boolean(),
      cronExpression: z.string().nullable(),
    }).nullable(),
  }),
  filters: z.object({
    verticals: z.array(z.string()).nullable(),
    regions: z.array(z.string()).nullable(),
    minScore: z.number().nullable(),
  }).nullable(),
  isActive: z.boolean().default(true),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type EnrichmentPipeline = z.infer<typeof EnrichmentPipelineSchema>;

// ============================================================
// BILLING VISIBILITY TYPES
// ============================================================

export interface BillingOverview {
  plan: {
    name: string;
    tier: 'free' | 'starter' | 'professional' | 'enterprise';
    billingCycle: 'monthly' | 'annual';
    price: number;
    currency: string;
  };
  usage: {
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    apiCalls: { used: number; limit: number; percentage: number };
    searches: { used: number; limit: number; percentage: number };
    exports: { used: number; limit: number; percentage: number };
    enrichments: { used: number; limit: number; percentage: number };
    storage: { usedMb: number; limitMb: number; percentage: number };
    seats: { used: number; limit: number; percentage: number };
  };
  billing: {
    nextInvoiceDate: Date;
    nextInvoiceAmount: number;
    paymentMethod: {
      type: 'card' | 'bank' | 'invoice';
      last4: string;
      expiresAt: Date | null;
    } | null;
  };
  invoices: Array<{
    id: string;
    number: string;
    date: Date;
    amount: number;
    status: 'paid' | 'pending' | 'failed' | 'void';
    pdfUrl: string;
  }>;
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

export interface UpdateTenantSettingsRequest {
  section: keyof Omit<TenantSettings, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'updatedBy' | 'version'>;
  data: Partial<TenantSettings[keyof TenantSettings]>;
}

export interface TenantSettingsAuditEntry {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete';
  section: string;
  previousValue: unknown;
  newValue: unknown;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
