'use client';

/**
 * PolicyReviewPanel - S399
 *
 * Side-by-side view of original English policy and interpreted IPR.
 * Allows founder to:
 * - Review the interpretation
 * - Edit the IPR inline
 * - Approve or reject the interpretation
 *
 * Part of Phase 1: Policy Compiler (Foundational)
 * Master Implementation Plan - LOCKED
 */

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Code,
  Edit,
  Save,
  RotateCcw,
} from 'lucide-react';
import { IntermediatePolicyRepresentation } from '@/lib/policy/ipr-schema';

interface PolicyReviewData {
  sub_vertical: {
    id: string;
    key: string;
    name: string;
    current_policy_text: string | null;
  };
  pending_review: {
    version_id: string;
    version: number;
    policy_text: string;
    interpreted_ipr: IntermediatePolicyRepresentation;
    interpretation_confidence: number;
    interpretation_warnings: string[];
    interpreted_at: string;
    created_at: string;
    created_by: string;
  } | null;
  active_version: {
    version_id: string;
    version: number;
    policy_text: string;
    interpreted_ipr: IntermediatePolicyRepresentation;
    approved_by: string;
    approved_at: string;
  } | null;
  has_pending_review: boolean;
  has_active_version: boolean;
  needs_interpretation: boolean;
}

interface PolicyReviewPanelProps {
  subVerticalId: string;
  onApproved?: () => void;
  onRejected?: () => void;
}

