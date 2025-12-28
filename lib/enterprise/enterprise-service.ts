/**
 * S323: Enterprise Service
 * Part of User & Enterprise Management Program v1.1
 * Phase D - Enterprise Service Layer
 *
 * Server-side service for enterprise operations.
 */

import {
  getEnterpriseById,
  getEnterpriseByDomain,
  createEnterprise,
  updateEnterprise,
  deleteEnterprise,
  listEnterprises,
  getEnterpriseStats,
  getOrCreateEnterpriseForDomain,
} from '@/lib/db/enterprises';
import type { Enterprise, CreateEnterpriseInput, UpdateEnterpriseInput, EnterpriseSummary } from './types';

export class EnterpriseService {
  /**
   * Get enterprise by ID
   */
  static async getById(enterpriseId: string): Promise<Enterprise | null> {
    return getEnterpriseById(enterpriseId);
  }

  /**
   * Get enterprise by domain
   */
  static async getByDomain(domain: string): Promise<Enterprise | null> {
    return getEnterpriseByDomain(domain);
  }

  /**
   * Create a new enterprise
   */
  static async create(input: CreateEnterpriseInput): Promise<Enterprise> {
    return createEnterprise(input);
  }

  /**
   * Update an enterprise
   */
  static async update(enterpriseId: string, input: UpdateEnterpriseInput): Promise<Enterprise | null> {
    return updateEnterprise(enterpriseId, input);
  }

  /**
   * Delete (soft) an enterprise
   */
  static async delete(enterpriseId: string): Promise<Enterprise | null> {
    return deleteEnterprise(enterpriseId);
  }

  /**
   * List enterprises with filters
   */
  static async list(options?: {
    status?: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
    type?: 'REAL' | 'DEMO';
    plan?: 'free' | 'starter' | 'professional' | 'enterprise';
    limit?: number;
    offset?: number;
  }): Promise<{ enterprises: Enterprise[]; total: number }> {
    return listEnterprises(options || {});
  }

  /**
   * Get enterprise summary with stats
   */
  static async getSummary(enterpriseId: string): Promise<EnterpriseSummary | null> {
    const enterprise = await getEnterpriseById(enterpriseId);
    if (!enterprise) return null;

    const stats = await getEnterpriseStats(enterpriseId);

    return {
      enterpriseId: enterprise.enterprise_id,
      name: enterprise.name,
      domain: enterprise.domain,
      plan: enterprise.plan || 'free',
      userCount: stats.userCount,
      workspaceCount: stats.workspaceCount,
      isAtUserLimit: stats.isAtUserLimit,
      isAtWorkspaceLimit: stats.isAtWorkspaceLimit,
    };
  }

  /**
   * Get or create enterprise for a domain (signup flow)
   */
  static async getOrCreateForDomain(domain: string, companyName: string): Promise<Enterprise> {
    return getOrCreateEnterpriseForDomain(domain, companyName);
  }

  /**
   * Check if user count is at limit
   */
  static async isAtUserLimit(enterpriseId: string): Promise<boolean> {
    const stats = await getEnterpriseStats(enterpriseId);
    return stats.isAtUserLimit;
  }

  /**
   * Check if workspace count is at limit
   */
  static async isAtWorkspaceLimit(enterpriseId: string): Promise<boolean> {
    const stats = await getEnterpriseStats(enterpriseId);
    return stats.isAtWorkspaceLimit;
  }
}

export default EnterpriseService;
