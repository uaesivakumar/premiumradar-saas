/**
 * Tenant Settings Service
 * Sprint S54: Admin Panel (Tenant-Level Controls)
 *
 * CRUD operations for tenant settings with:
 * - Validation using Zod schemas
 * - Audit logging for all changes
 * - Default initialization
 * - Version tracking
 */

import { createClient } from '@/lib/supabase/server';
import {
  TenantSettings,
  TenantSettingsSchema,
  Role,
  RoleSchema,
  DefaultRoles,
  Team,
  TeamSchema,
  TeamMember,
  TeamMemberSchema,
  EmailTemplate,
  EmailTemplateSchema,
  EmailSignature,
  EmailSignatureSchema,
  OutreachCadence,
  OutreachCadenceSchema,
  TonePreset,
  TonePresetSchema,
  EnrichmentPipeline,
  EnrichmentPipelineSchema,
  BillingOverview,
  TenantSettingsAuditEntry,
  UpdateTenantSettingsRequest,
} from './types';

// ============================================================
// TENANT SETTINGS SERVICE
// ============================================================

export class TenantSettingsService {
  private supabase: ReturnType<typeof createClient>;
  private tenantId: string;
  private userId: string;

  constructor(tenantId: string, userId: string) {
    this.supabase = createClient();
    this.tenantId = tenantId;
    this.userId = userId;
  }

  // --------------------------------------------------------
  // GET SETTINGS
  // --------------------------------------------------------

  async getSettings(): Promise<TenantSettings | null> {
    const { data, error } = await this.supabase
      .from('tenant_settings')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .single();

    if (error || !data) return null;
    return this.transformFromDb(data);
  }

  async getSettingsOrCreate(): Promise<TenantSettings> {
    const existing = await this.getSettings();
    if (existing) return existing;

    return this.initializeDefaults();
  }

  // --------------------------------------------------------
  // UPDATE SETTINGS
  // --------------------------------------------------------

  async updateSection<K extends keyof TenantSettings>(
    section: K,
    data: Partial<TenantSettings[K]>
  ): Promise<TenantSettings> {
    const current = await this.getSettingsOrCreate();
    const previousValue = current[section];

    // Merge with existing section data (handle object sections)
    const currentSection = current[section];
    const updatedSection = typeof currentSection === 'object' && currentSection !== null
      ? { ...currentSection, ...data }
      : data;

    // Validate the update
    const updated = {
      ...current,
      [section]: updatedSection,
      updatedAt: new Date(),
      updatedBy: this.userId,
      version: current.version + 1,
    };

    // Validate entire settings object
    TenantSettingsSchema.parse(updated);

    // Save to database
    const { error } = await this.supabase
      .from('tenant_settings')
      .update(this.transformToDb(updated))
      .eq('id', current.id);

    if (error) throw new Error(`Failed to update settings: ${error.message}`);

    // Log audit entry
    await this.logAudit('update', section as string, previousValue, updatedSection);

    return updated;
  }

  async updateMultipleSections(
    updates: UpdateTenantSettingsRequest[]
  ): Promise<TenantSettings> {
    let settings = await this.getSettingsOrCreate();

    for (const update of updates) {
      settings = await this.updateSection(update.section as keyof TenantSettings, update.data as never);
    }

    return settings;
  }

  // --------------------------------------------------------
  // INITIALIZE DEFAULTS
  // --------------------------------------------------------

