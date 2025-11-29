/**
 * Export Controls - Sprint S49
 * Copy protection and export restrictions for enterprise data security
 *
 * Features:
 * - Export format restrictions
 * - Field-level redaction
 * - Watermarking support
 * - Approval workflows
 */

import {
  ExportControl,
  ExportRestriction,
  ExportFormat,
  CopyProtection,
} from './types';

// In-memory stores (use database in production)
const exportControlStore = new Map<string, ExportControl>();
const copyProtectionStore = new Map<string, CopyProtection>();
const exportApprovalStore = new Map<string, ExportApprovalRequest>();

// ============================================================
// EXPORT CONTROL TYPES
// ============================================================

export interface ExportApprovalRequest {
  id: string;
  tenantId: string;
  userId: string;
  format: ExportFormat;
  recordCount: number;
  fields: string[];
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface ExportResult {
  allowed: boolean;
  requiresApproval: boolean;
  approvalId?: string;
  restrictions: ExportRestriction[];
  reason?: string;
}

// ============================================================
// DEFAULT CONFIGURATIONS
// ============================================================

const DEFAULT_EXPORT_CONTROL: ExportControl = {
  tenantId: '',
  enabled: true,
  restrictions: [
    { field: 'email', action: 'mask', pattern: '***@***.***' },
    { field: 'phone', action: 'redact' },
    { field: 'ssn', action: 'exclude' },
    { field: 'credit_card', action: 'exclude' },
  ],
  approvalRequired: false,
  approvers: [],
  maxRecordsPerExport: 10000,
  maxExportsPerDay: 50,
  allowedFormats: ['csv', 'xlsx', 'pdf', 'json'],
  watermarkEnabled: false,
};

const DEFAULT_COPY_PROTECTION: CopyProtection = {
  tenantId: '',
  enabled: false,
  blockCopyPaste: false,
  blockScreenshot: false,
  blockPrint: false,
  blockRightClick: false,
  allowedDomains: [],
  sensitiveFields: ['email', 'phone', 'address'],
};

// ============================================================
// EXPORT CONTROLS
// ============================================================

/**
 * Get export controls for a tenant
 */
export function getExportControls(tenantId: string): ExportControl {
  return exportControlStore.get(tenantId) || { ...DEFAULT_EXPORT_CONTROL, tenantId };
}

/**
 * Set export controls for a tenant
 */
export function setExportControls(tenantId: string, controls: Partial<ExportControl>): ExportControl {
  const existing = getExportControls(tenantId);
  const updated = { ...existing, ...controls, tenantId };
  exportControlStore.set(tenantId, updated);
  return updated;
}

/**
 * Check if export is allowed
 */
export function checkExport(
  tenantId: string,
  userId: string,
  format: ExportFormat,
  recordCount: number
): ExportResult {
  const controls = getExportControls(tenantId);

  // Check if exports are enabled
  if (!controls.enabled) {
    return {
      allowed: false,
      requiresApproval: false,
      restrictions: [],
      reason: 'Exports are disabled for this workspace',
    };
  }

  // Check format
  if (!controls.allowedFormats.includes(format)) {
    return {
      allowed: false,
      requiresApproval: false,
      restrictions: [],
      reason: `Export format '${format}' is not allowed`,
    };
  }

  // Check record count
  if (recordCount > controls.maxRecordsPerExport) {
    return {
      allowed: false,
      requiresApproval: true,
      restrictions: controls.restrictions,
      reason: `Export exceeds maximum record limit (${controls.maxRecordsPerExport})`,
    };
  }

  // Check if approval required
  if (controls.approvalRequired) {
    return {
      allowed: false,
      requiresApproval: true,
      restrictions: controls.restrictions,
      reason: 'Export requires admin approval',
    };
  }

  return {
    allowed: true,
    requiresApproval: false,
    restrictions: controls.restrictions,
  };
}

/**
 * Apply export restrictions to data
 */
export function applyExportRestrictions<T extends Record<string, unknown>>(
  data: T[],
  restrictions: ExportRestriction[]
): Record<string, unknown>[] {
  return data.map(record => {
    const restricted: Record<string, unknown> = { ...record };

    for (const restriction of restrictions) {
      if (!(restriction.field in restricted)) continue;

      switch (restriction.action) {
        case 'exclude':
          delete restricted[restriction.field];
          break;

        case 'redact':
          restricted[restriction.field] = '[REDACTED]';
          break;

        case 'mask':
          const value = String(restricted[restriction.field]);
          restricted[restriction.field] = maskValue(value, restriction.pattern);
          break;

        case 'hash':
          restricted[restriction.field] = hashValue(String(restricted[restriction.field]));
          break;
      }
    }

    return restricted;
  });
}

/**
 * Mask a value with pattern
 */
function maskValue(value: string, pattern?: string): string {
  if (!pattern) {
    // Default masking: show first and last char
    if (value.length <= 4) return '****';
    return value[0] + '***' + value[value.length - 1];
  }

  // Email masking
  if (pattern === '***@***.***' && value.includes('@')) {
    const [local, domain] = value.split('@');
    const [domainName, tld] = domain.split('.');
    return `${local[0]}***@${domainName[0]}***.${tld || '***'}`;
  }

  return pattern;
}

/**
 * Hash a value (simple hash for demo)
 */
function hashValue(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * Add watermark to export metadata
 */
export function generateWatermark(
  tenantId: string,
  userId: string,
  exportId: string
): string {
  const timestamp = new Date().toISOString();
  return `Exported by ${userId} from workspace ${tenantId} at ${timestamp}. Export ID: ${exportId}`;
}

// ============================================================
// EXPORT APPROVAL WORKFLOW
// ============================================================

/**
 * Request export approval
 */
export function requestExportApproval(
  tenantId: string,
  userId: string,
  format: ExportFormat,
  recordCount: number,
  fields: string[],
  reason: string
): ExportApprovalRequest {
  const request: ExportApprovalRequest = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId,
    userId,
    format,
    recordCount,
    fields,
    reason,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  };

  exportApprovalStore.set(request.id, request);
  return request;
}

/**
 * Review export approval request
 */
export function reviewExportApproval(
  requestId: string,
  reviewerId: string,
  approved: boolean,
  notes?: string
): ExportApprovalRequest | null {
  const request = exportApprovalStore.get(requestId);
  if (!request) return null;

  request.status = approved ? 'approved' : 'denied';
  request.reviewedAt = new Date().toISOString();
  request.reviewedBy = reviewerId;
  request.reviewNotes = notes;

  exportApprovalStore.set(requestId, request);
  return request;
}

/**
 * Get pending export approvals for a tenant
 */
export function getPendingExportApprovals(tenantId: string): ExportApprovalRequest[] {
  const approvals: ExportApprovalRequest[] = [];
  for (const request of exportApprovalStore.values()) {
    if (request.tenantId === tenantId && request.status === 'pending') {
      approvals.push(request);
    }
  }
  return approvals;
}

// ============================================================
// COPY PROTECTION
// ============================================================

/**
 * Get copy protection settings for a tenant
 */
export function getCopyProtection(tenantId: string): CopyProtection {
  return copyProtectionStore.get(tenantId) || { ...DEFAULT_COPY_PROTECTION, tenantId };
}

/**
 * Set copy protection settings
 */
export function setCopyProtection(tenantId: string, settings: Partial<CopyProtection>): CopyProtection {
  const existing = getCopyProtection(tenantId);
  const updated = { ...existing, ...settings, tenantId };
  copyProtectionStore.set(tenantId, updated);
  return updated;
}

/**
 * Get client-side copy protection script
 * Returns JavaScript to inject into the page
 */
export function getCopyProtectionScript(tenantId: string): string {
  const protection = getCopyProtection(tenantId);

  if (!protection.enabled) return '';

  const scripts: string[] = [];

  if (protection.blockCopyPaste) {
    scripts.push(`
      document.addEventListener('copy', (e) => {
        const selection = window.getSelection()?.toString() || '';
        const sensitivePatterns = ${JSON.stringify(protection.sensitiveFields)};
        // Block if selecting sensitive content
        e.preventDefault();
        console.warn('Copy blocked by enterprise security policy');
      });
    `);
  }

  if (protection.blockRightClick) {
    scripts.push(`
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        console.warn('Right-click blocked by enterprise security policy');
      });
    `);
  }

  if (protection.blockPrint) {
    scripts.push(`
      window.addEventListener('beforeprint', (e) => {
        e.preventDefault();
        console.warn('Print blocked by enterprise security policy');
      });
    `);
  }

  return scripts.join('\n');
}

/**
 * Check if domain is allowed for data access
 */
export function isDomainAllowed(tenantId: string, domain: string): boolean {
  const protection = getCopyProtection(tenantId);

  if (!protection.enabled || protection.allowedDomains.length === 0) {
    return true;
  }

  return protection.allowedDomains.some(allowed => {
    if (allowed.startsWith('*.')) {
      return domain.endsWith(allowed.substring(1));
    }
    return domain === allowed;
  });
}

export default {
  getExportControls,
  setExportControls,
  checkExport,
  applyExportRestrictions,
  generateWatermark,
  requestExportApproval,
  reviewExportApproval,
  getPendingExportApprovals,
  getCopyProtection,
  setCopyProtection,
  getCopyProtectionScript,
  isDomainAllowed,
};
