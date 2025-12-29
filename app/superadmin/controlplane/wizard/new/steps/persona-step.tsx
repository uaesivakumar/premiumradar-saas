'use client';

/**
 * Step 3: Persona & Region Scope (Governance Hardening v1.0)
 *
 * GOVERNANCE ENFORCEMENT:
 * - Region codes must come from hierarchy (no free-text) - REG-001
 * - LOCAL scope requires LOCAL-level region - REG-002
 * - REGIONAL scope requires REGIONAL-level region - REG-003
 * - GLOBAL scope must have NULL region_code - REG-004
 *
 * Fields:
 * - persona_key (snake_case)
 * - persona_name
 * - scope (required dropdown: GLOBAL | REGIONAL | LOCAL)
 * - region_code (dropdown from hierarchy, conditional on scope)
 * - mission (textarea)
 * - decision_lens (textarea)
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useWizard } from '../wizard-context';

// Region hierarchy types and data
interface RegionOption {
  code: string;
  name: string;
  level: 'GLOBAL' | 'REGIONAL' | 'LOCAL';
  parent?: string; // Parent region code for hierarchical selection
}

interface SubRegion {
  code: string;
  name: string;
}

// GOVERNANCE: Countries that require sub-region selection
const COUNTRIES_WITH_SUBREGIONS: Record<string, { label: string; regions: SubRegion[] }> = {
  'IN': {
    label: 'State',
    regions: [
      { code: 'IN-MH', name: 'Maharashtra' },
      { code: 'IN-KA', name: 'Karnataka' },
      { code: 'IN-TN', name: 'Tamil Nadu' },
      { code: 'IN-DL', name: 'Delhi' },
      { code: 'IN-GJ', name: 'Gujarat' },
      { code: 'IN-UP', name: 'Uttar Pradesh' },
      { code: 'IN-WB', name: 'West Bengal' },
      { code: 'IN-RJ', name: 'Rajasthan' },
      { code: 'IN-TG', name: 'Telangana' },
      { code: 'IN-AP', name: 'Andhra Pradesh' },
      { code: 'IN-KL', name: 'Kerala' },
      { code: 'IN-PB', name: 'Punjab' },
      { code: 'IN-HR', name: 'Haryana' },
      { code: 'IN-MP', name: 'Madhya Pradesh' },
      { code: 'IN-BR', name: 'Bihar' },
      { code: 'IN-OR', name: 'Odisha' },
      { code: 'IN-JH', name: 'Jharkhand' },
      { code: 'IN-CG', name: 'Chhattisgarh' },
      { code: 'IN-AS', name: 'Assam' },
      { code: 'IN-JK', name: 'Jammu & Kashmir' },
      { code: 'IN-UK', name: 'Uttarakhand' },
      { code: 'IN-HP', name: 'Himachal Pradesh' },
      { code: 'IN-GA', name: 'Goa' },
    ],
  },
  'AE': {
    label: 'Emirate',
    regions: [
      { code: 'AE-DU', name: 'Dubai' },
      { code: 'AE-AZ', name: 'Abu Dhabi' },
      { code: 'AE-SH', name: 'Sharjah' },
      { code: 'AE-AJ', name: 'Ajman' },
      { code: 'AE-UQ', name: 'Umm Al Quwain' },
      { code: 'AE-RK', name: 'Ras Al Khaimah' },
      { code: 'AE-FU', name: 'Fujairah' },
    ],
  },
  'US': {
    label: 'State',
    regions: [
      { code: 'US-CA', name: 'California' },
      { code: 'US-NY', name: 'New York' },
      { code: 'US-TX', name: 'Texas' },
      { code: 'US-FL', name: 'Florida' },
      { code: 'US-IL', name: 'Illinois' },
      { code: 'US-PA', name: 'Pennsylvania' },
      { code: 'US-OH', name: 'Ohio' },
      { code: 'US-GA', name: 'Georgia' },
      { code: 'US-NC', name: 'North Carolina' },
      { code: 'US-MI', name: 'Michigan' },
      { code: 'US-NJ', name: 'New Jersey' },
      { code: 'US-VA', name: 'Virginia' },
      { code: 'US-WA', name: 'Washington' },
      { code: 'US-AZ', name: 'Arizona' },
      { code: 'US-MA', name: 'Massachusetts' },
      { code: 'US-CO', name: 'Colorado' },
    ],
  },
  'SA': {
    label: 'Region',
    regions: [
      { code: 'SA-RY', name: 'Riyadh' },
      { code: 'SA-MK', name: 'Makkah' },
      { code: 'SA-MD', name: 'Madinah' },
      { code: 'SA-EP', name: 'Eastern Province' },
      { code: 'SA-QS', name: 'Qassim' },
      { code: 'SA-HA', name: "Ha'il" },
      { code: 'SA-TB', name: 'Tabuk' },
      { code: 'SA-JF', name: 'Jizan' },
      { code: 'SA-NJ', name: 'Najran' },
      { code: 'SA-AS', name: 'Asir' },
    ],
  },
};

// GOVERNANCE: Canonical region hierarchy (no free-text allowed)
const REGION_HIERARCHY: RegionOption[] = [
  // REGIONAL level
  { code: 'EMEA', name: 'Europe, Middle East & Africa', level: 'REGIONAL' },
  { code: 'APAC', name: 'Asia Pacific', level: 'REGIONAL' },
  { code: 'AMER', name: 'Americas', level: 'REGIONAL' },
  // LOCAL level - EMEA
  { code: 'AE', name: 'United Arab Emirates', level: 'LOCAL', parent: 'EMEA' },
  { code: 'SA', name: 'Saudi Arabia', level: 'LOCAL', parent: 'EMEA' },
  { code: 'EG', name: 'Egypt', level: 'LOCAL', parent: 'EMEA' },
  { code: 'UK', name: 'United Kingdom', level: 'LOCAL', parent: 'EMEA' },
  { code: 'DE', name: 'Germany', level: 'LOCAL', parent: 'EMEA' },
  { code: 'FR', name: 'France', level: 'LOCAL', parent: 'EMEA' },
  { code: 'QA', name: 'Qatar', level: 'LOCAL', parent: 'EMEA' },
  { code: 'KW', name: 'Kuwait', level: 'LOCAL', parent: 'EMEA' },
  { code: 'BH', name: 'Bahrain', level: 'LOCAL', parent: 'EMEA' },
  { code: 'OM', name: 'Oman', level: 'LOCAL', parent: 'EMEA' },
  // LOCAL level - APAC
  { code: 'IN', name: 'India', level: 'LOCAL', parent: 'APAC' },
  { code: 'SG', name: 'Singapore', level: 'LOCAL', parent: 'APAC' },
  { code: 'AU', name: 'Australia', level: 'LOCAL', parent: 'APAC' },
  { code: 'JP', name: 'Japan', level: 'LOCAL', parent: 'APAC' },
  { code: 'CN', name: 'China', level: 'LOCAL', parent: 'APAC' },
  { code: 'HK', name: 'Hong Kong', level: 'LOCAL', parent: 'APAC' },
  { code: 'MY', name: 'Malaysia', level: 'LOCAL', parent: 'APAC' },
  { code: 'ID', name: 'Indonesia', level: 'LOCAL', parent: 'APAC' },
  { code: 'TH', name: 'Thailand', level: 'LOCAL', parent: 'APAC' },
  { code: 'PH', name: 'Philippines', level: 'LOCAL', parent: 'APAC' },
  // LOCAL level - AMER
  { code: 'US', name: 'United States', level: 'LOCAL', parent: 'AMER' },
  { code: 'CA', name: 'Canada', level: 'LOCAL', parent: 'AMER' },
  { code: 'BR', name: 'Brazil', level: 'LOCAL', parent: 'AMER' },
  { code: 'MX', name: 'Mexico', level: 'LOCAL', parent: 'AMER' },
  { code: 'AR', name: 'Argentina', level: 'LOCAL', parent: 'AMER' },
  { code: 'CL', name: 'Chile', level: 'LOCAL', parent: 'AMER' },
  { code: 'CO', name: 'Colombia', level: 'LOCAL', parent: 'AMER' },
];

const SCOPES = [
  { value: 'GLOBAL', label: 'Global', description: 'Default fallback for all regions' },
  { value: 'REGIONAL', label: 'Regional', description: 'Covers a region family (e.g., EMEA, APAC)' },
  { value: 'LOCAL', label: 'Local', description: 'Specific to one region (e.g., UAE, US)' },
];

export function PersonaStep() {
  const { wizardState, updateWizardState, markStepComplete } = useWizard();

  const [key, setKey] = useState(wizardState.persona_key || '');
  const [name, setName] = useState(wizardState.persona_name || '');
  const [scope, setScope] = useState<'GLOBAL' | 'REGIONAL' | 'LOCAL'>(
    (wizardState.scope as 'GLOBAL' | 'REGIONAL' | 'LOCAL') || 'GLOBAL'
  );
  const [regionCode, setRegionCode] = useState(wizardState.region_code || '');
  const [subRegionCode, setSubRegionCode] = useState(''); // State/Emirate/Province
  const [mission, setMission] = useState('');
  const [decisionLens, setDecisionLens] = useState('');

  const [keyError, setKeyError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [subRegionError, setSubRegionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const isCreated = !!wizardState.persona_id;
  const showRegionCode = scope !== 'GLOBAL';

  // Check if selected country has sub-regions (states/emirates)
  const subRegionConfig = regionCode ? COUNTRIES_WITH_SUBREGIONS[regionCode] : null;
  const countryHasSubRegions = !!subRegionConfig;

  // GOVERNANCE: Filter regions by scope level (REG-002, REG-003)
  const availableRegions = useMemo(() => {
    if (scope === 'GLOBAL') return [];
    if (scope === 'REGIONAL') return REGION_HIERARCHY.filter(r => r.level === 'REGIONAL');
    if (scope === 'LOCAL') return REGION_HIERARCHY.filter(r => r.level === 'LOCAL');
    return [];
  }, [scope]);

  // Clear region code when switching scope
  useEffect(() => {
    if (scope === 'GLOBAL') {
      setRegionCode('');
      setSubRegionCode('');
      setRegionError(null);
      setSubRegionError(null);
    } else {
      // Validate current region code is valid for new scope
      const isValidForScope = availableRegions.some(r => r.code === regionCode);
      if (regionCode && !isValidForScope) {
        setRegionCode('');
        setSubRegionCode('');
      }
    }
  }, [scope, availableRegions, regionCode]);

  // Clear sub-region when country changes
  useEffect(() => {
    setSubRegionCode('');
    setSubRegionError(null);
  }, [regionCode]);

  const validateKey = useCallback((value: string) => {
    if (!value) {
      setKeyError('Key is required');
      return false;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(value)) {
      setKeyError('Must be lowercase snake_case');
      return false;
    }
    setKeyError(null);
    return true;
  }, []);

  const validateName = useCallback((value: string) => {
    if (!value.trim()) {
      setNameError('Name is required');
      return false;
    }
    setNameError(null);
    return true;
  }, []);

  const validateRegion = useCallback(() => {
    // REG-004: GLOBAL must have NULL region_code
    if (scope === 'GLOBAL') {
      if (regionCode) {
        setRegionError('GLOBAL scope cannot have a region code (REG-004)');
        return false;
      }
      setRegionError(null);
      setSubRegionError(null);
      return true;
    }

    // REG-002/REG-003: Non-GLOBAL must have valid region code
    if (!regionCode) {
      setRegionError(`${scope} scope requires a region code`);
      return false;
    }

    // REG-001: Must be from hierarchy
    const region = availableRegions.find(r => r.code === regionCode);
    if (!region) {
      setRegionError(`Invalid region code for ${scope} scope (REG-001)`);
      return false;
    }

    setRegionError(null);

    // For LOCAL scope with countries that have sub-regions, sub-region is required
    if (scope === 'LOCAL' && COUNTRIES_WITH_SUBREGIONS[regionCode]) {
      if (!subRegionCode) {
        const config = COUNTRIES_WITH_SUBREGIONS[regionCode];
        setSubRegionError(`${config.label} is required for ${region.name}`);
        return false;
      }
      // Validate sub-region is valid
      const validSubRegion = COUNTRIES_WITH_SUBREGIONS[regionCode].regions.find(
        r => r.code === subRegionCode
      );
      if (!validSubRegion) {
        setSubRegionError('Invalid sub-region selected');
        return false;
      }
    }

    setSubRegionError(null);
    return true;
  }, [scope, regionCode, subRegionCode, availableRegions]);

  const handleSubmit = useCallback(async () => {
    const keyValid = validateKey(key);
    const nameValid = validateName(name);
    const regionValid = validateRegion();

    if (!keyValid || !nameValid || !regionValid) return;

    setIsSubmitting(true);
    setServerError(null);

    // Determine the final region code to send
    // If sub-region is selected (e.g., IN-MH for Maharashtra), use that
    // Otherwise use the country/regional code (e.g., UAE, EMEA)
    let finalRegionCode: string | null = null;
    if (scope !== 'GLOBAL') {
      finalRegionCode = subRegionCode || regionCode;
    }

    try {
      const response = await fetch('/api/superadmin/controlplane/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sub_vertical_id: wizardState.sub_vertical_id,
          key,
          name,
          scope,
          region_code: finalRegionCode,
          mission: mission || null,
          decision_lens: decisionLens || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error === 'conflict') {
          setKeyError('This key already exists within the sub-vertical.');
        } else if (data.field === 'region_code') {
          setRegionError(data.message);
        } else {
          setServerError(data.message || 'Failed to create persona');
        }
        return;
      }

      // Success - also captures auto-created policy
      updateWizardState({
        persona_id: data.data.id,
        persona_key: data.data.key,
        persona_name: data.data.name,
        scope: data.data.scope,
        region_code: data.data.region_code,
        // Policy was auto-created as DRAFT
        policy_id: data.policy?.id || null,
        policy_version: data.policy?.policy_version || null,
        policy_status: data.policy?.status || 'DRAFT',
      });
      markStepComplete(3);
    } catch (error) {
      setServerError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    key,
    name,
    scope,
    regionCode,
    subRegionCode,
    mission,
    decisionLens,
    wizardState.sub_vertical_id,
    validateKey,
    validateName,
    validateRegion,
    updateWizardState,
    markStepComplete,
  ]);

  if (isCreated) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Persona Created</h2>
          <p className="text-sm text-gray-500 mt-1">
            This step is complete. A DRAFT policy was auto-created.
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-green-600 text-lg">✓</span>
            <span className="font-medium text-green-900">Persona Created</span>
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Key</dt>
              <dd className="font-mono text-gray-900">{wizardState.persona_key}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Name</dt>
              <dd className="text-gray-900">{wizardState.persona_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Scope</dt>
              <dd className="text-gray-900">{wizardState.scope}</dd>
            </div>
            {wizardState.region_code && (
              <div>
                <dt className="text-gray-500">Region</dt>
                <dd className="text-gray-900">{wizardState.region_code}</dd>
              </div>
            )}
            <div className="col-span-2">
              <dt className="text-gray-500">Policy Status</dt>
              <dd className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
                  {wizardState.policy_status}
                </span>
                <span className="text-xs text-gray-500">
                  (configure in next step)
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Persona & Region Scope</h2>
        <p className="text-sm text-gray-500 mt-1">
          Define the persona for {wizardState.sub_vertical_name || 'this sub-vertical'}.
        </p>
      </div>

      {/* Governance Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-blue-600">ℹ</span>
          <div>
            <p className="font-medium text-blue-800">Region Hierarchy Enforced</p>
            <p className="text-blue-700 mt-1">
              Regions must be selected from the predefined hierarchy.
              GLOBAL scope serves as fallback when no regional/local persona matches.
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {serverError}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="persona_key" className="block text-sm font-medium text-gray-700 mb-1">
              Persona Key
            </label>
            <input
              type="text"
              id="persona_key"
              value={key}
              onChange={(e) => {
                setKey(e.target.value.toLowerCase());
                validateKey(e.target.value.toLowerCase());
              }}
              placeholder="eb_rm"
              className={`w-full px-3 py-2 border rounded-lg font-mono text-sm text-gray-900 bg-white placeholder:text-gray-400 ${
                keyError ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isSubmitting}
            />
            {keyError && <p className="mt-1 text-xs text-red-600">{keyError}</p>}
          </div>

          <div>
            <label htmlFor="persona_name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              id="persona_name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateName(e.target.value);
              }}
              placeholder="Employee Banking RM"
              className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white placeholder:text-gray-400 ${
                nameError ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isSubmitting}
            />
            {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="scope" className="block text-sm font-medium text-gray-700 mb-1">
              Scope <span className="text-red-500">*</span>
            </label>
            <select
              id="scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as 'GLOBAL' | 'REGIONAL' | 'LOCAL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              {SCOPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {SCOPES.find((s) => s.value === scope)?.description}
            </p>
          </div>

          {showRegionCode && (
            <div>
              <label htmlFor="region_code" className="block text-sm font-medium text-gray-700 mb-1">
                {scope === 'LOCAL' ? 'Country' : 'Region'} <span className="text-red-500">*</span>
              </label>
              {/* GOVERNANCE: Dropdown instead of free-text (REG-001) */}
              <select
                id="region_code"
                value={regionCode}
                onChange={(e) => {
                  setRegionCode(e.target.value);
                  setRegionError(null);
                }}
                className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white ${
                  regionError ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={isSubmitting}
              >
                <option value="">Select {scope === 'LOCAL' ? 'country' : 'region'}...</option>
                {availableRegions.map((region) => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
              {regionError && <p className="mt-1 text-xs text-red-600">{regionError}</p>}
              <p className="mt-1 text-xs text-gray-500">
                {scope === 'REGIONAL' && 'Select a regional grouping (e.g., EMEA, APAC)'}
                {scope === 'LOCAL' && !countryHasSubRegions && 'Sales results will be scoped to this country'}
                {scope === 'LOCAL' && countryHasSubRegions && 'Select country, then choose state/region below'}
              </p>
            </div>
          )}
        </div>

        {/* Sub-region dropdown (State/Emirate/Province) - only for countries that have them */}
        {showRegionCode && scope === 'LOCAL' && subRegionConfig && (
          <div>
            <label htmlFor="sub_region_code" className="block text-sm font-medium text-gray-700 mb-1">
              {subRegionConfig.label} <span className="text-red-500">*</span>
            </label>
            <select
              id="sub_region_code"
              value={subRegionCode}
              onChange={(e) => {
                setSubRegionCode(e.target.value);
                setSubRegionError(null);
              }}
              className={`w-full px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white ${
                subRegionError ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isSubmitting}
            >
              <option value="">Select {subRegionConfig.label.toLowerCase()}...</option>
              {subRegionConfig.regions.map((subRegion) => (
                <option key={subRegion.code} value={subRegion.code}>
                  {subRegion.name}
                </option>
              ))}
            </select>
            {subRegionError && <p className="mt-1 text-xs text-red-600">{subRegionError}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Sales results will be scoped to this {subRegionConfig.label.toLowerCase()}.
              A salesperson in {subRegionConfig.regions[0]?.name} will only see results relevant to that area.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="mission" className="block text-sm font-medium text-gray-700 mb-1">
            Mission Statement (Optional)
          </label>
          <textarea
            id="mission"
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            placeholder="Define what this persona aims to achieve..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="decision_lens" className="block text-sm font-medium text-gray-700 mb-1">
            Decision Lens (Optional)
          </label>
          <textarea
            id="decision_lens"
            value={decisionLens}
            onChange={(e) => setDecisionLens(e.target.value)}
            placeholder="How does this persona evaluate opportunities..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !key ||
            !name ||
            (showRegionCode && !regionCode) ||
            (showRegionCode && scope === 'LOCAL' && countryHasSubRegions && !subRegionCode)
          }
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            isSubmitting ||
            !key ||
            !name ||
            (showRegionCode && !regionCode) ||
            (showRegionCode && scope === 'LOCAL' && countryHasSubRegions && !subRegionCode)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Creating...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
