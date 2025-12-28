/**
 * S297: Template Database Service
 * Part of User & Enterprise Management Program v1.1
 * Phase C - Backend & API
 *
 * Real PostgreSQL operations for message templates.
 */

import { query, queryOne, insert } from './client';

// ============================================================
// TYPES
// ============================================================

export type TemplateType = 'email' | 'sms' | 'linkedin' | 'whatsapp' | 'custom';

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required?: boolean;
  defaultValue?: string;
  description?: string;
}

export interface MessageTemplate {
  id: string;
  enterprise_id: string;
  name: string;
  subject: string | null;
  body: string;
  type: TemplateType;
  variables: TemplateVariable[];
  version: number;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTemplateInput {
  enterprise_id: string;
  name: string;
  subject?: string;
  body: string;
  type?: TemplateType;
  variables?: TemplateVariable[];
  created_by?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  subject?: string;
  body?: string;
  type?: TemplateType;
  variables?: TemplateVariable[];
  is_active?: boolean;
}

// ============================================================
// TEMPLATE CRUD
// ============================================================

/**
 * Create a new template
 */
export async function createTemplate(input: CreateTemplateInput): Promise<MessageTemplate> {
  return insert<MessageTemplate>(
    `INSERT INTO message_templates (
      enterprise_id, name, subject, body, type, variables, created_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      input.enterprise_id,
      input.name,
      input.subject || null,
      input.body,
      input.type || 'email',
      JSON.stringify(input.variables || []),
      input.created_by || null,
    ]
  );
}

/**
 * Get template by ID
 */
export async function getTemplateById(templateId: string): Promise<MessageTemplate | null> {
  return queryOne<MessageTemplate>(
    'SELECT * FROM message_templates WHERE id = $1',
    [templateId]
  );
}

/**
 * List templates for an enterprise
 */
export async function listEnterpriseTemplates(
  enterpriseId: string,
  options?: {
    type?: TemplateType;
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<{ templates: MessageTemplate[]; total: number }> {
  const conditions: string[] = ['enterprise_id = $1'];
  const values: unknown[] = [enterpriseId];
  let paramIndex = 2;

  if (options?.type) {
    conditions.push(`type = $${paramIndex++}`);
    values.push(options.type);
  }

  if (options?.activeOnly !== false) {
    conditions.push(`is_active = true`);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM message_templates WHERE ${whereClause}`,
    values
  );
  const total = parseInt(countResult?.count || '0', 10);

  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const templates = await query<MessageTemplate>(
    `SELECT * FROM message_templates
     WHERE ${whereClause}
     ORDER BY updated_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    [...values, limit, offset]
  );

  return { templates, total };
}

/**
 * Update template
 */
export async function updateTemplate(
  templateId: string,
  input: UpdateTemplateInput
): Promise<MessageTemplate | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.subject !== undefined) {
    fields.push(`subject = $${paramIndex++}`);
    values.push(input.subject);
  }
  if (input.body !== undefined) {
    fields.push(`body = $${paramIndex++}`);
    values.push(input.body);
  }
  if (input.type !== undefined) {
    fields.push(`type = $${paramIndex++}`);
    values.push(input.type);
  }
  if (input.variables !== undefined) {
    fields.push(`variables = $${paramIndex++}`);
    values.push(JSON.stringify(input.variables));
  }
  if (input.is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`);
    values.push(input.is_active);
  }

  if (fields.length === 0) {
    return getTemplateById(templateId);
  }

  // Increment version on update
  fields.push(`version = version + 1`);
  fields.push(`updated_at = NOW()`);
  values.push(templateId);

  return queryOne<MessageTemplate>(
    `UPDATE message_templates SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
}

/**
 * Delete template
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
  await query('DELETE FROM message_templates WHERE id = $1', [templateId]);
  return true;
}

/**
 * Deactivate template (soft delete)
 */
export async function deactivateTemplate(templateId: string): Promise<MessageTemplate | null> {
  return updateTemplate(templateId, { is_active: false });
}

// ============================================================
// TEMPLATE RENDERING
// ============================================================

/**
 * Render template with variables
 */
export function renderTemplate(
  template: MessageTemplate,
  data: Record<string, unknown>
): { subject: string | null; body: string } {
  let subject = template.subject;
  let body = template.body;

  // Replace {{variable}} patterns
  const replaceVars = (text: string | null) => {
    if (!text) return text;

    return text.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const variable = template.variables.find((v) => v.name === varName);

      if (data[varName] !== undefined) {
        return String(data[varName]);
      }

      if (variable?.defaultValue) {
        return variable.defaultValue;
      }

      if (variable?.required) {
        throw new Error(`Missing required variable: ${varName}`);
      }

      return match; // Keep placeholder if not required
    });
  };

  subject = replaceVars(subject);
  body = replaceVars(body) || '';

  return { subject, body };
}

/**
 * Validate template data against variables
 */
export function validateTemplateData(
  template: MessageTemplate,
  data: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const variable of template.variables) {
    if (variable.required && data[variable.name] === undefined) {
      errors.push(`Missing required variable: ${variable.name}`);
    }

    if (data[variable.name] !== undefined) {
      const value = data[variable.name];
      switch (variable.type) {
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`${variable.name} must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${variable.name} must be a boolean`);
          }
          break;
        case 'date':
          if (!(value instanceof Date) && isNaN(Date.parse(String(value)))) {
            errors.push(`${variable.name} must be a valid date`);
          }
          break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extract variables from template body
 */
export function extractVariables(body: string, subject?: string): string[] {
  const text = (subject || '') + ' ' + body;
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  const variables = matches.map((m) => m.replace(/\{\{|\}\}/g, ''));
  return [...new Set(variables)]; // Remove duplicates
}

// ============================================================
// TEMPLATE STATS
// ============================================================

/**
 * Get template statistics
 */
export async function getTemplateStats(enterpriseId: string): Promise<{
  total: number;
  active: number;
  byType: Record<string, number>;
}> {
  const totalResult = await queryOne<{ total: string; active: string }>(
    `SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_active = true) as active
     FROM message_templates
     WHERE enterprise_id = $1`,
    [enterpriseId]
  );

  const typeResult = await query<{ type: string; count: string }>(
    `SELECT type, COUNT(*) as count FROM message_templates
     WHERE enterprise_id = $1
     GROUP BY type`,
    [enterpriseId]
  );

  const byType: Record<string, number> = {};
  typeResult.forEach((r) => {
    byType[r.type] = parseInt(r.count, 10);
  });

  return {
    total: parseInt(totalResult?.total || '0', 10),
    active: parseInt(totalResult?.active || '0', 10),
    byType,
  };
}

export default {
  // CRUD
  createTemplate,
  getTemplateById,
  listEnterpriseTemplates,
  updateTemplate,
  deleteTemplate,
  deactivateTemplate,

  // Rendering
  renderTemplate,
  validateTemplateData,
  extractVariables,

  // Stats
  getTemplateStats,
};
