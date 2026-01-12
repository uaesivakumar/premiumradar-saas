'use client';

/**
 * EnrichmentPolicyEditor - S397
 *
 * Plain English enrichment policy editor for Control Plane.
 * This is where founders define how enrichment should behave for a sub-vertical.
 *
 * Features:
 * - Large textarea for plain English policy
 * - Character count and guidance
 * - Save button (updates os_sub_verticals.enrichment_policy_text)
 * - "Interpret Policy" button (triggers LLM interpretation → S398)
 * - Version indicator
 *
 * Part of Phase 1: Policy Compiler (Foundational)
 * Master Implementation Plan - LOCKED
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Sparkles, FileText, Clock, User } from 'lucide-react';

interface EnrichmentPolicyData {
  sub_vertical_id: string;
  sub_vertical_key?: string;
  sub_vertical_name?: string;
  enrichment_policy_text: string | null;
  enrichment_policy_version: number;
  enrichment_policy_updated_at: string | null;
  enrichment_policy_updated_by: string | null;
  has_pending_interpretation: boolean;
  active_policy_version_id: string | null;
  _migration_required?: boolean;
}

interface EnrichmentPolicyEditorProps {
  subVerticalId: string;
  subVerticalName?: string;
  onPolicyChanged?: (policy: string | null) => void;
  onInterpretRequest?: () => void;
}

const EXAMPLE_POLICY = `If company is large (500+ employees), prioritize:
- HR Head or Chief People Officer
- Payroll Manager or Director
- Benefits Coordinator

If company is mid-size (100-500 employees), focus on:
- HR Director or HR Manager
- Finance Director (if no HR leader found)

If company is small (<100 employees):
- Target Founder, CEO, or Managing Director directly
- Fall back to Finance Manager or Office Manager

If UAE presence is unclear, still enrich but mark as "needs verification".
If company is a government entity, skip enrichment entirely.`;

export function EnrichmentPolicyEditor({
  subVerticalId,
  subVerticalName,
  onPolicyChanged,
  onInterpretRequest,
}: EnrichmentPolicyEditorProps) {
  const [policyText, setPolicyText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [policyData, setPolicyData] = useState<EnrichmentPolicyData | null>(null);

  const hasChanges = policyText !== originalText;

  // Fetch current policy
  const fetchPolicy = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/enrichment-policy`
      );
      const data = await response.json();

      if (data.success) {
        setPolicyData(data.data);
        setPolicyText(data.data.enrichment_policy_text || '');
        setOriginalText(data.data.enrichment_policy_text || '');
      } else {
        setError(data.error || 'Failed to load policy');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [subVerticalId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  // Save policy
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/enrichment-policy`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enrichment_policy_text: policyText }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setOriginalText(policyText);
        setPolicyData(data.data);
        setSuccess(data.message || 'Policy saved successfully');
        onPolicyChanged?.(policyText || null);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.message || data.error || 'Failed to save policy');
      }
    } catch (err) {
      setError('Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  // Load example policy
  const handleLoadExample = () => {
    setPolicyText(EXAMPLE_POLICY);
  };

  // Clear policy
  const handleClear = () => {
    setPolicyText('');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading policy...</span>
        </CardContent>
      </Card>
    );
  }

  if (policyData?._migration_required) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800">Migration Required</CardTitle>
          <CardDescription className="text-amber-700">
            The enrichment policy feature requires a database migration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-amber-700">
            Run the following migration to enable this feature:
          </p>
          <pre className="mt-2 rounded bg-amber-100 p-2 text-xs text-amber-900">
            prisma/migrations/S397_enrichment_policy_text.sql
          </pre>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Enrichment Policy
              {policyData?.enrichment_policy_version ? (
                <Badge variant="outline" className="ml-2">
                  v{policyData.enrichment_policy_version}
                </Badge>
              ) : null}
            </CardTitle>
            <CardDescription className="mt-1">
              Define how contacts should be prioritized for{' '}
              <span className="font-medium">{subVerticalName || 'this sub-vertical'}</span>.
              Write in plain English — the system will interpret your rules.
            </CardDescription>
          </div>
          {policyData?.has_pending_interpretation && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Pending Review
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error/Success alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Policy textarea */}
        <div className="space-y-2">
          <Textarea
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            placeholder="Write your enrichment policy in plain English...

Example:
If company is large (500+ employees), prioritize HR Head and Payroll Manager.
If company is small (<100 employees), focus on Founder or Finance Manager."
            className="min-h-[300px] font-mono text-sm"
            disabled={saving}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{policyText.length} characters</span>
            <div className="flex gap-2">
              <button
                onClick={handleLoadExample}
                className="text-blue-600 hover:underline"
                type="button"
              >
                Load example
              </button>
              <span>·</span>
              <button
                onClick={handleClear}
                className="text-red-600 hover:underline"
                type="button"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Metadata */}
        {policyData?.enrichment_policy_updated_at && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last updated:{' '}
              {new Date(policyData.enrichment_policy_updated_at).toLocaleString()}
            </span>
            {policyData.enrichment_policy_updated_by && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                by {policyData.enrichment_policy_updated_by}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasChanges ? (
              <span className="text-amber-600">Unsaved changes</span>
            ) : policyText ? (
              <span className="text-green-600">Policy saved</span>
            ) : (
              <span>No policy defined</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Policy
            </Button>
            <Button
              onClick={onInterpretRequest}
              disabled={!policyText || hasChanges || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Interpret Policy
            </Button>
          </div>
        </div>

        {/* Guidance */}
        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <h4 className="font-medium mb-2">Writing effective policies:</h4>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Use clear conditions (company size, geography, industry)</li>
            <li>Specify target roles for each condition</li>
            <li>Include fallback behavior for edge cases</li>
            <li>State what should be skipped or deprioritized</li>
            <li>Write naturally — the AI will interpret your intent</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