  async initializeDefaults(): Promise<TenantSettings> {
    const now = new Date();
    const id = crypto.randomUUID();

    const defaults: TenantSettings = {
      id,
      tenantId: this.tenantId,
      general: {
        displayName: 'My Workspace',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        language: 'en',
        logoUrl: null,
        primaryColor: null,
        secondaryColor: null,
      },
      features: {
        enableSIVA: true,
        enableAutonomousMode: false,
        enableBulkExport: true,
        enableAPIAccess: false,
        enableWebhooks: false,
        enableCustomEnrichment: false,
        enableTeamCollaboration: true,
        enableAdvancedAnalytics: false,
        enableWhiteLabeling: false,
        enableSSO: false,
        enableAuditLogs: true,
        enableDataRetention: true,
        maxDataRetentionDays: 90,
      },
      verticals: {
        allowAll: true,
        allowed: [],
        blocked: [],
        default: null,
      },
      regions: {
        allowAll: true,
        allowed: [],
        blocked: [],
        default: null,
      },
      team: {
        maxUsers: 10,
        maxTeams: 5,
        allowUserInvites: true,
        requireApproval: false,
        defaultRole: 'member',
        allowRoleCreation: false,
        enforcePasswordPolicy: true,
        sessionTimeout: 60,
        requireMFA: false,
      },
      workspace: {
        defaultView: 'radar',
        showQuickActions: true,
        enableDarkMode: true,
        enableNotifications: true,
        notificationChannels: ['email', 'in-app'],
        dashboardWidgets: ['radar', 'activity', 'tasks', 'metrics'],
        customCss: null,
      },
      outreach: {
        enabled: true,
        defaultTone: 'professional',
        maxDailyEmails: 100,
        maxDailySequences: 10,
        requireApproval: false,
        enableTracking: true,
        enableABTesting: false,
        cooldownHours: 24,
        excludeWeekends: true,
        workingHoursStart: '09:00',
        workingHoursEnd: '18:00',
      },
      enrichment: {
        enabled: true,
        autoEnrich: true,
        providers: ['apollo', 'clearbit'],
        customPipelines: [],
        refreshInterval: 30,
        maxCreditsPerMonth: 10000,
      },
      billing: {
        showUsage: true,
        showInvoices: true,
        showPlanDetails: true,
        allowPlanChange: true,
        allowAddOns: true,
        billingEmail: null,
        billingAlerts: true,
        alertThreshold: 80,
      },
      createdAt: now,
      updatedAt: now,
      updatedBy: this.userId,
      version: 1,
    };

    const { error } = await this.supabase
      .from('tenant_settings')
      .insert(this.transformToDb(defaults));

    if (error) throw new Error(`Failed to create settings: ${error.message}`);

    // Initialize default roles
    await this.initializeDefaultRoles();

    // Log audit
    await this.logAudit('create', 'all', null, defaults);

    return defaults;
  }

  // --------------------------------------------------------
  // ROLES MANAGEMENT
  // --------------------------------------------------------

