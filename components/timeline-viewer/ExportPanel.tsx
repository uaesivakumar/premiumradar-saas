/**
 * Export Panel Component
 * Sprint S51: Timeline Viewer
 *
 * Export timeline data in various formats (JSON, CSV, PDF, PNG).
 */
'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import type { ExportFormat, ExportOptions, ExportResult } from '@/lib/timeline-viewer';

interface ExportPanelProps {
  onExport: (options: ExportOptions) => Promise<ExportResult>;
  onDownloadJSON: () => void;
  onDownloadCSV: () => void;
  onCopyToClipboard: () => Promise<boolean>;
  isExporting: boolean;
  journeyId: string;
  runId: string;
}

export function ExportPanel({
  onExport,
  onDownloadJSON,
  onDownloadCSV,
  onCopyToClipboard,
  isExporting,
  journeyId,
  runId,
}: ExportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Export options state
  const [format, setFormat] = useState<ExportFormat>('json');
  const [includeAILogs, setIncludeAILogs] = useState(true);
  const [includeContextSnapshots, setIncludeContextSnapshots] = useState(false);
  const [includePerformanceMetrics, setIncludePerformanceMetrics] = useState(true);
  const [includeErrors, setIncludeErrors] = useState(true);

  const handleExport = useCallback(async () => {
    const result = await onExport({
      format,
      includeAILogs,
      includeContextSnapshots,
      includePerformanceMetrics,
      includeErrors,
    });

    setLastResult(result);

    if (result.success && result.url) {
      // Trigger download
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(result.url);
    }
  }, [format, includeAILogs, includeContextSnapshots, includePerformanceMetrics, includeErrors, onExport]);

  const handleCopy = useCallback(async () => {
    const success = await onCopyToClipboard();
    setCopySuccess(success);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [onCopyToClipboard]);

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
          isOpen
            ? 'bg-primary-100 text-primary-700'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        )}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Export Timeline</h4>

            {/* Quick export buttons */}
            <div className="flex gap-2 mb-4">
              <QuickExportButton
                label="JSON"
                icon="📄"
                onClick={onDownloadJSON}
                disabled={isExporting}
              />
              <QuickExportButton
                label="CSV"
                icon="📊"
                onClick={onDownloadCSV}
                disabled={isExporting}
              />
              <QuickExportButton
                label="Copy"
                icon={copySuccess ? '✓' : '📋'}
                onClick={handleCopy}
                disabled={isExporting}
                success={copySuccess}
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="text-xs font-medium text-gray-500 mb-3">Advanced Export</div>

              {/* Format selection */}
              <div className="mb-3">
                <label className="text-xs text-gray-600">Format</label>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {(['json', 'csv', 'pdf', 'png'] as ExportFormat[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={cn(
                        'px-2 py-1.5 text-xs rounded transition-colors',
                        format === f
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include options */}
              <div className="space-y-2 mb-4">
                <ToggleOption
                  label="Include AI Logs"
                  description="Prompts, responses, token usage"
                  checked={includeAILogs}
                  onChange={setIncludeAILogs}
                />
                <ToggleOption
                  label="Include Context Snapshots"
                  description="Full context at each step"
                  checked={includeContextSnapshots}
                  onChange={setIncludeContextSnapshots}
                />
                <ToggleOption
                  label="Include Performance Metrics"
                  description="Timing, bottlenecks, costs"
                  checked={includePerformanceMetrics}
                  onChange={setIncludePerformanceMetrics}
                />
                <ToggleOption
                  label="Include Errors"
                  description="Error details and traces"
                  checked={includeErrors}
                  onChange={setIncludeErrors}
                />
              </div>

              {/* Export button */}
              <button
                onClick={handleExport}
                disabled={isExporting}
                className={cn(
                  'w-full py-2 text-sm font-medium rounded-lg transition-colors',
                  isExporting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-primary-500 text-white hover:bg-primary-600'
                )}
              >
                {isExporting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Exporting...
                  </span>
                ) : (
                  `Export as ${format.toUpperCase()}`
                )}
              </button>

              {/* Result message */}
              {lastResult && (
                <div className={cn(
                  'mt-3 p-2 rounded text-xs',
                  lastResult.success
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                )}>
                  {lastResult.success
                    ? `Exported: ${lastResult.filename} (${formatFileSize(lastResult.size)})`
                    : lastResult.error
                  }
                </div>
              )}
            </div>

            {/* Share section */}
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="text-xs font-medium text-gray-500 mb-3">Share Timeline</div>
              <ShareSection journeyId={journeyId} runId={runId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Quick export button
function QuickExportButton({
  label,
  icon,
  onClick,
  disabled,
  success,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  success?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-colors',
        success
          ? 'bg-green-100 text-green-700'
          : disabled
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      )}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs">{label}</span>
    </button>
  );
}

// Toggle option
function ToggleOption({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
      />
      <div>
        <div className="text-xs font-medium text-gray-700">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
    </label>
  );
}

// Share section
function ShareSection({ journeyId, runId }: { journeyId: string; runId: string }) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expiry, setExpiry] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [copied, setCopied] = useState(false);

  const generateShareLink = useCallback(async () => {
    setIsGenerating(true);
    // Stub implementation - would call API to create share link
    await new Promise(resolve => setTimeout(resolve, 500));
    const fakeUrl = `${window.location.origin}/share/timeline/${journeyId}/${runId}?token=abc123`;
    setShareUrl(fakeUrl);
    setIsGenerating(false);
  }, [journeyId, runId]);

  const copyShareLink = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  return (
    <div className="space-y-3">
      {/* Expiry selection */}
      <div>
        <label className="text-xs text-gray-600">Link expires in</label>
        <div className="grid grid-cols-4 gap-1 mt-1">
          {(['1h', '24h', '7d', '30d'] as const).map((e) => (
            <button
              key={e}
              onClick={() => setExpiry(e)}
              className={cn(
                'px-2 py-1 text-xs rounded transition-colors',
                expiry === e
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Generate or show link */}
      {shareUrl ? (
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5"
          />
          <button
            onClick={copyShareLink}
            className={cn(
              'px-3 py-1.5 text-xs rounded transition-colors',
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      ) : (
        <button
          onClick={generateShareLink}
          disabled={isGenerating}
          className={cn(
            'w-full py-2 text-xs font-medium rounded-lg transition-colors',
            isGenerating
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {isGenerating ? 'Generating...' : 'Generate Share Link'}
        </button>
      )}

      <div className="text-xs text-gray-400">
        Anyone with this link can view the timeline (read-only)
      </div>
    </div>
  );
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default ExportPanel;
