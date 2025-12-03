/**
 * Vertical Selector Component
 * Sprint S54: Vertical Dashboards
 *
 * Dropdown/tabs for selecting dashboard vertical.
 */

import React from 'react';
import type { VerticalId, VerticalConfig } from '../../lib/dashboard';

interface VerticalSelectorProps {
  verticals: VerticalConfig[];
  selected: VerticalId;
  onChange: (vertical: VerticalId) => void;
  variant?: 'tabs' | 'dropdown';
  disabled?: boolean;
}

export function VerticalSelector({
  verticals,
  selected,
  onChange,
  variant = 'tabs',
  disabled = false,
}: VerticalSelectorProps) {
  if (variant === 'dropdown') {
    return (
      <VerticalDropdown
        verticals={verticals}
        selected={selected}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  return (
    <VerticalTabs
      verticals={verticals}
      selected={selected}
      onChange={onChange}
      disabled={disabled}
    />
  );
}

interface VerticalTabsProps {
  verticals: VerticalConfig[];
  selected: VerticalId;
  onChange: (vertical: VerticalId) => void;
  disabled: boolean;
}

function VerticalTabs({ verticals, selected, onChange, disabled }: VerticalTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {verticals.map((vertical) => {
        const isSelected = vertical.id === selected;
        return (
          <button
            key={vertical.id}
            onClick={() => onChange(vertical.id)}
            disabled={disabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${isSelected
                ? 'text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            style={isSelected ? { backgroundColor: vertical.color } : undefined}
          >
            <span className="text-lg">{vertical.icon}</span>
            <span>{vertical.name}</span>
          </button>
        );
      })}
    </div>
  );
}

interface VerticalDropdownProps {
  verticals: VerticalConfig[];
  selected: VerticalId;
  onChange: (vertical: VerticalId) => void;
  disabled: boolean;
}

function VerticalDropdown({ verticals, selected, onChange, disabled }: VerticalDropdownProps) {
  const selectedVertical = verticals.find((v) => v.id === selected);

  return (
    <div className="relative inline-block">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value as VerticalId)}
        disabled={disabled}
        className={`
          appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10
          font-medium text-sm text-gray-700 cursor-pointer
          hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ borderLeftColor: selectedVertical?.color, borderLeftWidth: '4px' }}
      >
        {verticals.map((vertical) => (
          <option key={vertical.id} value={vertical.id}>
            {vertical.icon} {vertical.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export default VerticalSelector;
