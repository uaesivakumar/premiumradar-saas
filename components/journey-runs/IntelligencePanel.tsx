/**
 * Intelligence Panel Component
 * Sprint S50: Journey Execution Viewer
 *
 * Displays OS S71 intelligence data for a journey (read-only)
 * Does not affect execution - purely informational
 */
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useJourneyIntelSummary } from '@/lib/journey-runs';
import type { JourneyIntelligenceSummary } from '@/lib/journey-runs';

interface IntelligencePanelProps {
  journeyId: string;
}

export function IntelligencePanel({ journeyId }: IntelligencePanelProps) {
  const { data, isLoading, error } = useJourneyIntelSummary(journeyId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Intelligence data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Intelligence</CardTitle>
          <Badge variant="outline" className="text-xs">
            OS S71
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Priority Score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Priority Score</span>
            <span className="text-sm font-semibold">{data.priority}/100</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${data.priority}%` }}
            />
          </div>
        </div>

        {/* Journey Health */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Journey Health</span>
            <span className="text-sm font-semibold">{data.journeyHealth}/100</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getHealthColor(data.journeyHealth)}`}
              style={{ width: `${data.journeyHealth}%` }}
            />
          </div>
        </div>

        {/* Persona Effectiveness */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">Persona Effectiveness</span>
            <span className="text-sm font-semibold">
              {data.personaEffectiveness}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${data.personaEffectiveness}%` }}
            />
          </div>
        </div>

        {/* Patterns */}
        {data.patterns.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Detected Patterns</p>
            <div className="flex flex-wrap gap-1">
              {data.patterns.map((pattern, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {pattern}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">Recommendations</p>
            <ul className="space-y-1">
              {data.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5">→</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Read-only notice */}
        <p className="text-xs text-gray-400 italic pt-2 border-t border-gray-100">
          Read-only view from OS Intelligence
        </p>
      </CardContent>
    </Card>
  );
}

function getHealthColor(health: number): string {
  if (health >= 80) return 'bg-green-500';
  if (health >= 60) return 'bg-yellow-500';
  if (health >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export default IntelligencePanel;
