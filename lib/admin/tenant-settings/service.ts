/**
 * Tenant Settings Service
 * Sprint S54: Admin Panel (Tenant-Level Controls)
 *
 * TODO: Migrate from Supabase to internal DB
 * Currently stubbed - not in critical discovery path
 */

import {
  TenantSettings,
  Role,
  Team,
  TeamMember,
  EmailTemplate,
  EmailSignature,
  OutreachCadence,
  TonePreset,
  EnrichmentPipeline,
  BillingOverview,
  TenantSettingsAuditEntry,
  UpdateTenantSettingsRequest,
} from './types';

// ============================================================
// TENANT SETTINGS SERVICE (STUB - Needs migration to internal DB)
// ============================================================

export class TenantSettingsService {
  private tenantId: string;
  private userId: string;

  constructor(tenantId: string, userId: string) {
    this.tenantId = tenantId;
    this.userId = userId;
  }

  // --------------------------------------------------------
  // GET SETTINGS - STUBBED
  // --------------------------------------------------------

  async getSettings(): Promise<TenantSettings | null> {
    console.warn('[TenantSettingsService] getSettings - Not implemented (needs DB migration)');
    return null;
  }

  async getSettingsOrCreate(): Promise<TenantSettings> {
    console.warn('[TenantSettingsService] getSettingsOrCreate - Not implemented');
    throw new Error('TenantSettingsService.getSettingsOrCreate - Not implemented');
  }

  async updateSettings(updates: UpdateTenantSettingsRequest): Promise<TenantSettings | null> {
    console.warn('[TenantSettingsService] updateSettings - Not implemented');
    return null;
  }

  async updateSection(section: string, data: unknown): Promise<unknown> {
    console.warn(`[TenantSettingsService] updateSection(${section}) - Not implemented`);
    throw new Error('TenantSettingsService.updateSection - Not implemented');
  }

  async initializeDefaults(): Promise<TenantSettings> {
    throw new Error('TenantSettingsService.initializeDefaults - Not implemented');
  }

  // --------------------------------------------------------
  // ROLES - STUBBED
  // --------------------------------------------------------

  async getRoles(): Promise<Role[]> {
    // Stubbed - returns empty array until DB migration
    return [];
  }

  async createRole(role: Partial<Role>): Promise<Role> {
    throw new Error('TenantSettingsService.createRole - Not implemented');
  }

  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role | null> {
    throw new Error('TenantSettingsService.updateRole - Not implemented');
  }

  async deleteRole(roleId: string): Promise<boolean> {
    throw new Error('TenantSettingsService.deleteRole - Not implemented');
  }

  // --------------------------------------------------------
  // TEAMS - STUBBED
  // --------------------------------------------------------

  async getTeams(): Promise<Team[]> {
    return [];
  }