  async getRoles(): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from('tenant_roles')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get roles: ${error.message}`);
    return (data || []).map(this.transformRoleFromDb);
  }

  async createRole(role: Omit<Role, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const settings = await this.getSettingsOrCreate();
    if (!settings.team.allowRoleCreation) {
      throw new Error('Role creation is not allowed for this tenant');
    }

    const now = new Date();
    const newRole: Role = {
      id: crypto.randomUUID(),
      tenantId: this.tenantId,
      ...role,
      createdAt: now,
      updatedAt: now,
    };

    RoleSchema.parse(newRole);

    const { error } = await this.supabase
      .from('tenant_roles')
      .insert(this.transformRoleToDb(newRole));

    if (error) throw new Error(`Failed to create role: ${error.message}`);

    await this.logAudit('create', 'role', null, newRole);
    return newRole;
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('tenant_roles')
      .select('*')
      .eq('id', roleId)
      .eq('tenant_id', this.tenantId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Role not found');
    }

    if (existing.is_system) {
      throw new Error('System roles cannot be modified');
    }

    const updated = {
      ...this.transformRoleFromDb(existing),
      ...updates,
      updatedAt: new Date(),
    };

    RoleSchema.parse(updated);

    const { error } = await this.supabase
      .from('tenant_roles')
      .update(this.transformRoleToDb(updated))
      .eq('id', roleId);

    if (error) throw new Error(`Failed to update role: ${error.message}`);

    await this.logAudit('update', 'role', existing, updated);
    return updated;
  }

  async deleteRole(roleId: string): Promise<void> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('tenant_roles')
      .select('*')
      .eq('id', roleId)
      .eq('tenant_id', this.tenantId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Role not found');
    }

    if (existing.is_system) {
      throw new Error('System roles cannot be deleted');
    }

    // Check if any users have this role
    const { count } = await this.supabase
      .from('tenant_members')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId);

    if (count && count > 0) {
      throw new Error(`Cannot delete role: ${count} users have this role assigned`);
    }

    const { error } = await this.supabase
      .from('tenant_roles')
      .delete()
      .eq('id', roleId);

    if (error) throw new Error(`Failed to delete role: ${error.message}`);

    await this.logAudit('delete', 'role', existing, null);
  }

  private async initializeDefaultRoles(): Promise<void> {
    const now = new Date();
    const roles = Object.entries(DefaultRoles).map(([key, role]) => ({
      id: crypto.randomUUID(),
      tenant_id: this.tenantId,
      name: role.name,
      display_name: role.displayName,
      description: null,
      permissions: role.permissions,
      is_system: true,
      is_default: role.name === 'member',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }));

    const { error } = await this.supabase
      .from('tenant_roles')
      .insert(roles);

    if (error) {
      console.error('Failed to initialize default roles:', error);
    }
  }

  // --------------------------------------------------------
  // TEAMS MANAGEMENT
  // --------------------------------------------------------

  async getTeams(): Promise<Team[]> {
    const { data, error } = await this.supabase
      .from('teams')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to get teams: ${error.message}`);
    return (data || []).map(this.transformTeamFromDb);
  }

  async createTeam(team: Omit<Team, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const settings = await this.getSettingsOrCreate();
    const existingTeams = await this.getTeams();

    if (existingTeams.length >= settings.team.maxTeams) {
      throw new Error(`Maximum number of teams (${settings.team.maxTeams}) reached`);
    }

    const now = new Date();
    const newTeam: Team = {
      id: crypto.randomUUID(),
      tenantId: this.tenantId,
      ...team,
      createdAt: now,
      updatedAt: now,
    };

    TeamSchema.parse(newTeam);

    const { error } = await this.supabase
      .from('teams')
      .insert(this.transformTeamToDb(newTeam));

    if (error) throw new Error(`Failed to create team: ${error.message}`);

    await this.logAudit('create', 'team', null, newTeam);
    return newTeam;
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .eq('tenant_id', this.tenantId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Team not found');
    }

    const updated = {
      ...this.transformTeamFromDb(existing),
      ...updates,
      updatedAt: new Date(),
    };

    TeamSchema.parse(updated);

    const { error } = await this.supabase
      .from('teams')
      .update(this.transformTeamToDb(updated))
      .eq('id', teamId);

    if (error) throw new Error(`Failed to update team: ${error.message}`);

    await this.logAudit('update', 'team', existing, updated);
    return updated;
  }

  async deleteTeam(teamId: string): Promise<void> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .eq('tenant_id', this.tenantId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Team not found');
    }

    // Remove team members first
    await this.supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId);

    const { error } = await this.supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw new Error(`Failed to delete team: ${error.message}`);

    await this.logAudit('delete', 'team', existing, null);
  }

  // --------------------------------------------------------
  // EMAIL TEMPLATES
  // --------------------------------------------------------

  async getEmailTemplates(teamId?: string): Promise<EmailTemplate[]> {
    let query = this.supabase
      .from('email_templates')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('created_at', { ascending: false });

    if (teamId) {
      query = query.or(`team_id.eq.${teamId},team_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get templates: ${error.message}`);
    return (data || []).map(this.transformTemplateFromDb);
  }

  async createEmailTemplate(template: Omit<EmailTemplate, 'id' | 'tenantId' | 'usageCount' | 'lastUsedAt' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const now = new Date();
    const newTemplate: EmailTemplate = {
      id: crypto.randomUUID(),
      tenantId: this.tenantId,
      ...template,
      usageCount: 0,
      lastUsedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    EmailTemplateSchema.parse(newTemplate);

    const { error } = await this.supabase
      .from('email_templates')
      .insert(this.transformTemplateToDb(newTemplate));

    if (error) throw new Error(`Failed to create template: ${error.message}`);

    await this.logAudit('create', 'email_template', null, newTemplate);
    return newTemplate;
  }

  async updateEmailTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const { data: existing, error: fetchError } = await this.supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .eq('tenant_id', this.tenantId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Template not found');
    }

    const updated = {
      ...this.transformTemplateFromDb(existing),
      ...updates,
      updatedAt: new Date(),
    };

    EmailTemplateSchema.parse(updated);

    const { error } = await this.supabase
      .from('email_templates')
      .update(this.transformTemplateToDb(updated))
      .eq('id', templateId);

    if (error) throw new Error(`Failed to update template: ${error.message}`);

    await this.logAudit('update', 'email_template', existing, updated);
    return updated;
  }

  async deleteEmailTemplate(templateId: string): Promise<void> {
    const { error } = await this.supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId)
      .eq('tenant_id', this.tenantId);

    if (error) throw new Error(`Failed to delete template: ${error.message}`);
  }

  // --------------------------------------------------------
  // EMAIL SIGNATURES
  // --------------------------------------------------------

  async getEmailSignatures(userId?: string): Promise<EmailSignature[]> {
    let query = this.supabase
      .from('email_signatures')
      .select('*')
      .eq('tenant_id', this.tenantId);

    if (userId) {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Failed to get signatures: ${error.message}`);
    return (data || []).map(this.transformSignatureFromDb);
  }

  async createEmailSignature(signature: Omit<EmailSignature, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<EmailSignature> {
    const now = new Date();
    const newSignature: EmailSignature = {
      id: crypto.randomUUID(),
      tenantId: this.tenantId,
      ...signature,
      createdAt: now,
      updatedAt: now,
    };

    EmailSignatureSchema.parse(newSignature);

    // If setting as default, unset other defaults
    if (signature.isDefault) {
      await this.supabase
        .from('email_signatures')
        .update({ is_default: false })
        .eq('tenant_id', this.tenantId)
        .eq('user_id', signature.userId);
    }

    const { error } = await this.supabase
      .from('email_signatures')
      .insert(this.transformSignatureToDb(newSignature));

    if (error) throw new Error(`Failed to create signature: ${error.message}`);
    return newSignature;
  }

  // --------------------------------------------------------
  // OUTREACH CADENCES
  // --------------------------------------------------------

  async getOutreachCadences(): Promise<OutreachCadence[]> {
    const { data, error } = await this.supabase
      .from('outreach_cadences')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get cadences: ${error.message}`);
    return (data || []).map(this.transformCadenceFromDb);
  }

  async createOutreachCadence(cadence: Omit<OutreachCadence, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<OutreachCadence> {
    const now = new Date();
    const newCadence: OutreachCadence = {
      id: crypto.randomUUID(),
      tenantId: this.tenantId,
      ...cadence,
      createdAt: now,
      updatedAt: now,
    };

    OutreachCadenceSchema.parse(newCadence);

    const { error } = await this.supabase
      .from('outreach_cadences')
      .insert(this.transformCadenceToDb(newCadence));

    if (error) throw new Error(`Failed to create cadence: ${error.message}`);

    await this.logAudit('create', 'outreach_cadence', null, newCadence);
    return newCadence;
  }

  // --------------------------------------------------------
  // TONE PRESETS
  // --------------------------------------------------------

  async getTonePresets(): Promise<TonePreset[]> {
    const { data, error } = await this.supabase
      .from('tone_presets')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('is_system', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw new Error(`Failed to get tone presets: ${error.message}`);
    return (data || []).map(this.transformTonePresetFromDb);
  }

  async createTonePreset(preset: Omit<TonePreset, 'id' | 'tenantId' | 'isSystem' | 'createdAt' | 'updatedAt'>): Promise<TonePreset> {
    const now = new Date();
    const newPreset: TonePreset = {
      id: crypto.randomUUID(),
      tenantId: this.tenantId,
      ...preset,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };

    TonePresetSchema.parse(newPreset);

    const { error } = await this.supabase
      .from('tone_presets')
      .insert(this.transformTonePresetToDb(newPreset));

    if (error) throw new Error(`Failed to create tone preset: ${error.message}`);

    await this.logAudit('create', 'tone_preset', null, newPreset);
    return newPreset;
  }

  // --------------------------------------------------------
  // ENRICHMENT PIPELINES
  // --------------------------------------------------------

  async getEnrichmentPipelines(): Promise<EnrichmentPipeline[]> {
    const { data, error } = await this.supabase
      .from('enrichment_pipelines')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to get pipelines: ${error.message}`);
    return (data || []).map(this.transformPipelineFromDb);
  }

  async createEnrichmentPipeline(pipeline: Omit<EnrichmentPipeline, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<EnrichmentPipeline> {
    const settings = await this.getSettingsOrCreate();
    if (!settings.features.enableCustomEnrichment) {
      throw new Error('Custom enrichment pipelines are not enabled for this tenant');
    }

    const now = new Date();
    const newPipeline: EnrichmentPipeline = {
      id: crypto.randomUUID(),
      tenantId: this.tenantId,
      ...pipeline,
      createdAt: now,
      updatedAt: now,
    };

    EnrichmentPipelineSchema.parse(newPipeline);

    const { error } = await this.supabase
      .from('enrichment_pipelines')
      .insert(this.transformPipelineToDb(newPipeline));

    if (error) throw new Error(`Failed to create pipeline: ${error.message}`);

    await this.logAudit('create', 'enrichment_pipeline', null, newPipeline);
    return newPipeline;
  }

  // --------------------------------------------------------
  // BILLING OVERVIEW
  // --------------------------------------------------------

  async getBillingOverview(): Promise<BillingOverview | null> {
    const settings = await this.getSettingsOrCreate();
    if (!settings.billing.showUsage && !settings.billing.showInvoices && !settings.billing.showPlanDetails) {
      return null;
    }

    // This would typically call Stripe or your billing provider
    // For now, return mock data structure
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('*, subscription:subscriptions(*)')
      .eq('id', this.tenantId)
      .single();

    if (!tenant) return null;

    // Build billing overview from tenant data
    const subscription = tenant.subscription as Record<string, unknown> | null;
    return {
      plan: {
        name: (subscription?.plan_name as string) || 'Free',
        tier: (subscription?.tier as 'free' | 'starter' | 'professional' | 'enterprise') || 'free',
        billingCycle: (subscription?.billing_cycle as 'monthly' | 'annual') || 'monthly',
        price: (subscription?.price as number) || 0,
        currency: 'USD',
      },
      usage: {
        currentPeriodStart: new Date((subscription?.current_period_start as string) || Date.now()),
        currentPeriodEnd: new Date((subscription?.current_period_end as string) || Date.now()),
        apiCalls: { used: 0, limit: 1000, percentage: 0 },
        searches: { used: 0, limit: 100, percentage: 0 },
        exports: { used: 0, limit: 50, percentage: 0 },
        enrichments: { used: 0, limit: 500, percentage: 0 },
        storage: { usedMb: 0, limitMb: 1000, percentage: 0 },
        seats: { used: 1, limit: 5, percentage: 20 },
      },
      billing: {
        nextInvoiceDate: new Date((subscription?.current_period_end as string) || Date.now()),
        nextInvoiceAmount: (subscription?.price as number) || 0,
        paymentMethod: null,
      },
      invoices: [],
    };
  }

  // --------------------------------------------------------
  // AUDIT LOGGING
  // --------------------------------------------------------

  private async logAudit(
    action: 'create' | 'update' | 'delete',
    section: string,
    previousValue: unknown,
    newValue: unknown
  ): Promise<void> {
    const entry: Omit<TenantSettingsAuditEntry, 'id'> = {
      tenantId: this.tenantId,
      userId: this.userId,
      userEmail: '', // Would be fetched from user
      action,
      section,
      previousValue,
      newValue,
      ipAddress: '', // Would be from request context
      userAgent: '',
      timestamp: new Date(),
    };

    await this.supabase
      .from('tenant_settings_audit')
      .insert({
        id: crypto.randomUUID(),
        tenant_id: entry.tenantId,
        user_id: entry.userId,
        user_email: entry.userEmail,
        action: entry.action,
        section: entry.section,
        previous_value: entry.previousValue,
        new_value: entry.newValue,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
        timestamp: entry.timestamp.toISOString(),
      });
  }

  // --------------------------------------------------------
  // DB TRANSFORMERS
  // --------------------------------------------------------

  private transformFromDb(data: Record<string, unknown>): TenantSettings {
    return {
      id: data.id as string,
      tenantId: data.tenant_id as string,
      general: data.general as TenantSettings['general'],
      features: data.features as TenantSettings['features'],
      verticals: data.verticals as TenantSettings['verticals'],
      regions: data.regions as TenantSettings['regions'],
      team: data.team as TenantSettings['team'],
      workspace: data.workspace as TenantSettings['workspace'],
      outreach: data.outreach as TenantSettings['outreach'],
      enrichment: data.enrichment as TenantSettings['enrichment'],
      billing: data.billing as TenantSettings['billing'],
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
      updatedBy: data.updated_by as string | null,
      version: data.version as number,
    };
  }

  private transformToDb(settings: TenantSettings): Record<string, unknown> {
    return {
      id: settings.id,
      tenant_id: settings.tenantId,
      general: settings.general,
      features: settings.features,
      verticals: settings.verticals,
      regions: settings.regions,
      team: settings.team,
      workspace: settings.workspace,
      outreach: settings.outreach,
      enrichment: settings.enrichment,
      billing: settings.billing,
      created_at: settings.createdAt.toISOString(),
      updated_at: settings.updatedAt.toISOString(),
      updated_by: settings.updatedBy,
      version: settings.version,
    };
  }

  private transformRoleFromDb(data: Record<string, unknown>): Role {
    return {
      id: data.id as string,
      tenantId: data.tenant_id as string,
      name: data.name as string,
      displayName: data.display_name as string,
      description: data.description as string | null,
      permissions: data.permissions as string[],
      isSystem: data.is_system as boolean,
      isDefault: data.is_default as boolean,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private transformRoleToDb(role: Role): Record<string, unknown> {
    return {
      id: role.id,
      tenant_id: role.tenantId,
      name: role.name,
      display_name: role.displayName,
      description: role.description,
      permissions: role.permissions,
      is_system: role.isSystem,
      is_default: role.isDefault,
      created_at: role.createdAt.toISOString(),
      updated_at: role.updatedAt.toISOString(),
    };
  }

  private transformTeamFromDb(data: Record<string, unknown>): Team {
    return {
      id: data.id as string,
      tenantId: data.tenant_id as string,
      name: data.name as string,
      description: data.description as string | null,
      leaderId: data.leader_id as string | null,
      members: data.members as string[],
      settings: data.settings as Team['settings'],
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private transformTeamToDb(team: Team): Record<string, unknown> {
    return {
      id: team.id,
      tenant_id: team.tenantId,
      name: team.name,
      description: team.description,
      leader_id: team.leaderId,
      members: team.members,
      settings: team.settings,
      created_at: team.createdAt.toISOString(),
      updated_at: team.updatedAt.toISOString(),
    };
  }

  private transformTemplateFromDb(data: Record<string, unknown>): EmailTemplate {
    return {
      id: data.id as string,
      tenantId: data.tenant_id as string,
      teamId: data.team_id as string | null,
      name: data.name as string,
      subject: data.subject as string,
      body: data.body as string,
      bodyHtml: data.body_html as string | null,
      category: data.category as EmailTemplate['category'],
      variables: data.variables as EmailTemplate['variables'],
      tone: data.tone as EmailTemplate['tone'],
      vertical: data.vertical as string | null,
      isActive: data.is_active as boolean,
      usageCount: data.usage_count as number,
      lastUsedAt: data.last_used_at ? new Date(data.last_used_at as string) : null,
      createdBy: data.created_by as string,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private transformTemplateToDb(template: EmailTemplate): Record<string, unknown> {
    return {
      id: template.id,
      tenant_id: template.tenantId,
      team_id: template.teamId,
      name: template.name,
      subject: template.subject,
      body: template.body,
      body_html: template.bodyHtml,
      category: template.category,
      variables: template.variables,
      tone: template.tone,
      vertical: template.vertical,
      is_active: template.isActive,
      usage_count: template.usageCount,
      last_used_at: template.lastUsedAt?.toISOString(),
      created_by: template.createdBy,
      created_at: template.createdAt.toISOString(),
      updated_at: template.updatedAt.toISOString(),
    };
  }

  private transformSignatureFromDb(data: Record<string, unknown>): EmailSignature {
    return {
      id: data.id as string,
      tenantId: data.tenant_id as string,
      userId: data.user_id as string | null,
      name: data.name as string,
      html: data.html as string,
      plainText: data.plain_text as string,
      isDefault: data.is_default as boolean,
      includeCalendarLink: data.include_calendar_link as boolean,
      calendarUrl: data.calendar_url as string | null,
      includeSocialLinks: data.include_social_links as boolean,
      socialLinks: data.social_links as EmailSignature['socialLinks'],
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private transformSignatureToDb(signature: EmailSignature): Record<string, unknown> {
    return {
      id: signature.id,
      tenant_id: signature.tenantId,
      user_id: signature.userId,
      name: signature.name,
      html: signature.html,
      plain_text: signature.plainText,
      is_default: signature.isDefault,
      include_calendar_link: signature.includeCalendarLink,
      calendar_url: signature.calendarUrl,
      include_social_links: signature.includeSocialLinks,
      social_links: signature.socialLinks,
      created_at: signature.createdAt.toISOString(),
      updated_at: signature.updatedAt.toISOString(),
    };
  }

  private transformCadenceFromDb(data: Record<string, unknown>): OutreachCadence {
    return {
      id: data.id as string,
      tenantId: data.tenant_id as string,
      name: data.name as string,
      description: data.description as string | null,
      steps: data.steps as OutreachCadence['steps'],
      triggers: data.triggers as OutreachCadence['triggers'],
      schedule: data.schedule as OutreachCadence['schedule'],
      isActive: data.is_active as boolean,
      isDefault: data.is_default as boolean,
      vertical: data.vertical as string | null,
      createdBy: data.created_by as string,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private transformCadenceToDb(cadence: OutreachCadence): Record<string, unknown> {
    return {
      id: cadence.id,
      tenant_id: cadence.tenantId,
      name: cadence.name,
      description: cadence.description,
      steps: cadence.steps,
      triggers: cadence.triggers,
      schedule: cadence.schedule,
      is_active: cadence.isActive,
      is_default: cadence.isDefault,
      vertical: cadence.vertical,
      created_by: cadence.createdBy,
      created_at: cadence.createdAt.toISOString(),
      updated_at: cadence.updatedAt.toISOString(),
    };
  }

  private transformTonePresetFromDb(data: Record<string, unknown>): TonePreset {
    return {
      id: data.id as string,
      tenantId: data.tenant_id as string,
      name: data.name as string,
      displayName: data.display_name as string,
      description: data.description as string | null,
      promptModifier: data.prompt_modifier as string,
      examples: data.examples as TonePreset['examples'],
      settings: data.settings as TonePreset['settings'],
      isSystem: data.is_system as boolean,
      isDefault: data.is_default as boolean,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private transformTonePresetToDb(preset: TonePreset): Record<string, unknown> {
    return {
      id: preset.id,
      tenant_id: preset.tenantId,
      name: preset.name,
      display_name: preset.displayName,
      description: preset.description,
      prompt_modifier: preset.promptModifier,
      examples: preset.examples,
      settings: preset.settings,
      is_system: preset.isSystem,
      is_default: preset.isDefault,
      created_at: preset.createdAt.toISOString(),
      updated_at: preset.updatedAt.toISOString(),
    };
  }

  private transformPipelineFromDb(data: Record<string, unknown>): EnrichmentPipeline {
    return {
      id: data.id as string,
      tenantId: data.tenant_id as string,
      name: data.name as string,
      description: data.description as string | null,
      steps: data.steps as EnrichmentPipeline['steps'],
      triggers: data.triggers as EnrichmentPipeline['triggers'],
      filters: data.filters as EnrichmentPipeline['filters'],
      isActive: data.is_active as boolean,
      createdBy: data.created_by as string,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private transformPipelineToDb(pipeline: EnrichmentPipeline): Record<string, unknown> {
    return {
      id: pipeline.id,
      tenant_id: pipeline.tenantId,
      name: pipeline.name,
      description: pipeline.description,
      steps: pipeline.steps,
      triggers: pipeline.triggers,
      filters: pipeline.filters,
      is_active: pipeline.isActive,
      created_by: pipeline.createdBy,
      created_at: pipeline.createdAt.toISOString(),
      updated_at: pipeline.updatedAt.toISOString(),
    };
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

export function createTenantSettingsService(tenantId: string, userId: string): TenantSettingsService {
  return new TenantSettingsService(tenantId, userId);
}
