/**
 * Replay Runner
 * Sprint S52: Replay Engine
 *
 * Deterministic replay of journey executions.
 * Uses stored data only - NEVER calls external LLMs or triggers actions.
 */
import type { JourneyRunDetails } from '@/lib/journey-runs';
import type {
  ReplayConfig,
  ReplayState,
  ReplayEvent,
  ReplayStep,
  ReplayTimeline,
  ReplayCallbacks,
  ReplaySpeed,
} from './types';
import {
  DEFAULT_REPLAY_CONFIG,
  DEFAULT_REPLAY_STATE,
  getSpeedMultiplier,
  calculateSimulatedDelay,
} from './types';
import { buildReplayTimeline, buildReplaySummary } from './replay-timeline-builder';

// =============================================================================
// REPLAY RUNNER CLASS
// =============================================================================

export class ReplayRunner {
  private timeline: ReplayTimeline | null = null;
  private state: ReplayState;
  private callbacks: ReplayCallbacks;
  private animationFrame: number | null = null;
  private lastTickTime: number = 0;
  private isPaused: boolean = false;

  constructor(runId: string, callbacks: ReplayCallbacks = {}) {
    this.state = {
      ...DEFAULT_REPLAY_STATE,
      runId,
      config: { ...DEFAULT_REPLAY_CONFIG },
    };
    this.callbacks = callbacks;
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Load journey run details and build replay timeline
   */
  async load(details: JourneyRunDetails): Promise<void> {
    this.state.status = 'loading';

    try {
      // Build the replay timeline from run details
      this.timeline = buildReplayTimeline(details);

      // Update state
      this.state.totalSteps = this.timeline.steps.length;
      this.state.totalEvents = this.timeline.events.length;
      this.state.totalDurationMs = this.timeline.totalDurationMs;
      this.state.status = 'ready';
    } catch (error) {
      this.state.status = 'error';
      this.state.error = error instanceof Error ? error.message : 'Failed to load replay';
      this.callbacks.onError?.(this.state.error);
      throw error;
    }
  }

  /**
   * Configure replay options
   */
  configure(config: Partial<ReplayConfig>): void {
    this.state.config = { ...this.state.config, ...config };
  }

  // ===========================================================================
  // PLAYBACK CONTROLS
  // ===========================================================================

  /**
   * Start or resume replay playback
   */
  play(): void {
    if (!this.timeline) {
      throw new Error('Replay not loaded. Call load() first.');
    }

    if (this.state.status === 'completed') {
      // Reset to beginning if completed
      this.reset();
    }

    this.isPaused = false;
    this.state.status = 'playing';
    this.lastTickTime = performance.now();

    if (this.state.currentEventIndex === 0) {
      this.callbacks.onStart?.();
    } else {
      this.callbacks.onResume?.();
    }

    // Start the animation loop
    this.scheduleNextTick();
  }

  /**
   * Pause replay playback
   */
  pause(): void {
    this.isPaused = true;
    this.state.status = 'paused';

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.callbacks.onPause?.();
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    if (this.state.status === 'playing') {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Step forward one event
   */
  stepForward(): void {
    if (!this.timeline) return;

    this.state.status = 'stepping';

    if (this.state.currentEventIndex < this.timeline.events.length) {
      this.processEvent(this.timeline.events[this.state.currentEventIndex]);
      this.state.currentEventIndex++;
      this.updateProgress();
    }

    if (this.state.currentEventIndex >= this.timeline.events.length) {
      this.complete();
    } else {
      this.state.status = 'paused';
    }
  }

  /**
   * Step backward one event
   */
  stepBackward(): void {
    if (!this.timeline || this.state.currentEventIndex <= 0) return;

    this.state.status = 'stepping';
    this.state.currentEventIndex--;

    // Recalculate current time based on event timestamp
    const event = this.timeline.events[this.state.currentEventIndex];
    this.state.currentTimeMs = event.timestamp;

    // Update current step index
    this.updateCurrentStepIndex();
    this.updateProgress();

    this.state.status = 'paused';
  }

  /**
   * Jump to a specific step
   */
  jumpToStep(stepIndex: number): void {
    if (!this.timeline) return;

    const step = this.timeline.steps[stepIndex];
    if (!step) return;

    // Find the first event for this step
    const eventIndex = this.timeline.events.findIndex(
      e => e.stepId === step.stepId && e.type === 'step:start'
    );

    if (eventIndex >= 0) {
      this.state.currentEventIndex = eventIndex;
      this.state.currentStepIndex = stepIndex;
      this.state.currentTimeMs = this.timeline.events[eventIndex].timestamp;
      this.updateProgress();
    }
  }

  /**
   * Jump to a specific time
   */
  jumpToTime(timeMs: number): void {
    if (!this.timeline) return;

    // Find the last event before or at this time
    let eventIndex = 0;
    for (let i = 0; i < this.timeline.events.length; i++) {
      if (this.timeline.events[i].timestamp <= timeMs) {
        eventIndex = i;
      } else {
        break;
      }
    }

    this.state.currentEventIndex = eventIndex;
    this.state.currentTimeMs = timeMs;
    this.updateCurrentStepIndex();
    this.updateProgress();
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: ReplaySpeed): void {
    this.state.config.speed = speed;
  }

  /**
   * Reset replay to beginning
   */
  reset(): void {
    this.pause();
    this.state.currentEventIndex = 0;
    this.state.currentStepIndex = 0;
    this.state.currentTimeMs = 0;
    this.state.progress = 0;
    this.state.status = 'ready';
  }

  // ===========================================================================
  // INTERNAL PLAYBACK LOOP
  // ===========================================================================

  private scheduleNextTick(): void {
    if (this.isPaused || !this.timeline) return;

    this.animationFrame = requestAnimationFrame(() => this.tick());
  }

  private tick(): void {
    if (this.isPaused || !this.timeline) return;

    const now = performance.now();
    const deltaMs = now - this.lastTickTime;
    this.lastTickTime = now;

    // Calculate time advancement based on speed
    const speedMultiplier = getSpeedMultiplier(this.state.config.speed);
    const timeAdvance = speedMultiplier === Infinity ? Infinity : deltaMs * speedMultiplier;

    // Update current time
    const newTime = Math.min(
      this.state.currentTimeMs + timeAdvance,
      this.state.totalDurationMs
    );
    this.state.currentTimeMs = newTime;

    // Process events up to current time
    this.processEventsUpToTime(newTime);

    // Update progress
    this.updateProgress();

    // Notify time update
    this.callbacks.onTimeUpdate?.(this.state.currentTimeMs);

    // Check for completion
    if (this.state.currentEventIndex >= this.timeline.events.length) {
      this.complete();
      return;
    }

    // Check for stop-at-step
    if (this.state.config.stopAtStep) {
      const currentStep = this.timeline.steps[this.state.currentStepIndex];
      if (currentStep?.stepId === this.state.config.stopAtStep) {
        this.pause();
        return;
      }
    }

    // Schedule next tick
    this.scheduleNextTick();
  }

  private processEventsUpToTime(timeMs: number): void {
    if (!this.timeline) return;

    const speed = this.state.config.speed;
    const isInstant = speed === 'instant';

    while (this.state.currentEventIndex < this.timeline.events.length) {
      const event = this.timeline.events[this.state.currentEventIndex];

      if (!isInstant && event.timestamp > timeMs) {
        break;
      }

      this.processEvent(event);
      this.state.currentEventIndex++;
    }
  }

  private processEvent(event: ReplayEvent): void {
    // Notify event callback
    this.callbacks.onEvent?.(event);

    // Handle specific event types
    switch (event.type) {
      case 'step:start':
        this.updateCurrentStepIndex();
        const startStep = this.timeline?.steps[this.state.currentStepIndex];
        if (startStep) {
          this.callbacks.onStepStart?.(startStep);
        }
        break;

      case 'step:complete':
      case 'step:fail':
      case 'step:skip':
        const endStep = this.timeline?.steps[this.state.currentStepIndex];
        if (endStep) {
          this.callbacks.onStepEnd?.(endStep);
          if (event.type === 'step:fail') {
            const failEvent = event as { data: { error: unknown } };
            this.callbacks.onStepError?.(endStep, failEvent.data.error as any);
          }
        }
        break;

      case 'ai:decision':
        this.callbacks.onDecision?.(event as any);
        break;

      case 'fallback:trigger':
        this.callbacks.onFallback?.(event as any);
        break;

      case 'context:change':
        this.callbacks.onContextChange?.(event as any);
        break;
    }

    // Update progress callback
    this.callbacks.onProgress?.(
      this.state.progress,
      this.state.currentStepIndex,
      this.state.totalSteps
    );
  }

  private complete(): void {
    this.state.status = 'completed';

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.callbacks.onComplete?.();

    // Handle loop
    if (this.state.config.loopEnabled) {
      this.reset();
      this.play();
    }
  }

  private updateCurrentStepIndex(): void {
    if (!this.timeline) return;

    // Find the step that contains the current time
    for (let i = 0; i < this.timeline.steps.length; i++) {
      const step = this.timeline.steps[i];
      if (
        this.state.currentTimeMs >= step.startTime &&
        this.state.currentTimeMs <= step.endTime
      ) {
        this.state.currentStepIndex = i;
        return;
      }
    }
  }

  private updateProgress(): void {
    if (this.state.totalDurationMs > 0) {
      this.state.progress = Math.round(
        (this.state.currentTimeMs / this.state.totalDurationMs) * 100
      );
    }
  }

  // ===========================================================================
  // STATE ACCESS
  // ===========================================================================

  /**
   * Get current replay state
   */
  getState(): ReplayState {
    return { ...this.state };
  }

  /**
   * Get replay timeline
   */
  getTimeline(): ReplayTimeline | null {
    return this.timeline;
  }

  /**
   * Get current step
   */
  getCurrentStep(): ReplayStep | null {
    return this.timeline?.steps[this.state.currentStepIndex] ?? null;
  }

  /**
   * Get current event
   */
  getCurrentEvent(): ReplayEvent | null {
    return this.timeline?.events[this.state.currentEventIndex] ?? null;
  }

  /**
   * Get events for a specific step
   */
  getEventsForStep(stepId: string): ReplayEvent[] {
    return this.timeline?.events.filter(e => e.stepId === stepId) ?? [];
  }

  /**
   * Get all events up to current position
   */
  getProcessedEvents(): ReplayEvent[] {
    return this.timeline?.events.slice(0, this.state.currentEventIndex) ?? [];
  }

  /**
   * Check if replay is playing
   */
  isPlaying(): boolean {
    return this.state.status === 'playing';
  }

  /**
   * Check if replay is paused
   */
  isPausedState(): boolean {
    return this.state.status === 'paused';
  }

  /**
   * Check if replay is completed
   */
  isCompleted(): boolean {
    return this.state.status === 'completed';
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Dispose of the replay runner
   */
  dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.timeline = null;
    this.callbacks = {};
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a replay runner for a journey run
 */
export function createReplayRunner(
  runId: string,
  callbacks?: ReplayCallbacks
): ReplayRunner {
  return new ReplayRunner(runId, callbacks);
}

/**
 * Run a full replay and return all events (for API use)
 */
export async function runReplay(
  details: JourneyRunDetails,
  config?: Partial<ReplayConfig>
): Promise<{
  timeline: ReplayTimeline;
  events: ReplayEvent[];
  summary: ReturnType<typeof buildReplaySummary>;
}> {
  const timeline = buildReplayTimeline(details);
  const summary = buildReplaySummary(details, timeline);

  // Filter events based on config
  let events = timeline.events;

  if (config?.startFromStep) {
    const startIndex = events.findIndex(
      e => e.stepId === config.startFromStep && e.type === 'step:start'
    );
    if (startIndex >= 0) {
      events = events.slice(startIndex);
    }
  }

  if (config?.stopAtStep) {
    const stopIndex = events.findIndex(
      e => e.stepId === config.stopAtStep && (e.type === 'step:complete' || e.type === 'step:fail')
    );
    if (stopIndex >= 0) {
      events = events.slice(0, stopIndex + 1);
    }
  }

  return { timeline, events, summary };
}
