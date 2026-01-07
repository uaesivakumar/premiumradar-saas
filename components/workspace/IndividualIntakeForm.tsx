/**
 * Individual Intake Form Component
 *
 * S366: Intake Form
 * Behavior Contract B016: Intake validates before save
 *
 * Form for adding individual leads with real-time validation
 * and duplicate detection.
 */

'use client';

import React, { useState, useCallback } from 'react';

export interface IntakeFormData {
  companyName: string;
  companyDomain: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactTitle: string;
  region: string;
  vertical: string;
  subVertical: string;
  notes: string;
  source: string;
}

export interface DuplicateWarning {
  companyName: string;
  similarity: number;
  leadId: string;
}

export interface IntakeFormProps {
  onSubmit: (data: IntakeFormData) => Promise<{ success: boolean; message: string; leadId?: string }>;
  onCheckDuplicate?: (data: Partial<IntakeFormData>) => Promise<DuplicateWarning[]>;
  verticals?: { value: string; label: string }[];
  regions?: { value: string; label: string }[];
  sources?: { value: string; label: string }[];
  isLoading?: boolean;
  className?: string;
}

const defaultVerticals = [
  { value: 'banking', label: 'Banking' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'real_estate', label: 'Real Estate' },
];

const defaultRegions = [
  { value: 'UAE', label: 'UAE' },
  { value: 'KSA', label: 'Saudi Arabia' },
  { value: 'QAT', label: 'Qatar' },
  { value: 'KWT', label: 'Kuwait' },
  { value: 'BHR', label: 'Bahrain' },
  { value: 'OMN', label: 'Oman' },
];

const defaultSources = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'referral', label: 'Referral' },
  { value: 'event', label: 'Event/Conference' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'website', label: 'Website Form' },
  { value: 'cold_outreach', label: 'Cold Outreach' },
];

export function IndividualIntakeForm({
  onSubmit,
  onCheckDuplicate,
  verticals = defaultVerticals,
  regions = defaultRegions,
  sources = defaultSources,
  isLoading = false,
  className = '',
}: IntakeFormProps) {
  const [formData, setFormData] = useState<IntakeFormData>({
    companyName: '',
    companyDomain: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactTitle: '',
    region: '',
    vertical: 'banking',
    subVertical: '',
    notes: '',
    source: 'manual',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof IntakeFormData, string>>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateWarning[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

  // Real-time validation
  const validate = useCallback((data: IntakeFormData): boolean => {
    const newErrors: Partial<Record<keyof IntakeFormData, string>> = {};
    const newWarnings: string[] = [];

    // Required: Company name
    if (!data.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    // Email validation
    if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }

    // Domain validation
    if (data.companyDomain) {
      const domain = data.companyDomain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
      if (!/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(domain)) {
        newWarnings.push('Company domain may be invalid');
      }
    }

    // Infer domain from email
    if (!data.companyDomain && data.contactEmail) {
      const emailDomain = data.contactEmail.split('@')[1];
      if (emailDomain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailDomain)) {
        newWarnings.push(`Domain will be inferred from email: ${emailDomain}`);
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);

    return Object.keys(newErrors).length === 0;
  }, []);

  // Check for duplicates when company name changes
  const checkDuplicates = useCallback(async (companyName: string, domain?: string) => {
    if (!onCheckDuplicate || companyName.length < 3) {
      setDuplicates([]);
      return;
    }

    try {
      const results = await onCheckDuplicate({ companyName, companyDomain: domain });
      setDuplicates(results);
    } catch {
      // Silently fail duplicate check
      setDuplicates([]);
    }
  }, [onCheckDuplicate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    validate(newData);
    setSubmitResult(null);

    // Check duplicates on company name or domain change
    if (name === 'companyName' || name === 'companyDomain') {
      checkDuplicates(newData.companyName, newData.companyDomain);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(formData)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await onSubmit(formData);
      setSubmitResult(result);

      if (result.success) {
        // Reset form on success
        setFormData({
          companyName: '',
          companyDomain: '',
          contactName: '',
          contactEmail: '',
          contactPhone: '',
          contactTitle: '',
          region: '',
          vertical: 'banking',
          subVertical: '',
          notes: '',
          source: 'manual',
        });
        setDuplicates([]);
      }
    } catch (error) {
      setSubmitResult({
        success: false,
        message: error instanceof Error ? error.message : 'Submission failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Result message */}
      {submitResult && (
        <div
          className={`p-4 rounded-lg ${
            submitResult.success
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {submitResult.message}
        </div>
      )}

      {/* Duplicate warnings */}
      {duplicates.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Potential duplicates found:
          </h4>
          <ul className="mt-2 space-y-1">
            {duplicates.map((dup) => (
              <li key={dup.leadId} className="text-sm text-amber-700 dark:text-amber-400">
                {dup.companyName} ({Math.round(dup.similarity * 100)}% match)
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Validation warnings */}
      {warnings.length > 0 && (
        <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20">
          <ul className="text-sm text-blue-700 dark:text-blue-400">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Company Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Company Name"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          error={errors.companyName}
          required
          placeholder="Acme Corporation"
        />
        <FormField
          label="Company Domain"
          name="companyDomain"
          value={formData.companyDomain}
          onChange={handleChange}
          error={errors.companyDomain}
          placeholder="acme.com"
        />
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Contact Name"
          name="contactName"
          value={formData.contactName}
          onChange={handleChange}
          placeholder="John Doe"
        />
        <FormField
          label="Contact Title"
          name="contactTitle"
          value={formData.contactTitle}
          onChange={handleChange}
          placeholder="CFO"
        />
        <FormField
          label="Contact Email"
          name="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={handleChange}
          error={errors.contactEmail}
          placeholder="john@acme.com"
        />
        <FormField
          label="Contact Phone"
          name="contactPhone"
          type="tel"
          value={formData.contactPhone}
          onChange={handleChange}
          placeholder="+971 50 123 4567"
        />
      </div>

      {/* Classification */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormSelect
          label="Region"
          name="region"
          value={formData.region}
          onChange={handleChange}
          options={regions}
          placeholder="Select region"
        />
        <FormSelect
          label="Vertical"
          name="vertical"
          value={formData.vertical}
          onChange={handleChange}
          options={verticals}
        />
        <FormSelect
          label="Source"
          name="source"
          value={formData.source}
          onChange={handleChange}
          options={sources}
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="
            w-full px-3 py-2 rounded-lg border
            border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            placeholder:text-gray-400 dark:placeholder:text-gray-500
          "
          placeholder="Any additional notes about this lead..."
        />
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || isLoading || Object.keys(errors).length > 0}
          className="
            px-6 py-2.5 rounded-lg font-medium
            bg-blue-600 hover:bg-blue-700 text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors
          "
        >
          {isSubmitting ? 'Adding Lead...' : 'Add Lead'}
        </button>
      </div>
    </form>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`
          w-full px-3 py-2 rounded-lg border
          ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          placeholder:text-gray-400 dark:placeholder:text-gray-500
        `}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="
          w-full px-3 py-2 rounded-lg border
          border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        "
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default IndividualIntakeForm;
