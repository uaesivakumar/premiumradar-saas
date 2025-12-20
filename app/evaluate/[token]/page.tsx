'use client';

/**
 * Evaluator Scoring Page
 *
 * Public page for human evaluators to score SIVA scenarios.
 * Access via unique token link (no login required).
 *
 * Flow:
 * 1. Evaluator receives email with unique link
 * 2. Opens link, sees current scenario
 * 3. Scores 8 CRS dimensions (1-5)
 * 4. Indicates would_pursue (YES/NO/MAYBE) + confidence
 * 5. Submits and moves to next scenario
 * 6. Sees completion screen when done
 */

import { useState, useEffect, useCallback, use } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Building2,
  User,
  Zap,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Clock,
  Target,
  SkipForward,
} from 'lucide-react';

interface ScenarioData {
  id: string;
  queue_position: number;
  path_type: string;
  company: Record<string, unknown>;
  contact: Record<string, unknown>;
  signals: Record<string, unknown>;
  persona: Record<string, unknown>;
  scenario: Record<string, unknown>;
  expected_outcome: string;
}

interface SessionData {
  name: string;
  suite_name: string;
  suite_description: string;
  vertical: string;
  sub_vertical: string;
  deadline: string;
}

interface Progress {
  completed: number;
  total: number;
  remaining: number;
  percentage: number;
}

interface EvaluatorData {
  status: 'IN_PROGRESS' | 'COMPLETED';
  evaluator_id: string;
  session: SessionData;
  progress: Progress;
  current_scenario: ScenarioData;
  scoring_instructions: {
    dimensions: Array<{ key: string; label: string; description: string }>;
    scale: string;
    overall: { would_pursue: string; confidence: string };
  };
}

const DIMENSION_KEYS = [
  'qualification',
  'needs_discovery',
  'value_articulation',
  'objection_handling',
  'process_adherence',
  'compliance',
  'relationship_building',
  'next_step_secured',
];

