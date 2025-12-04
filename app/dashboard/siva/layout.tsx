'use client';

/**
 * SIVA Layout - EB Journey
 * Special layout for SIVA that bypasses AppShell for full-screen experience
 */

export default function SIVALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // SIVA Surface is full-screen, no AppShell wrapper needed
  return <>{children}</>;
}
