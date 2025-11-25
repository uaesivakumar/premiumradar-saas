'use client';

/**
 * PremiumRadar Landing Page
 * Sprint 1: AI-First Landing Experience
 *
 * Features implemented:
 * - AI Orb Interaction Model
 * - Industry Classifier (client-side + LLM ready)
 * - Vertical Morphing Engine
 * - No-Login Flow
 * - Accessibility Base Layer
 * - English/Arabic Toggle
 * - Mobile/Tablet Responsive
 */

import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-16">
        <Hero />
        <Features />
      </main>
      <Footer />
    </>
  );
}