export default function EvaluatorPage({ params }: { params: Promise<{ token: string }> }) {
  // Use React 19's use() to unwrap the params Promise
  let token: string;
  try {
    const resolvedParams = use(params);
    token = resolvedParams.token;
  } catch (e) {
    // Fallback for older React versions or SSR issues
    token = '';
  }

  const [data, setData] = useState<EvaluatorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Score state
  const [scores, setScores] = useState<Record<string, number>>({});
  const [wouldPursue, setWouldPursue] = useState<'YES' | 'NO' | 'MAYBE' | null>(null);
  const [confidence, setConfidence] = useState<number>(3);
  const [notes, setNotes] = useState('');

  const fetchData = useCallback(async () => {
    if (!token) {
      setError('INVALID_TOKEN');
      setErrorMessage('Invalid evaluation link');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/evaluate/${token}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        // Reset form for new scenario
        setScores({});
        setWouldPursue(null);
        setConfidence(3);
        setNotes('');
        setStartTime(Date.now());
      } else {
        setError(result.error || 'UNKNOWN_ERROR');
        setErrorMessage(result.message || 'Failed to load evaluation');
      }
    } catch (err) {
      setError('NETWORK_ERROR');
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!data?.current_scenario) return;

    // Validate all dimensions scored
    for (const dim of DIMENSION_KEYS) {
      if (!scores[dim]) {
        alert(`Please score all dimensions. Missing: ${dim.replace('_', ' ')}`);
        return;
      }
    }

    if (!wouldPursue) {
      alert('Please indicate if you would pursue this lead.');
      return;
    }

    setIsSubmitting(true);
    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      const response = await fetch(`/api/evaluate/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_id: data.current_scenario.id,
          scores,
          would_pursue: wouldPursue,
          confidence,
          notes: notes || undefined,
          time_spent_seconds: timeSpent,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reload to get next scenario
        await fetchData();
      } else {
        alert(`Error: ${result.error || 'Failed to submit score'}`);
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!data?.current_scenario) return;

    if (!confirm('Are you sure you want to skip this scenario?')) return;

    try {
      await fetch(`/api/evaluate/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'skip',
          scenario_id: data.current_scenario.id,
        }),
      });
      await fetchData();
    } catch (err) {
      console.error('Skip error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading evaluation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Evaluation Unavailable</h1>
          <p className="text-neutral-400 mb-4">
            {errorMessage || 'This evaluation link is not valid or has expired.'}
          </p>
          <p className="text-neutral-500 text-sm">
            {error === 'INVITE_NOT_FOUND'
              ? 'No evaluation session found for this link. Please check your email for the correct link.'
              : error === 'INVITE_EXPIRED'
              ? 'This evaluation session has expired. Please contact your administrator for a new link.'
              : error === 'ALREADY_COMPLETED'
              ? 'You have already completed all scenarios in this evaluation session.'
              : 'If you believe this is an error, please contact your administrator.'}
          </p>
        </div>
      </div>
    );
  }

  if (data?.status === 'COMPLETED') {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="bg-neutral-900 rounded-lg border border-emerald-500/20 p-8 max-w-md text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">Evaluation Complete!</h1>
          <p className="text-neutral-400 mb-4">
            Thank you for completing all {data.progress?.completed || 0} scenarios.
            Your input is invaluable for calibrating our AI system.
          </p>
          <p className="text-neutral-500 text-sm">You can close this page now.</p>
        </div>
      </div>
    );
  }

  const scenario = data?.current_scenario;
  const session = data?.session;
  const progress = data?.progress;
  const instructions = data?.scoring_instructions;

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-white">{session?.suite_name || 'SIVA Evaluation'}</h1>
            <p className="text-neutral-500 text-sm">{session?.vertical} · {session?.sub_vertical}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-violet-400 font-medium">
              {progress?.completed || 0} / {progress?.total || 0}
            </div>
            <div className="text-xs text-neutral-500">scenarios completed</div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-neutral-800">
        <div
          className="h-full bg-violet-500 transition-all duration-300"
          style={{ width: `${progress?.percentage || 0}%` }}
        />
      </div>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Scenario Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Target className="w-4 h-4 text-violet-400" />
            <span className="text-neutral-400">Scenario {scenario?.queue_position}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              scenario?.path_type === 'GOLDEN' ? 'bg-emerald-500/20 text-emerald-400' :
              scenario?.path_type === 'KILL' ? 'bg-red-500/20 text-red-400' :
              'bg-neutral-700 text-neutral-400'
            }`}>
              {scenario?.path_type}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300"
          >
            <SkipForward className="w-3 h-3" />
            Skip
          </button>
        </div>

        {/* Scenario Context */}
        <div className="grid grid-cols-2 gap-4">
          {/* Company */}
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
              <Building2 className="w-4 h-4" />
              Company
            </div>
            <div className="text-white font-medium">
              {(scenario?.company as Record<string, unknown>)?.name as string || 'Unknown Company'}
            </div>
            <div className="text-sm text-neutral-500 mt-1">
              {(scenario?.company as Record<string, unknown>)?.industry as string || 'Industry not specified'}
            </div>
            {Boolean((scenario?.company as Record<string, unknown>)?.employee_count) && (
              <div className="text-xs text-neutral-600 mt-1">
                {String((scenario?.company as Record<string, unknown>)?.employee_count)} employees
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
            <div className="flex items-center gap-2 text-sm text-neutral-400 mb-2">
              <User className="w-4 h-4" />
              Contact
            </div>
            <div className="text-white font-medium">
              {(scenario?.contact as Record<string, unknown>)?.name as string || 'Unknown Contact'}
            </div>
            <div className="text-sm text-neutral-500 mt-1">
              {(scenario?.contact as Record<string, unknown>)?.title as string || 'Title not specified'}
            </div>
          </div>
        </div>

        {/* Signals */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
            <Zap className="w-4 h-4" />
            Signals Detected
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.isArray(scenario?.signals) && (scenario?.signals as Array<Record<string, unknown>>).map((signal, i) => (
              <span key={i} className="px-2 py-1 bg-violet-500/10 text-violet-400 rounded text-xs">
                {signal?.type as string || `Signal ${i + 1}`}
              </span>
            ))}
            {(!scenario?.signals || (Array.isArray(scenario?.signals) && scenario.signals.length === 0)) && (
              <span className="text-neutral-500 text-sm">No specific signals</span>
            )}
          </div>
        </div>

        {/* Scenario Details */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
          <h3 className="text-sm font-medium text-neutral-300 mb-2">Scenario Context</h3>
          <p className="text-neutral-400 text-sm whitespace-pre-wrap">
            {typeof scenario?.scenario === 'object'
              ? String((scenario?.scenario as Record<string, unknown>)?.description || '') || JSON.stringify(scenario?.scenario, null, 2)
              : String(scenario?.scenario || 'No additional context provided.')
            }
          </p>
        </div>

        {/* Scoring Section */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4">
          <h3 className="text-sm font-medium text-neutral-300 mb-4">
            Rate this lead (1 = Poor, 5 = Excellent)
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {instructions?.dimensions?.map((dim) => (
              <div key={dim.key} className="space-y-1">
                <label className="text-xs text-neutral-400">{dim.label}</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => setScores({ ...scores, [dim.key]: val })}
                      className={`flex-1 py-2 rounded text-sm transition-colors ${
                        scores[dim.key] === val
                          ? 'bg-violet-500 text-white'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-4 space-y-4">
          <h3 className="text-sm font-medium text-neutral-300">Overall Assessment</h3>

          {/* Would Pursue */}
          <div>
            <label className="text-xs text-neutral-400 block mb-2">
              Would you pursue this lead?
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setWouldPursue('YES')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded transition-colors ${
                  wouldPursue === 'YES'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                Yes
              </button>
              <button
                onClick={() => setWouldPursue('MAYBE')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded transition-colors ${
                  wouldPursue === 'MAYBE'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Maybe
              </button>
              <button
                onClick={() => setWouldPursue('NO')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded transition-colors ${
                  wouldPursue === 'NO'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                No
              </button>
            </div>
          </div>

          {/* Confidence */}
          <div>
            <label className="text-xs text-neutral-400 block mb-2">
              How confident are you in this assessment? (1 = Not confident, 5 = Very confident)
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => setConfidence(val)}
                  className={`flex-1 py-2 rounded text-sm transition-colors ${
                    confidence === val
                      ? 'bg-blue-500 text-white'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-neutral-400 block mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional thoughts on this lead..."
              className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500/50 resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || Object.keys(scores).length < 8 || !wouldPursue}
          className="w-full flex items-center justify-center gap-2 py-3 bg-violet-500 hover:bg-violet-600 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit & Next
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Footer */}
        <div className="text-center text-xs text-neutral-600 pb-8">
          <Clock className="w-3 h-3 inline mr-1" />
          {session?.deadline && (
            <>Deadline: {new Date(session.deadline).toLocaleDateString()}</>
          )}
        </div>
      </main>
    </div>
  );
}
