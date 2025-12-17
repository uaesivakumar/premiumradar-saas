/**
 * OS API Module
 *
 * Client-side hooks for connecting SaaS to UPR OS.
 *
 * Architecture: OS decides. SIVA reasons. SaaS renders.
 */

export {
  useDiscoveryStore,
  fetchPackConfig,
  type FeedbackAction,
  type Lead,
  type BatchResponse,
  type ConversationalPrompt,
  type SavedLead,
  type DiscoverySession,
  type PackConfig,
} from './discovery-api';
