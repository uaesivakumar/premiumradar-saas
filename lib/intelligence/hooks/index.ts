/**
 * Intelligence Wrapper Hooks - Stream 13
 *
 * CRITICAL: These hooks are the ONLY way Stream 13 integrates with existing code.
 *
 * Pattern:
 *   useIntentWrapper().processQuery(query)  → wraps submitQuery
 *   useRoutingWrapper().routeToAgent(intent) → wraps agent selection
 *   useEvidenceWrapper().enrichOutput(obj)   → wraps output creation
 *   usePersonaWrapper().applyTone(message)   → wraps message formatting
 *
 * FORBIDDEN:
 *   ❌ Direct calls to submitQuery()
 *   ❌ Direct calls to handleAgentSelection()
 *   ❌ Direct calls to handleOutputObjectCreation()
 */

export { useIntentWrapper } from './useIntentWrapper';
export { useRoutingWrapper } from './useRoutingWrapper';
export { useEvidenceWrapper } from './useEvidenceWrapper';
export { usePersonaWrapper } from './usePersonaWrapper';
