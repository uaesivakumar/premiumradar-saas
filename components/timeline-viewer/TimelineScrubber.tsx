/**
 * Timeline Scrubber Component
 * Sprint S51: Timeline Viewer
 *
 * Playback controls with scrubber bar, play/pause, speed controls.
 */
'use client';

import { useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatDuration } from '@/lib/timeline-viewer';
import type { PlaybackState } from '@/lib/timeline-viewer';

interface TimelineScrubberProps {
  currentTime: number;
  durationMs: number;
  playbackState: PlaybackState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
  onToggleLoop: () => void;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4];

export function TimelineScrubber({
  currentTime,
  durationMs,
  playbackState,
  onPlay,
  onPause,
  onStop,
  onSeek,
  onSpeedChange,
  onToggleLoop,
}: TimelineScrubberProps) {
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const progress = durationMs > 0 ? (currentTime / durationMs) * 100 : 0;

  // Handle scrubber click/drag
  const handleScrubberInteraction = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = x / rect.width;
    const time = percent * durationMs;
    onSeek(time);
  }, [durationMs, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleScrubberInteraction(e);

    const handleMouseMove = (e: MouseEvent) => {
      handleScrubberInteraction(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleScrubberInteraction]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        playbackState.isPlaying ? onPause() : onPlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 1000));
        break;
      case 'ArrowRight':
        e.preventDefault();
        onSeek(Math.min(durationMs, currentTime + 1000));
        break;
      case 'Home':
        e.preventDefault();
        onSeek(0);
        break;
      case 'End':
        e.preventDefault();
        onSeek(durationMs);
        break;
    }
  }, [playbackState.isPlaying, currentTime, durationMs, onPlay, onPause, onSeek]);

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Scrubber bar */}
      <div className="mb-4">
        <div
          ref={scrubberRef}
          className={cn(
            'relative h-4 bg-gray-100 rounded-full cursor-pointer',
            isDragging && 'cursor-grabbing'
          )}
          onMouseDown={handleMouseDown}
        >
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />

          {/* Scrubber handle */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4',
              'bg-white border-2 border-primary-500 rounded-full shadow',
              'transition-transform hover:scale-110',
              isDragging && 'scale-125'
            )}
            style={{ left: `${progress}%` }}
          />

          {/* Tick marks */}
          <div className="absolute top-full left-0 right-0 flex justify-between mt-1 px-0.5">
            {[0, 25, 50, 75, 100].map(percent => (
              <span key={percent} className="text-[9px] text-gray-400">
                {formatDuration(durationMs * (percent / 100))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Time display */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-gray-900">
            {formatDuration(currentTime)}
          </span>
          <span className="text-gray-400">/</span>
          <span className="font-mono text-gray-500">
            {formatDuration(durationMs)}
          </span>
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-2">
          {/* Stop button */}
          <button
            onClick={onStop}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Stop (Home)"
          >
            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>

          {/* Play/Pause button */}
          <button
            onClick={playbackState.isPlaying ? onPause : onPlay}
            className={cn(
              'p-3 rounded-full transition-colors',
              playbackState.isPlaying
                ? 'bg-primary-500 hover:bg-primary-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
            title={playbackState.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {playbackState.isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            )}
          </button>

          {/* Loop toggle */}
          <button
            onClick={onToggleLoop}
            className={cn(
              'p-2 rounded-full transition-colors',
              playbackState.loopEnabled
                ? 'bg-primary-100 text-primary-600'
                : 'hover:bg-gray-100 text-gray-400'
            )}
            title={playbackState.loopEnabled ? 'Disable loop' : 'Enable loop'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Speed control */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Speed:</span>
          <div className="flex items-center bg-gray-100 rounded-full">
            {SPEED_OPTIONS.map(speed => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={cn(
                  'px-2 py-1 text-xs rounded-full transition-colors',
                  playbackState.speed === speed
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-200'
                )}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="mt-3 text-[10px] text-gray-400 text-center">
        Space: Play/Pause | Arrow keys: Seek | Home/End: Jump to start/end
      </div>
    </div>
  );
}

export default TimelineScrubber;