  async createTeam(team: Partial<Team>): Promise<Team> {
    throw new Error('TenantSettingsService.createTeam - Not implemented');
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team | null> {
    throw new Error('TenantSettingsService.updateTeam - Not implemented');
  }

  async deleteTeam(teamId: string): Promise<boolean> {
    throw new Error('TenantSettingsService.deleteTeam - Not implemented');
  }

  async addTeamMember(teamId: string, member: Partial<TeamMember>): Promise<TeamMember> {
    throw new Error('TenantSettingsService.addTeamMember - Not implemented');
  }

  async removeTeamMember(teamId: string, userId: string): Promise<boolean> {
    throw new Error('TenantSettingsService.removeTeamMember - Not implemented');
  }

  // --------------------------------------------------------
  // EMAIL TEMPLATES - STUBBED
  // --------------------------------------------------------

  async getEmailTemplates(teamId?: string): Promise<EmailTemplate[]> {
    return [];
  }

  async createEmailTemplate(template: Partial<EmailTemplate>): Promise<EmailTemplate> {
    throw new Error('TenantSettingsService.createEmailTemplate - Not implemented');
  }

  async updateEmailTemplate(templateId: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | null> {
    throw new Error('TenantSettingsService.updateEmailTemplate - Not implemented');
  }

  async deleteEmailTemplate(templateId: string): Promise<boolean> {
    throw new Error('TenantSettingsService.deleteEmailTemplate - Not implemented');
  }

  // --------------------------------------------------------
  // EMAIL SIGNATURES - STUBBED
  // --------------------------------------------------------

  async getEmailSignatures(userId?: string): Promise<EmailSignature[]> {
    return [];
  }

  async createEmailSignature(signature: Partial<EmailSignature>): Promise<EmailSignature> {
    throw new Error('TenantSettingsService.createEmailSignature - Not implemented');
  }

  async updateEmailSignature(signatureId: string, updates: Partial<EmailSignature>): Promise<EmailSignature | null> {
    throw new Error('TenantSettingsService.updateEmailSignature - Not implemented');
  }

  async deleteEmailSignature(signatureId: string): Promise<boolean> {
    throw new Error('TenantSettingsService.deleteEmailSignature - Not implemented');
  }

  // --------------------------------------------------------
  // OUTREACH CADENCES - STUBBED
  // --------------------------------------------------------

  async getOutreachCadences(): Promise<OutreachCadence[]> {
    return [];
  }

  async createOutreachCadence(cadence: Partial<OutreachCadence>): Promise<OutreachCadence> {
    throw new Error('TenantSettingsService.createOutreachCadence - Not implemented');
  }

  async updateOutreachCadence(cadenceId: string, updates: Partial<OutreachCadence>): Promise<OutreachCadence | null> {
    throw new Error('TenantSettingsService.updateOutreachCadence - Not implemented');
  }

  async deleteOutreachCadence(cadenceId: string): Promise<boolean> {
    throw new Error('TenantSettingsService.deleteOutreachCadence - Not implemented');
  }

  // --------------------------------------------------------
  // TONE PRESETS - STUBBED
  // --------------------------------------------------------

  async getTonePresets(): Promise<TonePreset[]> {
    return [];
  }

  async createTonePreset(preset: Partial<TonePreset>): Promise<TonePreset> {
    throw new Error('TenantSettingsService.createTonePreset - Not implemented');
  }

  async updateTonePreset(presetId: string, updates: Partial<TonePreset>): Promise<TonePreset | null> {
    throw new Error('TenantSettingsService.updateTonePreset - Not implemented');
  }

  async deleteTonePreset(presetId: string): Promise<boolean> {
    throw new Error('TenantSettingsService.deleteTonePreset - Not implemented');
  }

  // --------------------------------------------------------
  // ENRICHMENT PIPELINES - STUBBED
  // --------------------------------------------------------

  async getEnrichmentPipelines(): Promise<EnrichmentPipeline[]> {
    return [];
  }

  async createEnrichmentPipeline(pipeline: Partial<EnrichmentPipeline>): Promise<EnrichmentPipeline> {
    throw new Error('TenantSettingsService.createEnrichmentPipeline - Not implemented');
  }

  async updateEnrichmentPipeline(pipelineId: string, updates: Partial<EnrichmentPipeline>): Promise<EnrichmentPipeline | null> {
    throw new Error('TenantSettingsService.updateEnrichmentPipeline - Not implemented');
  }

  async deleteEnrichmentPipeline(pipelineId: string): Promise<boolean> {
    throw new Error('TenantSettingsService.deleteEnrichmentPipeline - Not implemented');
  }

  // --------------------------------------------------------
  // BILLING - STUBBED
  // --------------------------------------------------------

  async getBillingOverview(): Promise<BillingOverview | null> {
    return null;
  }

  // --------------------------------------------------------
  // AUDIT LOG - STUBBED
  // --------------------------------------------------------

  async getAuditLog(options?: { limit?: number; offset?: number; action?: string }): Promise<TenantSettingsAuditEntry[]> {
    return [];
  }
}

// Factory function
export function createTenantSettingsService(tenantId: string, userId: string): TenantSettingsService {
  return new TenantSettingsService(tenantId, userId);
}
