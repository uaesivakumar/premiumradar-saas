'use client';

/**
 * MVT Version Diff Component (S256-F2)
 *
 * Side-by-side comparison of two MVT versions.
 * Highlights differences in buyer_role, decision_owner, signals, rules, and scenarios.
 */

interface Signal {
  signal_key: string;
  entity_type: string;
  justification: string;
}

interface KillRule {
  rule: string;
  action: string;
  reason: string;
}

interface SeedScenario {
  scenario_id: string;
  entry_intent: string;
}

interface MVTVersion {
  id: string;
  mvt_version: number;
  buyer_role: string;
  decision_owner: string;
  allowed_signals: Signal[];
  kill_rules: KillRule[];
  seed_scenarios: {
    golden: SeedScenario[];
    kill: SeedScenario[];
  };
  status: string;
  created_at: string;
}

interface MVTVersionDiffProps {
  version1: MVTVersion; // Newer version (left)
  version2: MVTVersion; // Older version (right)
  onClose: () => void;
}

export function MVTVersionDiff({ version1, version2, onClose }: MVTVersionDiffProps) {
  const isDifferent = (val1: unknown, val2: unknown): boolean => {
    return JSON.stringify(val1) !== JSON.stringify(val2);
  };

  const getDiffClass = (val1: unknown, val2: unknown): string => {
    return isDifferent(val1, val2) ? 'bg-yellow-50 border-l-4 border-yellow-400 pl-2' : '';
  };

  const formatArray = (arr: unknown[], key: string): string => {
    if (!Array.isArray(arr)) return '-';
    return arr.map(item => (item as Record<string, string>)[key] || JSON.stringify(item)).join(', ');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Version Comparison
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Headers */}
              <div className="bg-indigo-50 px-4 py-2 rounded-t-lg">
                <span className="font-semibold text-indigo-700">
                  Version {version1.mvt_version}
                </span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                  version1.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  version1.status === 'DEPRECATED' ? 'bg-gray-100 text-gray-600' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {version1.status}
                </span>
              </div>
              <div className="bg-gray-50 px-4 py-2 rounded-t-lg">
                <span className="font-semibold text-gray-700">
                  Version {version2.mvt_version}
                </span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                  version2.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  version2.status === 'DEPRECATED' ? 'bg-gray-100 text-gray-600' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {version2.status}
                </span>
              </div>

              {/* ICP Truth Triad */}
              <div className="col-span-2 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">ICP Truth Triad</h4>
              </div>

              {/* Buyer Role */}
              <div className={`p-3 rounded ${getDiffClass(version1.buyer_role, version2.buyer_role)}`}>
                <div className="text-xs text-gray-500 mb-1">Buyer Role</div>
                <div className="text-sm font-medium">{version1.buyer_role || '-'}</div>
              </div>
              <div className={`p-3 rounded ${getDiffClass(version1.buyer_role, version2.buyer_role)}`}>
                <div className="text-xs text-gray-500 mb-1">Buyer Role</div>
                <div className="text-sm font-medium">{version2.buyer_role || '-'}</div>
              </div>

              {/* Decision Owner */}
              <div className={`p-3 rounded ${getDiffClass(version1.decision_owner, version2.decision_owner)}`}>
                <div className="text-xs text-gray-500 mb-1">Decision Owner</div>
                <div className="text-sm font-medium">{version1.decision_owner || '-'}</div>
              </div>
              <div className={`p-3 rounded ${getDiffClass(version1.decision_owner, version2.decision_owner)}`}>
                <div className="text-xs text-gray-500 mb-1">Decision Owner</div>
                <div className="text-sm font-medium">{version2.decision_owner || '-'}</div>
              </div>

              {/* Allowed Signals */}
              <div className="col-span-2 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Allowed Signals</h4>
              </div>
              <div className={`p-3 rounded ${getDiffClass(version1.allowed_signals, version2.allowed_signals)}`}>
                <div className="text-xs text-gray-500 mb-1">
                  {version1.allowed_signals?.length || 0} signals
                </div>
                <div className="text-sm space-y-1">
                  {version1.allowed_signals?.map((s, i) => (
                    <div key={i} className="flex items-center">
                      <span className="font-mono text-xs bg-indigo-100 text-indigo-800 px-1 rounded">
                        {s.signal_key}
                      </span>
                      <span className="ml-2 text-xs text-gray-500 truncate" title={s.justification}>
                        {s.justification?.substring(0, 40)}...
                      </span>
                    </div>
                  )) || <span className="text-gray-400">-</span>}
                </div>
              </div>
              <div className={`p-3 rounded ${getDiffClass(version1.allowed_signals, version2.allowed_signals)}`}>
                <div className="text-xs text-gray-500 mb-1">
                  {version2.allowed_signals?.length || 0} signals
                </div>
                <div className="text-sm space-y-1">
                  {version2.allowed_signals?.map((s, i) => (
                    <div key={i} className="flex items-center">
                      <span className="font-mono text-xs bg-indigo-100 text-indigo-800 px-1 rounded">
                        {s.signal_key}
                      </span>
                      <span className="ml-2 text-xs text-gray-500 truncate" title={s.justification}>
                        {s.justification?.substring(0, 40)}...
                      </span>
                    </div>
                  )) || <span className="text-gray-400">-</span>}
                </div>
              </div>

              {/* Kill Rules */}
              <div className="col-span-2 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Kill Rules</h4>
              </div>
              <div className={`p-3 rounded ${getDiffClass(version1.kill_rules, version2.kill_rules)}`}>
                <div className="text-xs text-gray-500 mb-1">
                  {version1.kill_rules?.length || 0} rules
                </div>
                <div className="text-sm space-y-1">
                  {version1.kill_rules?.map((r, i) => (
                    <div key={i} className="flex items-center">
                      <span className="font-mono text-xs bg-red-100 text-red-800 px-1 rounded">
                        {r.rule}
                      </span>
                      <span className="ml-2 text-xs px-1 bg-gray-100 rounded">
                        {r.action}
                      </span>
                    </div>
                  )) || <span className="text-gray-400">-</span>}
                </div>
              </div>
              <div className={`p-3 rounded ${getDiffClass(version1.kill_rules, version2.kill_rules)}`}>
                <div className="text-xs text-gray-500 mb-1">
                  {version2.kill_rules?.length || 0} rules
                </div>
                <div className="text-sm space-y-1">
                  {version2.kill_rules?.map((r, i) => (
                    <div key={i} className="flex items-center">
                      <span className="font-mono text-xs bg-red-100 text-red-800 px-1 rounded">
                        {r.rule}
                      </span>
                      <span className="ml-2 text-xs px-1 bg-gray-100 rounded">
                        {r.action}
                      </span>
                    </div>
                  )) || <span className="text-gray-400">-</span>}
                </div>
              </div>

              {/* Seed Scenarios */}
              <div className="col-span-2 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Seed Scenarios</h4>
              </div>
              <div className={`p-3 rounded ${getDiffClass(version1.seed_scenarios, version2.seed_scenarios)}`}>
                <div className="text-xs text-gray-500 mb-1">
                  {version1.seed_scenarios?.golden?.length || 0} golden,{' '}
                  {version1.seed_scenarios?.kill?.length || 0} kill
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-green-700 text-xs font-medium">Golden:</div>
                  {version1.seed_scenarios?.golden?.map((s, i) => (
                    <div key={i} className="text-xs pl-2">{s.entry_intent}</div>
                  ))}
                  <div className="text-red-700 text-xs font-medium mt-2">Kill:</div>
                  {version1.seed_scenarios?.kill?.map((s, i) => (
                    <div key={i} className="text-xs pl-2">{s.entry_intent}</div>
                  ))}
                </div>
              </div>
              <div className={`p-3 rounded ${getDiffClass(version1.seed_scenarios, version2.seed_scenarios)}`}>
                <div className="text-xs text-gray-500 mb-1">
                  {version2.seed_scenarios?.golden?.length || 0} golden,{' '}
                  {version2.seed_scenarios?.kill?.length || 0} kill
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-green-700 text-xs font-medium">Golden:</div>
                  {version2.seed_scenarios?.golden?.map((s, i) => (
                    <div key={i} className="text-xs pl-2">{s.entry_intent}</div>
                  ))}
                  <div className="text-red-700 text-xs font-medium mt-2">Kill:</div>
                  {version2.seed_scenarios?.kill?.map((s, i) => (
                    <div key={i} className="text-xs pl-2">{s.entry_intent}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
