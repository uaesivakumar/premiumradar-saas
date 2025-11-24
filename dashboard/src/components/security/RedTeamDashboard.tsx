/**
 * Sprint S4: Red Team Suite v1.0 - Attack Dashboard
 *
 * Displays real-time red team attack statistics and security metrics
 * Shows blocked attacks, threat categories, and vulnerability alerts
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface AttackStats {
  total: number;
  blocked: number;
  failed: number;
  blockRate: number;
}

interface CategoryStats {
  category: string;
  total: number;
  blocked: number;
  blockRate: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RedTeamData {
  overall: AttackStats;
  bySeverity: {
    critical: AttackStats;
    high: AttackStats;
    medium: AttackStats;
    low: AttackStats;
  };
  byCategory: CategoryStats[];
  recentAttacks: {
    timestamp: string;
    category: string;
    severity: string;
    blocked: boolean;
    threat: string;
  }[];
  vulnerabilities: string[];
  lastUpdated: string;
}

export default function RedTeamDashboard() {
  const [data, setData] = useState<RedTeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch red team statistics from API
    fetchRedTeamData();
    const interval = setInterval(fetchRedTeamData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchRedTeamData = async () => {
    try {
      // In production, fetch from /api/security/red-team-stats
      // For now, use mock data
      const mockData: RedTeamData = {
        overall: {
          total: 153,
          blocked: 151,
          failed: 2,
          blockRate: 98.69,
        },
        bySeverity: {
          critical: { total: 68, blocked: 68, failed: 0, blockRate: 100 },
          high: { total: 52, blocked: 52, failed: 0, blockRate: 100 },
          medium: { total: 23, blocked: 21, failed: 2, blockRate: 91.3 },
          low: { total: 10, blocked: 10, failed: 0, blockRate: 100 },
        },
        byCategory: [
          { category: 'jailbreak', total: 20, blocked: 20, blockRate: 100, severity: 'critical' },
          { category: 'meta_prompt', total: 15, blocked: 15, blockRate: 100, severity: 'critical' },
          { category: 'sql_injection', total: 15, blocked: 15, blockRate: 100, severity: 'critical' },
          { category: 'config_discovery', total: 10, blocked: 10, blockRate: 100, severity: 'critical' },
          { category: 'role_escalation', total: 15, blocked: 15, blockRate: 100, severity: 'critical' },
          { category: 'tool_hijacking', total: 10, blocked: 10, blockRate: 100, severity: 'critical' },
          { category: 'prompt_leak', total: 15, blocked: 15, blockRate: 100, severity: 'high' },
          { category: 'schema_leak', total: 10, blocked: 10, blockRate: 100, severity: 'high' },
          { category: 'cot_extraction', total: 15, blocked: 13, blockRate: 86.7, severity: 'medium' },
          { category: 'model_fingerprinting', total: 10, blocked: 9, blockRate: 90, severity: 'medium' },
        ],
        recentAttacks: [
          {
            timestamp: new Date(Date.now() - 5000).toISOString(),
            category: 'jailbreak',
            severity: 'critical',
            blocked: true,
            threat: 'Instruction override attempt',
          },
          {
            timestamp: new Date(Date.now() - 15000).toISOString(),
            category: 'sql_injection',
            severity: 'critical',
            blocked: true,
            threat: 'Table drop injection',
          },
          {
            timestamp: new Date(Date.now() - 25000).toISOString(),
            category: 'config_discovery',
            severity: 'critical',
            blocked: true,
            threat: 'API key extraction',
          },
        ],
        vulnerabilities: [],
        lastUpdated: new Date().toISOString(),
      };

      setData(mockData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch red team data:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load red team statistics</AlertDescription>
      </Alert>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getBlockRateColor = (rate: number) => {
    if (rate >= 99.5) return 'text-green-600';
    if (rate >= 95) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Red Team Security Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Real-time monitoring of 150+ attack patterns
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
        </Badge>
      </div>

      {/* Vulnerability Alerts */}
      {data.vulnerabilities.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>⚠️ Vulnerabilities Detected</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {data.vulnerabilities.map((vuln, idx) => (
                <li key={idx}>{vuln}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.overall.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              {data.overall.blocked}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 flex items-center gap-2">
              <XCircle className="h-6 w-6" />
              {data.overall.failed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Block Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold ${getBlockRateColor(data.overall.blockRate)}`}
            >
              {data.overall.blockRate.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Block Rates by Severity */}
      <Card>
        <CardHeader>
          <CardTitle>Block Rates by Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.bySeverity).map(([severity, stats]) => (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getSeverityColor(severity)}>
                    {severity.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {stats.blocked}/{stats.total} blocked
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stats.blockRate >= 99.5
                          ? 'bg-green-500'
                          : stats.blockRate >= 95
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${stats.blockRate}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-semibold ${getBlockRateColor(
                      stats.blockRate
                    )}`}
                  >
                    {stats.blockRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Block Rates by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Block Rates by Attack Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.byCategory
              .sort((a, b) => b.blockRate - a.blockRate)
              .map((cat) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getSeverityColor(cat.severity)}>
                      {cat.severity}
                    </Badge>
                    <span className="font-medium">{cat.category}</span>
                    <span className="text-xs text-gray-500">
                      ({cat.blocked}/{cat.total})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          cat.blockRate >= 99.5
                            ? 'bg-green-500'
                            : cat.blockRate >= 95
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${cat.blockRate}%` }}
                      />
                    </div>
                    <span
                      className={`text-sm font-semibold w-16 text-right ${getBlockRateColor(
                        cat.blockRate
                      )}`}
                    >
                      {cat.blockRate.toFixed(1)}%
                    </span>
                    {cat.blockRate >= 99.5 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Attack Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attack Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentAttacks.map((attack, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Badge className={getSeverityColor(attack.severity)}>
                    {attack.severity}
                  </Badge>
                  <div>
                    <div className="font-medium">{attack.category}</div>
                    <div className="text-xs text-gray-500">{attack.threat}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {new Date(attack.timestamp).toLocaleTimeString()}
                  </span>
                  {attack.blocked ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
