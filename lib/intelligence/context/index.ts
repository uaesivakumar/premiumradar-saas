/**
 * Sales Context Module
 *
 * Provides the Vertical → Sub-Vertical → Region context layer
 * that sits above SIVA Intelligence.
 */

// Types
export type {
  Vertical,
  SubVertical,
  BankingSubVertical,
  InsuranceSubVertical,
  RealEstateSubVertical,
  SaaSSubVertical,
  RegionContext,
  SalesContext,
  SalesConfig,
  CompanySize,
  SignalSensitivity,
  ProductKPI,
  SalesSignalType,
  SalesSignal,
  ContextFilter,
  SignalMatchPredicate,
} from './types';

export { DEFAULT_SALES_CONTEXT } from './types';

// Provider functions
export {
  // Context creation
  createSalesContext,
  updateSalesContext,

  // Filtering
  createContextFilter,
  signalMatchesContext,
  filterSignalsByContext,

  // Signal relevance
  getRelevantSignalsForSubVertical,
  scoreSignalRelevance,

  // Serialization
  serializeSalesContext,
  deserializeSalesContext,

  // Validation
  isValidSubVertical,
  getSubVerticalsForVertical,

  // Display helpers
  getVerticalDisplayName,
  getSubVerticalDisplayName,
  getSignalTypeDisplayName,
} from './SalesContextProvider';
