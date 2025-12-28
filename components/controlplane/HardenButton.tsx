'use client';

/**
 * S338-F1: Harden Button Component
 *
 * Entry point for HARDEN MODE - allows post-creation audit & edit
 * of existing vertical stacks without creating new entities.
 *
 * Renders next to sub-verticals and personas in Control Plane main view.
 * Navigates to /superadmin/controlplane/harden/[entityType]/[entityId]
 */

import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

type EntityType = 'sub-vertical' | 'persona';

interface HardenButtonProps {
  entityType: EntityType;
  entityId: string;
  entityName?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function HardenButton({
  entityType,
  entityId,
  entityName,
  size = 'sm',
  className = '',
}: HardenButtonProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click handlers
    router.push(`/superadmin/controlplane/harden/${entityType}/${entityId}`);
  };

  const sizeClasses = {
    sm: 'p-1 text-[10px]',
    md: 'p-1.5 text-xs',
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-1
        ${sizeClasses[size]}
        text-amber-400 hover:text-amber-300
        bg-amber-500/10 hover:bg-amber-500/20
        border border-amber-500/20 hover:border-amber-500/40
        rounded transition-colors
        ${className}
      `}
      title={`Harden ${entityName || entityType}: Audit & edit existing configuration`}
      data-testid="harden-button"
    >
      <Shield className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>Harden</span>
    </button>
  );
}
