/**
 * Admin Server Module
 *
 * Server-only exports for admin functionality.
 * These use Node.js modules (pg) and cannot be imported in client components.
 *
 * Use in:
 * - API routes (app/api/...)
 * - Server components
 * - Server actions
 *
 * Do NOT import in:
 * - Client components ('use client')
 * - Shared code that might run on client
 */

import 'server-only';

// Database
export {
  getPool,
  query,
  queryOne,
  insert,
  transaction,
  healthCheck,
  closePool,
} from '@/lib/db';

// Vertical Config Service
export type {
  RadarTarget,
  SignalConfig,
  SignalTemplate,
  ScoringFactorConfig,
  RegionalWeightConfig,
  TimingSignalConfig,
  EnrichmentSourceConfig,
  OutreachChannelConfig,
  JourneyStageConfig,
  CompanyProfileConfig,
  VerticalConfigData,
  VerticalConfig,
} from './vertical-config-service';

export {
  VerticalConfigSchema,
  getVerticalConfig,
  getAllVerticalConfigs,
  getActiveVerticalConfigs,
  getVerticals,
  getSubVerticals,
  getRegions,
  createVerticalConfig,
  updateVerticalConfig,
  deleteVerticalConfig,
  getVerticalConfigById,
  seedVerticalConfig,
  getVerticalConfigCached,
  invalidateConfigCache,
  clearConfigCache,
} from './vertical-config-service';
