/**
 * Workspace Core Components - S371/S372: Pageless Core Surface & Dynamic Left Rail
 *
 * These are the fundamental building blocks of the pageless workspace.
 * All rendering happens through cards, no chat bubbles.
 */

// S371: Core Surface
export { WorkspaceSurface } from './WorkspaceSurface';
export { CardContainer } from './CardContainer';
export { Card } from './Card';
export { CardActions } from './CardActions';
export { ContextBar } from './ContextBar';
export type { SystemStateType } from './ContextBar';
export { SystemState } from './SystemState';
export { CommandPalette } from './CommandPalette';

// S372: Dynamic Left Rail
export { LeftRail } from './LeftRail';
export { LeftRailSection } from './LeftRailSection';
export { LeftRailItem } from './LeftRailItem';