export function PolicyReviewPanel({
  subVerticalId,
  onApproved,
  onRejected,
}: PolicyReviewPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PolicyReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedIPR, setEditedIPR] = useState<string>('');

  // Action states
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Fetch policy review data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/policy-review`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        if (result.data.pending_review?.interpreted_ipr) {
          setEditedIPR(JSON.stringify(result.data.pending_review.interpreted_ipr, null, 2));
        }
      } else {
        setError(result.error || 'Failed to load policy review');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [subVerticalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle approval
  const handleApprove = async () => {
    if (!data?.pending_review) return;

    setApproving(true);
    setError(null);
    setSuccess(null);

    try {
      // Parse edited IPR if editing
      let iprToSubmit = undefined;
      if (isEditing) {
        try {
          iprToSubmit = JSON.parse(editedIPR);
        } catch {
          setError('Invalid JSON in edited interpretation');
          setApproving(false);
          return;
        }
      }

      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/policy-review/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            version_id: data.pending_review.version_id,
            edited_ipr: iprToSubmit,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        setIsEditing(false);
        await fetchData();
        onApproved?.();
      } else {
        setError(result.message || result.error || 'Failed to approve');
      }
    } catch (err) {
      setError('Failed to approve policy');
    } finally {
      setApproving(false);
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (!data?.pending_review || !rejectionReason.trim()) return;

    setRejecting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/superadmin/controlplane/sub-verticals/${subVerticalId}/policy-review/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            version_id: data.pending_review.version_id,
            rejection_reason: rejectionReason,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        setShowRejectForm(false);
        setRejectionReason('');
        await fetchData();
        onRejected?.();
      } else {
        setError(result.message || result.error || 'Failed to reject');
      }
    } catch (err) {
      setError('Failed to reject policy');
    } finally {
      setRejecting(false);
    }
  };

  // Format IPR for display
  const formatIPRForDisplay = (ipr: IntermediatePolicyRepresentation) => {
    const sections: string[] = [];

    // Thresholds
    if (ipr.thresholds?.length > 0) {
      sections.push('## Thresholds');
      ipr.thresholds.forEach((t) => {
        sections.push(`- ${t.name}: ${t.comparison} ${t.value} ${t.unit}`);
      });
    }

    // Target Roles
    if (ipr.target_roles?.length > 0) {
      sections.push('\n## Target Roles');
      ipr.target_roles.forEach((r, i) => {
        const sizeRange = r.company_size_range;
        const rangeText = sizeRange.min && sizeRange.max
          ? `${sizeRange.min}-${sizeRange.max}`
          : sizeRange.min
          ? `${sizeRange.min}+`
          : `<${sizeRange.max}`;
        sections.push(`\n### Rule ${i + 1} (Priority ${r.priority})`);
        sections.push(`Company size: ${rangeText} employees`);
        sections.push(`Titles: ${r.titles.join(', ')}`);
        sections.push(`Reason: ${r.reason}`);
      });
    }

    // Skip Rules
    if (ipr.skip_rules?.length > 0) {
      sections.push('\n## Skip Rules');
      ipr.skip_rules.forEach((s) => {
        sections.push(`- Skip if ${s.condition.field} ${s.condition.operator} ${s.condition.value}`);
        sections.push(`  Reason: ${s.reason}`);
      });
    }

    // Fallback
    if (ipr.fallback_behavior) {
      sections.push('\n## Fallback Behavior');
      sections.push(`When no match: ${ipr.fallback_behavior.when_no_match}`);
      if (ipr.fallback_behavior.default_roles?.length) {
        sections.push(`Default roles: ${ipr.fallback_behavior.default_roles.join(', ')}`);
      }
    }

    // Uncertainty
    if (ipr.uncertainty_handling) {
      sections.push('\n## Uncertainty Handling');
      sections.push(`When size unknown: ${ipr.uncertainty_handling.when_size_unknown}`);
      sections.push(`When geography unclear: ${ipr.uncertainty_handling.when_geography_unclear}`);
    }

    return sections.join('\n');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading policy review...</span>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Failed to load policy review'}</AlertDescription>
      </Alert>
    );
  }

  // No pending review and no active version
  if (!data.pending_review && !data.active_version) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-medium">No Policy to Review</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.needs_interpretation
              ? 'Click "Interpret Policy" to generate a structured interpretation.'
              : 'Write an enrichment policy first, then interpret it.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const reviewData = data.pending_review;
  const activeData = data.active_version;

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Pending Review */}
      {reviewData && (
        <Card className="border-amber-200">
          <CardHeader className="bg-amber-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Pending Review
                  <Badge variant="outline" className="ml-2">
                    v{reviewData.version}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Review the interpretation and approve or reject it.
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className={
                  reviewData.interpretation_confidence >= 0.7
                    ? 'bg-green-100 text-green-800'
                    : reviewData.interpretation_confidence >= 0.5
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }
              >
                {Math.round(reviewData.interpretation_confidence * 100)}% confidence
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Warnings */}
            {reviewData.interpretation_warnings?.length > 0 && (
              <div className="border-b bg-amber-50/50 p-4">
                <h4 className="text-sm font-medium text-amber-800 mb-2">Interpretation Warnings:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  {reviewData.interpretation_warnings.map((w, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Side-by-side view */}
            <div className="grid grid-cols-2 divide-x">
              {/* Original English */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">Original Policy (English)</h4>
                </div>
                <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded p-3 max-h-[400px] overflow-auto">
                  {reviewData.policy_text}
                </pre>
              </div>

              {/* Interpreted IPR */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Interpreted Rules (IPR)</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? (
                      <>
                        <RotateCcw className="mr-1 h-3 w-3" />
                        Cancel Edit
                      </>
                    ) : (
                      <>
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>

                {isEditing ? (
                  <Textarea
                    value={editedIPR}
                    onChange={(e) => setEditedIPR(e.target.value)}
                    className="font-mono text-xs min-h-[400px]"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded p-3 max-h-[400px] overflow-auto">
                    {formatIPRForDisplay(reviewData.interpreted_ipr)}
                  </pre>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t p-4 bg-muted/20">
              {showRejectForm ? (
                <div className="space-y-3">
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Why are you rejecting this interpretation?"
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={!rejectionReason.trim() || rejecting}
                    >
                      {rejecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm Rejection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Approving makes this the active policy. Rejecting allows you to edit and re-interpret.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectForm(true)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={approving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {approving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve{isEditing ? ' (with edits)' : ''}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Version (if no pending) */}
      {activeData && !reviewData && (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Active Policy
                  <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                    v{activeData.version}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Approved by {activeData.approved_by} on{' '}
                  {new Date(activeData.approved_at).toLocaleString()}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-x">
              <div className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Original Policy
                </h4>
                <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded p-3 max-h-[300px] overflow-auto">
                  {activeData.policy_text}
                </pre>
              </div>
              <div className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  Approved Interpretation
                </h4>
                <pre className="whitespace-pre-wrap text-sm bg-muted/30 rounded p-3 max-h-[300px] overflow-auto">
                  {formatIPRForDisplay(activeData.interpreted_ipr)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
