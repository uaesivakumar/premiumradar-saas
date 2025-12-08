'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// SIVA OS FOUNDER BIBLE - CATEGORY LEADER EDITION
// Version: 5.1 (Category Leader) | December 2025
// The Constitutional Document for SIVA OS
// ============================================================================

// Types
type Section = 'overview' | 'manifesto' | 'category' | 'philosophy' | 'architecture' | 'prd' | 'scale' | 'orchestration' | 'roadmap' | 'learn' | 'quiz' | 'progress';
type LearningModule = {
  id: string;
  title: string;
  description: string;
  topics: LearningTopic[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
};
type LearningTopic = {
  id: string;
  title: string;
  content: string;
  analogy?: string;
  keyPoints: string[];
  quiz?: QuizQuestion[];
};
type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};
type ProgressData = {
  completedTopics: string[];
  quizScores: Record<string, number>;
  lastAccessed: string;
  totalTimeSpent: number;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FounderBiblePage() {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [progress, setProgress] = useState<ProgressData>({
    completedTopics: [],
    quizScores: {},
    lastAccessed: new Date().toISOString(),
    totalTimeSpent: 0,
  });
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<string | null>(null);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('founder-bible-progress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  // Save progress
  const saveProgress = useCallback((newProgress: ProgressData) => {
    setProgress(newProgress);
    localStorage.setItem('founder-bible-progress', JSON.stringify(newProgress));
  }, []);

  const markTopicComplete = (topicId: string) => {
    if (!progress.completedTopics.includes(topicId)) {
      saveProgress({
        ...progress,
        completedTopics: [...progress.completedTopics, topicId],
        lastAccessed: new Date().toISOString(),
      });
    }
  };

  const saveQuizScore = (quizId: string, score: number) => {
    saveProgress({
      ...progress,
      quizScores: { ...progress.quizScores, [quizId]: score },
      lastAccessed: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center font-bold text-lg">
              PR
            </div>
            <div>
              <h1 className="text-xl font-bold">SIVA OS Founder Bible</h1>
              <p className="text-xs text-slate-400">Category Leader Edition v5.1</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-emerald-400">{Math.round((progress.completedTopics.length / TOTAL_TOPICS) * 100)}% Complete</p>
              <p className="text-xs text-slate-500">{progress.completedTopics.length}/{TOTAL_TOPICS} Topics</p>
            </div>
            <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${(progress.completedTopics.length / TOTAL_TOPICS) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="fixed top-20 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as Section)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {section.icon} {section.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-36 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'manifesto' && <ManifestoSection />}
            {activeSection === 'category' && <CategorySection />}
            {activeSection === 'philosophy' && <PhilosophySection />}
            {activeSection === 'architecture' && <ArchitectureSection />}
            {activeSection === 'prd' && <PRDSection />}
            {activeSection === 'scale' && <ScaleSection />}
            {activeSection === 'orchestration' && <OrchestrationSection />}
            {activeSection === 'roadmap' && <RoadmapSection />}
            {activeSection === 'learn' && (
              <LearnSection
                expandedModule={expandedModule}
                setExpandedModule={setExpandedModule}
                markTopicComplete={markTopicComplete}
                completedTopics={progress.completedTopics}
              />
            )}
            {activeSection === 'quiz' && (
              <QuizSection
                currentQuiz={currentQuiz}
                setCurrentQuiz={setCurrentQuiz}
                saveQuizScore={saveQuizScore}
                quizScores={progress.quizScores}
              />
            )}
            {activeSection === 'progress' && <ProgressSection progress={progress} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Calculate total topics dynamically
// Modules 1-5 have 13 topics, Modules 6-10 add 12 more = 25 topics total
const TOTAL_TOPICS = 25;

const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'manifesto', label: 'Manifesto', icon: '📜' },
  { id: 'category', label: 'Category', icon: '🎯' },
  { id: 'philosophy', label: '12 Laws', icon: '⚖️' },
  { id: 'architecture', label: 'Architecture', icon: '🏗️' },
  { id: 'prd', label: 'Master PRD', icon: '📋' },
  { id: 'scale', label: 'Scale', icon: '🚀' },
  { id: 'orchestration', label: 'AI Console', icon: '🤖' },
  { id: 'roadmap', label: 'Roadmap', icon: '🗺️' },
  { id: 'learn', label: 'Learn', icon: '📚' },
  { id: 'quiz', label: 'Quiz', icon: '🧠' },
  { id: 'progress', label: 'Progress', icon: '📊' },
];

// ============================================================================
// OVERVIEW SECTION
// ============================================================================

function OverviewSection() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Hero */}
      <div className="text-center mb-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center"
        >
          <span className="text-4xl font-bold">S</span>
        </motion.div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          SIVA OS
        </h1>
        <p className="text-xl text-slate-300 mb-2">The AI Operating System for Every Salesperson on Earth</p>
        <p className="text-slate-500">PremiumRadar is one distribution of SIVA OS</p>
      </div>

      {/* Founder Vision Banner */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-8 mb-8 text-center">
        <p className="text-2xl font-bold text-white mb-2">&quot;SIVA will become the Siri of Sales.&quot;</p>
        <p className="text-slate-400">— Sivakumar, Founder</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { label: 'Sprints Completed', value: '132', icon: '✅' },
          { label: 'Features Built', value: '754', icon: '🔧' },
          { label: 'SIVA Tools', value: '12', icon: '🤖' },
          { label: 'Database Tables', value: '130+', icon: '🗄️' },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-bold text-emerald-400">{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* The Fundamental Truth */}
      <div className="bg-slate-900/50 border border-emerald-500 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="text-3xl">⚡</span> The Fundamental Truth
        </h2>
        <div className="prose prose-invert max-w-none">
          <p className="text-xl text-white font-bold mb-4">
            SIVA is NOT a feature of PremiumRadar.<br/>
            PremiumRadar is ONE distribution of SIVA.<br/>
            <span className="text-emerald-400">SIVA is the platform. SIVA is the OS. SIVA is the product.</span>
          </p>
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-red-400 font-bold mb-3">❌ What SIVA is NOT</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• A chatbot added to a product</li>
                <li>• A feature of PremiumRadar</li>
                <li>• A CRM with AI</li>
                <li>• A report generator</li>
                <li>• A generic AI assistant</li>
              </ul>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
              <h3 className="text-emerald-400 font-bold mb-3">✅ What SIVA IS</h3>
              <ul className="space-y-2 text-slate-300">
                <li>• The AI Operating System for Sales</li>
                <li>• A platform with multiple distributions</li>
                <li>• The Perplexity of Sales</li>
                <li>• Voice-first, multi-surface</li>
                <li>• Self-evolving intelligence</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* SIVA Distributions */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="text-3xl">🌐</span> SIVA Distributions
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: 'PremiumRadar (Web)', status: 'LIVE', desc: 'Full-featured web dashboard', color: 'emerald' },
            { name: 'SIVA Mobile', status: 'Phase 3', desc: 'Standalone mobile app', color: 'slate' },
            { name: 'SIVA SDK', status: 'Phase 3', desc: 'Embedded in other products', color: 'slate' },
            { name: 'SIVA Voice', status: 'Phase 5', desc: 'Hey SIVA wake word', color: 'slate' },
            { name: 'SIVA API', status: 'Phase 4', desc: 'B2B API access', color: 'slate' },
            { name: 'SIVA Device', status: 'Phase 5', desc: 'Dedicated hardware', color: 'slate' },
          ].map((dist) => (
            <div key={dist.name} className={`bg-${dist.color}-500/10 border border-${dist.color}-500/30 rounded-xl p-4`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className={`text-${dist.color}-400 font-bold`}>{dist.name}</h3>
                <span className={`text-xs px-2 py-1 rounded ${dist.status === 'LIVE' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {dist.status}
                </span>
              </div>
              <p className="text-sm text-slate-400">{dist.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Current State */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="text-3xl">📍</span> Current State (December 2025)
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
            <h3 className="text-emerald-400 font-bold mb-3">Active Vertical</h3>
            <p className="text-2xl font-bold text-white">Banking</p>
            <p className="text-sm text-slate-400 mt-2">Employee Banking, Corporate, SME</p>
          </div>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6">
            <h3 className="text-cyan-400 font-bold mb-3">Active Region</h3>
            <p className="text-2xl font-bold text-white">UAE</p>
            <p className="text-sm text-slate-400 mt-2">Dubai, Abu Dhabi, Sharjah, etc.</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-purple-400 font-bold mb-3">Radar Target</h3>
            <p className="text-2xl font-bold text-white">Companies</p>
            <p className="text-sm text-slate-400 mt-2">Corporate entities, not individuals</p>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="text-3xl">🛠️</span> Technology Stack
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-bold text-emerald-400 mb-4">Frontend (SaaS)</h3>
            <div className="space-y-3">
              {[
                { name: 'Next.js 14', desc: 'App Router, RSC' },
                { name: 'React 18', desc: 'Concurrent features' },
                { name: 'TypeScript 5', desc: 'Type safety' },
                { name: 'Tailwind CSS', desc: 'Utility-first styling' },
                { name: 'Framer Motion', desc: 'Animations' },
                { name: 'Zustand', desc: 'State management' },
              ].map((tech) => (
                <div key={tech.name} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-2">
                  <span className="font-medium">{tech.name}</span>
                  <span className="text-sm text-slate-400">{tech.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-4">Backend (UPR OS)</h3>
            <div className="space-y-3">
              {[
                { name: 'Node.js', desc: 'Runtime' },
                { name: 'Express.js', desc: 'API framework' },
                { name: 'PostgreSQL', desc: '130+ tables' },
                { name: 'Neo4j', desc: 'Knowledge graph' },
                { name: 'LLM Router', desc: 'Multi-model AI' },
                { name: 'Cloud Run', desc: 'Serverless deploy' },
              ].map((tech) => (
                <div key={tech.name} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-2">
                  <span className="font-medium">{tech.name}</span>
                  <span className="text-sm text-slate-400">{tech.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MANIFESTO SECTION - FOUNDER HARD CONSTRAINTS
// ============================================================================

function ManifestoSection() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Founder Manifesto</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          This section can NEVER be changed. It is the DNA of the company.
        </p>
      </div>

      {/* Sacred Banner */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-2xl p-8 mb-8 text-center">
        <span className="text-4xl mb-4 block">📜</span>
        <h2 className="text-2xl font-bold text-amber-400 mb-4">SACRED TEXT - UNCHANGEABLE</h2>
        <p className="text-lg text-white max-w-3xl mx-auto">
          &quot;SIVA is the Operating System for every salesperson on Planet Earth.
          Not a tool. Not a feature. The operating system.&quot;
        </p>
      </div>

      {/* 7 Founder Hard Constraints */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">7 Founder Hard Constraints</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { num: 1, title: 'SIVA-FIRST, NOT UI-FIRST', desc: 'The product IS SIVA. UI is just one way to interact with SIVA.' },
            { num: 2, title: 'AI-NATIVE, NOT AI-ADDED', desc: 'SIVA is not a feature added to a product. The product is SIVA.' },
            { num: 3, title: 'NO HARDCODED INTELLIGENCE', desc: 'Every persona, every rule, every signal weight MUST be configurable.' },
            { num: 4, title: 'SIVA CONFIGURES SIVA', desc: 'No JSON editing. No form filling. SIVA configures itself through dialogue.' },
            { num: 5, title: 'EVIDENCE-GROUNDED OR SILENT', desc: 'SIVA will NEVER hallucinate contact info, company data, or facts.' },
            { num: 6, title: 'MULTI-SURFACE BY DESIGN', desc: 'Web, mobile, voice, device, SDK. Same SIVA, different surfaces.' },
            { num: 7, title: 'SELF-EVOLVING SYSTEM', desc: 'The system gets better with every user, every query, every outcome.' },
          ].map((constraint) => (
            <div key={constraint.num} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400">
                  {constraint.num}
                </span>
                <h3 className="font-bold text-white">{constraint.title}</h3>
              </div>
              <p className="text-sm text-slate-400">{constraint.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vision Statement */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-emerald-400 mb-4">The Vision</h2>
        <p className="text-xl text-white mb-4">
          Every salesperson on Earth will have an AI companion that knows their industry,
          understands their role, and guides them to success.
        </p>
        <p className="text-slate-400">That companion is SIVA.</p>
      </div>
    </div>
  );
}

// ============================================================================
// CATEGORY SECTION - AI SALES OS
// ============================================================================

function CategorySection() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Category: AI Sales OS</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          We are not entering an existing market. We are creating a new category.
        </p>
      </div>

      {/* Category Definition */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-8 mb-8">
        <h2 className="text-xl font-bold text-emerald-400 mb-4">CATEGORY: AI SALES OS</h2>
        <p className="text-lg text-slate-300 leading-relaxed">
          An AI-native operating system that serves as the primary intelligence layer for sales professionals,
          replacing fragmented tools with a unified, voice-enabled, self-evolving platform that reasons,
          prioritizes, and acts on behalf of the salesperson.
        </p>
      </div>

      {/* Why AI Sales OS Wins */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Why &quot;AI Sales OS&quot; Wins</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-lg font-bold text-emerald-400 mb-3">OS Implies</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• Platform (not a tool)</li>
              <li>• Extensibility (SDK, API)</li>
              <li>• Multi-surface (web, mobile, voice)</li>
              <li>• Self-contained</li>
              <li>• Foundational</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-3">AI Implies</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• Intelligence (not just data)</li>
              <li>• Reasoning (not just search)</li>
              <li>• Proactive (not just reactive)</li>
              <li>• Learning (not static)</li>
              <li>• Voice-enabled</li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold text-purple-400 mb-3">Sales Implies</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>• Vertical focus</li>
              <li>• Domain expertise</li>
              <li>• Revenue-critical</li>
              <li>• Professional tool</li>
              <li>• Not consumer</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Category vs Existing */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Existing Categories vs. AI Sales OS</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Category</th>
                <th className="text-left py-3 px-4 text-slate-400">Players</th>
                <th className="text-left py-3 px-4 text-slate-400">Why AI Sales OS is Different</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'CRM', players: 'Salesforce, HubSpot', diff: 'We don\'t store. We reason.' },
                { cat: 'Sales Intelligence', players: 'ZoomInfo, Apollo', diff: 'We don\'t just provide. We prioritize.' },
                { cat: 'Sales Engagement', players: 'Outreach, Salesloft', diff: 'We don\'t automate blindly. We strategize.' },
                { cat: 'Conversation Intel', players: 'Gong, Chorus', diff: 'We don\'t just analyze. We guide.' },
                { cat: 'AI Assistants', players: 'ChatGPT, Claude', diff: 'We\'re not general. We\'re sales-native.' },
              ].map((row) => (
                <tr key={row.cat} className="border-b border-slate-800">
                  <td className="py-3 px-4 font-medium text-white">{row.cat}</td>
                  <td className="py-3 px-4 text-slate-400">{row.players}</td>
                  <td className="py-3 px-4 text-emerald-400">{row.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Flywheel */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">The Intelligence Flywheel</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {[
              { step: 1, text: 'SIVA observes sales interactions' },
              { step: 2, text: 'Successful patterns are identified' },
              { step: 3, text: 'Patterns feed SLM training' },
              { step: 4, text: 'SLM improves recommendations' },
              { step: 5, text: 'Better recommendations → Higher win rates' },
              { step: 6, text: 'Higher win rates → More users' },
              { step: 7, text: 'More users → More interactions → Back to step 1' },
            ].map((item) => (
              <div key={item.step} className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {item.step}
                </span>
                <span className="text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 flex items-center justify-center">
            <div className="text-center">
              <span className="text-4xl mb-4 block">🔄</span>
              <h3 className="text-lg font-bold text-emerald-400 mb-2">THE MOAT</h3>
              <p className="text-slate-300">Every user makes SIVA better for all users.</p>
              <p className="text-sm text-slate-500 mt-2">Competitors can&apos;t replicate without the data.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Timeline */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Category Timeline to Dominance</h2>
        <div className="space-y-4">
          {[
            { year: '2025', milestone: 'Category Creation', desc: 'SIVA launches, "AI Sales OS" term coined' },
            { year: '2026', milestone: 'Category Awareness', desc: 'First analyst report mentions "AI Sales OS"' },
            { year: '2027', milestone: 'Category Competition', desc: 'First competitor claims "AI Sales OS" positioning' },
            { year: '2028', milestone: 'Category Leadership', desc: 'SIVA recognized as category leader by Gartner/Forrester' },
            { year: '2029', milestone: 'Category Maturity', desc: '"AI Sales OS" becomes standard enterprise budget line item' },
            { year: '2030', milestone: 'Category Dominance', desc: 'SIVA is synonymous with "AI Sales OS"' },
          ].map((item, i) => (
            <div key={item.year} className="flex items-start gap-4">
              <span className={`text-lg font-bold ${i === 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{item.year}</span>
              <div className="flex-1">
                <span className="font-bold text-white">{item.milestone}</span>
                <span className="text-slate-400 ml-2">— {item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCALE SECTION - DISTRIBUTED INTELLIGENCE
// ============================================================================

function ScaleSection() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Scale Behavior</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          What happens when SIVA serves millions of users across multiple regions, verticals, and tenants.
        </p>
      </div>

      {/* Scale Targets */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Scale Targets</h2>
        <div className="grid grid-cols-5 gap-4">
          {[
            { phase: 'Y1', users: '1K', queries: '10K/day', current: true },
            { phase: 'Y2', users: '10K', queries: '100K/day', current: false },
            { phase: 'Y3', users: '100K', queries: '1M/day', current: false },
            { phase: 'Y4', users: '500K', queries: '5M/day', current: false },
            { phase: 'Y5', users: '1M+', queries: '10M+/day', current: false },
          ].map((t) => (
            <div key={t.phase} className={`rounded-xl p-4 text-center ${t.current ? 'bg-emerald-500/20 border border-emerald-500' : 'bg-slate-800'}`}>
              <div className={`text-2xl font-bold ${t.current ? 'text-emerald-400' : 'text-slate-400'}`}>{t.phase}</div>
              <div className="text-lg font-bold text-white">{t.users}</div>
              <div className="text-xs text-slate-500">{t.queries}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Region */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Multi-Region Architecture</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { region: 'UAE', phase: 'P1-2', status: 'PRIMARY', color: 'emerald' },
            { region: 'INDIA', phase: 'P3', status: 'Phase 3', color: 'slate' },
            { region: 'EUROPE', phase: 'P4', status: 'Phase 4', color: 'slate' },
            { region: 'NORTH AMERICA', phase: 'P4', status: 'Phase 4', color: 'slate' },
          ].map((r) => (
            <div key={r.region} className={`bg-${r.color}-500/10 border border-${r.color}-500/30 rounded-xl p-4 text-center`}>
              <h3 className="font-bold text-white">{r.region}</h3>
              <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${r.status === 'PRIMARY' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Model Routing */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Intelligent Model Routing</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Complexity</th>
                <th className="text-left py-3 px-4 text-slate-400">Model</th>
                <th className="text-left py-3 px-4 text-slate-400">Example Query</th>
                <th className="text-right py-3 px-4 text-slate-400">Cost</th>
                <th className="text-right py-3 px-4 text-slate-400">Latency</th>
              </tr>
            </thead>
            <tbody>
              {[
                { complexity: 'SIMPLE', model: 'SLM-1B', example: '"What\'s ABC Corp\'s headcount?"', cost: '$0.0001', latency: '<100ms' },
                { complexity: 'STANDARD', model: 'SLM-7B', example: '"Who should I call today?"', cost: '$0.001', latency: '<500ms' },
                { complexity: 'COMPLEX', model: 'SLM-13B', example: '"Analyze my pipeline strategy"', cost: '$0.005', latency: '<1000ms' },
                { complexity: 'FALLBACK', model: 'Claude', example: 'When SLM confidence <70%', cost: '$0.03', latency: '<2000ms' },
              ].map((row) => (
                <tr key={row.complexity} className="border-b border-slate-800">
                  <td className="py-3 px-4 font-medium text-emerald-400">{row.complexity}</td>
                  <td className="py-3 px-4 text-white">{row.model}</td>
                  <td className="py-3 px-4 text-slate-400">{row.example}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{row.cost}</td>
                  <td className="py-3 px-4 text-right text-cyan-400">{row.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
          <p className="text-emerald-400">At 10M queries/day: <strong>$8.3M/year savings</strong> vs all-Claude</p>
        </div>
      </div>

      {/* Load Behavior */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Stress Response Matrix</h2>
        <div className="space-y-3">
          {[
            { load: '1x (Normal)', behavior: 'All features, full quality', latency: '<500ms p50', color: 'emerald' },
            { load: '2x (Elevated)', behavior: 'Auto-scale instances', latency: '<750ms p50', color: 'emerald' },
            { load: '5x (High)', behavior: 'Graceful degradation begins', latency: '<1500ms p50', color: 'yellow' },
            { load: '10x (Stress)', behavior: 'Critical-only mode, Claude disabled', latency: '<3000ms p50', color: 'orange' },
            { load: '20x (Crisis)', behavior: 'Enterprise customers only', latency: 'Degraded', color: 'red' },
          ].map((row) => (
            <div key={row.load} className={`flex items-center justify-between bg-${row.color}-500/10 border border-${row.color}-500/30 rounded-lg px-4 py-3`}>
              <span className={`font-bold text-${row.color}-400`}>{row.load}</span>
              <span className="text-slate-300">{row.behavior}</span>
              <span className="text-sm text-slate-400">{row.latency}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ORCHESTRATION SECTION - AI EXECUTIVE TEAM
// ============================================================================

function OrchestrationSection() {
  const [activeRole, setActiveRole] = useState<'COO' | 'CTO' | 'CMO' | 'CISO' | 'CPO'>('COO');

  const roles = {
    COO: {
      title: 'SIVA as COO',
      desc: 'Chief Operations Officer',
      responsibilities: [
        'Monitor system health across all regions',
        'Detect operational anomalies before incidents',
        'Coordinate resources during high-load',
        'Ensure SLAs are met',
      ],
      example: `"Good morning. Operations summary:

🟢 All systems operational
📊 Yesterday: 127,453 queries processed (↑12%)
⚠️ Attention: India region latency trending up

I've already:
1. Scaled Cloud Run instances
2. Opened a ticket with CloudFlare
3. Prepared customer communication

Which approach would you like me to pursue?"`,
    },
    CTO: {
      title: 'SIVA as CTO',
      desc: 'Chief Technology Officer',
      responsibilities: [
        'Monitor technical debt and propose refactoring',
        'Track model performance and recommend upgrades',
        'Identify integration opportunities',
        'Plan infrastructure scaling',
      ],
      example: `"Technical insights for this week:

🔧 TECHNICAL DEBT
The signal pipeline has 3 hotspots causing 15% latency.

📈 MODEL PERFORMANCE
SLM-7B accuracy dropped 2% on insurance queries.

🔌 INTEGRATION OPPORTUNITY
HubSpot released new endpoints — 40% sync improvement.

Would you like me to create Jira tickets?"`,
    },
    CMO: {
      title: 'SIVA as CMO',
      desc: 'Chief Marketing Officer',
      responsibilities: [
        'Track customer acquisition and retention',
        'Identify successful user patterns',
        'Detect churn signals',
        'Recommend growth experiments',
      ],
      example: `"Customer intelligence update:

📊 ACQUISITION
47 new users this week (↑23%)
Best converting: Banking EB UAE (18%)

⚠️ CHURN RISK DETECTED
3 enterprise customers showing engagement drop:
1. TechCorp (queries down 60%)
2. FinanceHub (5/10 users inactive)

Shall I draft outreach emails?"`,
    },
    CISO: {
      title: 'SIVA as CISO',
      desc: 'Chief Information Security Officer',
      responsibilities: [
        'Monitor for security anomalies',
        'Track compliance status',
        'Detect potential breaches',
        'Manage access controls',
      ],
      example: `"Security briefing:

🛡️ THREAT LANDSCAPE
23 blocked prompt injection attempts
3 suspicious API patterns flagged
No successful breaches

📋 COMPLIANCE STATUS
SOC2 controls: 94% implemented
GDPR compliance: 100%
Next audit: 45 days

Shall I send password rotation reminders?"`,
    },
    CPO: {
      title: 'SIVA as CPO',
      desc: 'Chief Product Officer',
      responsibilities: [
        'Analyze feature usage and adoption',
        'Identify user pain points',
        'Propose product improvements',
        'Prioritize roadmap based on data',
      ],
      example: `"Product insights:

📊 FEATURE ADOPTION
1. score_company: 45% of queries
2. search_companies: 28%
3. get_outreach_intel: 15%

🎯 USER PAIN POINTS
"Calendar integration" (23 requests)
"Bulk company export" (18 requests)

Would you like a PRD for calendar?"`,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">AI Orchestration Console</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          SIVA as your AI Executive Team — anticipating problems, predicting risks, suggesting optimizations.
        </p>
      </div>

      {/* Role Selector */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {(['COO', 'CTO', 'CMO', 'CISO', 'CPO'] as const).map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeRole === role
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Role Details */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-emerald-400 mb-2">{roles[activeRole].title}</h2>
          <p className="text-slate-400 mb-6">{roles[activeRole].desc}</p>
          <h3 className="font-bold text-white mb-3">Responsibilities:</h3>
          <ul className="space-y-2">
            {roles[activeRole].responsibilities.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-300">
                <span className="text-emerald-400">•</span> {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-slate-900/50 border border-emerald-500/30 rounded-2xl p-8">
          <h3 className="font-bold text-emerald-400 mb-4">Example Interaction:</h3>
          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-800/50 rounded-lg p-4">
            {roles[activeRole].example}
          </pre>
        </div>
      </div>

      {/* Alert Types */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mb-8">
        <h2 className="text-2xl font-bold mb-6">Proactive AI Alert Types</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { type: 'CRITICAL', icon: '🔴', items: ['System outage', 'Security breach', 'Cost runaway'], response: 'Immediate' },
            { type: 'WARNING', icon: '🟠', items: ['Performance degradation', 'Budget approaching', 'Pack drift'], response: '4 hours' },
            { type: 'INSIGHT', icon: '🟡', items: ['Growth opportunities', 'Feature adoption', 'Tech debt'], response: 'Daily digest' },
            { type: 'POSITIVE', icon: '🟢', items: ['Record queries', 'Deal closed', 'Zero-incident week'], response: 'Celebrate!' },
          ].map((alert) => (
            <div key={alert.type} className="bg-slate-800/50 rounded-xl p-4">
              <div className="text-2xl mb-2">{alert.icon}</div>
              <h3 className="font-bold text-white mb-2">{alert.type}</h3>
              <ul className="space-y-1 text-sm text-slate-400 mb-3">
                {alert.items.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
              <span className="text-xs bg-slate-700 px-2 py-1 rounded">{alert.response}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Fix */}
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">Auto-Fix Capabilities</h2>
        <p className="text-slate-300 mb-6">
          SIVA doesn&apos;t just identify problems. SIVA fixes them (with approval).
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { problem: 'Pack accuracy dropped', fix: 'Analyze drift, adjust weights', approval: 'Required' },
            { problem: 'Latency spike', fix: 'Scale instances, enable caching', approval: 'Auto (<$500/mo)' },
            { problem: 'Security anomaly', fix: 'Suspend access, log evidence', approval: 'Auto-approved' },
          ].map((item, i) => (
            <div key={i} className="bg-slate-800/50 rounded-xl p-4">
              <h4 className="font-bold text-white mb-2">{item.problem}</h4>
              <p className="text-sm text-slate-400 mb-2">{item.fix}</p>
              <span className="text-xs text-emerald-400">Approval: {item.approval}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PHILOSOPHY SECTION - 12 UNBREAKABLE LAWS
// ============================================================================

function PhilosophySection() {
  const [expandedLaw, setExpandedLaw] = useState<number | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">The 12 Unbreakable Laws</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          These philosophical principles govern every decision in PremiumRadar.
          They are non-negotiable and define the soul of the product.
        </p>
      </div>

      <div className="grid gap-4">
        {TWELVE_LAWS.map((law, index) => (
          <motion.div
            key={index}
            className={`bg-slate-900/50 border rounded-xl overflow-hidden transition-colors ${
              expandedLaw === index ? 'border-emerald-500/50' : 'border-slate-800'
            }`}
          >
            <button
              onClick={() => setExpandedLaw(expandedLaw === index ? null : index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center font-bold text-emerald-400">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-bold text-lg">{law.title}</h3>
                  <p className="text-sm text-slate-400">{law.subtitle}</p>
                </div>
              </div>
              <span className={`text-2xl transition-transform ${expandedLaw === index ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
            <AnimatePresence>
              {expandedLaw === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2 border-t border-slate-800">
                    <p className="text-slate-300 mb-4">{law.description}</p>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <p className="text-sm text-emerald-400 font-medium mb-2">💡 In Practice:</p>
                      <p className="text-slate-400 text-sm">{law.example}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const TWELVE_LAWS = [
  {
    title: 'No Hardcode Doctrine',
    subtitle: 'Zero hardcoded business logic',
    description: 'Every vertical, signal, persona, scoring model, and journey must be configurable through Super Admin UI. Nothing is embedded in code.',
    example: 'When adding Insurance vertical, we create it through Super Admin - no code deployment required.',
  },
  {
    title: 'Vertical = Sales Role Context',
    subtitle: 'Not industry, not company sector',
    description: 'Vertical defines the salesperson\'s world - what they sell, who they target, how they think. It\'s their complete professional context.',
    example: 'Banking vertical means the user IS a banker selling banking products, not that they sell TO banks.',
  },
  {
    title: 'Entity Target Rule',
    subtitle: 'Sub-vertical determines target type',
    description: 'Each sub-vertical has ONE entity type: Company, Individual, Family, or Candidate. This single variable changes everything.',
    example: 'Banking EB targets Companies. Insurance Life targets Individuals. Never mix them.',
  },
  {
    title: 'SIVA Is the Workflow',
    subtitle: 'Not a chatbot, not a feature',
    description: 'SIVA is the primary interface. Users don\'t navigate pages - they converse with SIVA. The AI brings actions to users.',
    example: 'Instead of clicking "Discovery > Search", users say "Find hiring companies in Dubai" and SIVA executes.',
  },
  {
    title: 'Signals Are Sales Triggers',
    subtitle: 'Not life events, not industry news',
    description: 'Every signal must indicate a sales opportunity. Hiring = payroll needs. Funding = banking needs. Office opening = corporate accounts.',
    example: 'We track "Company hired 50 people" not "CEO got married" - only signals that indicate buying intent.',
  },
  {
    title: 'Pack Hierarchy',
    subtitle: 'Vertical + Sub-Vertical + Region = Final Pack',
    description: 'Intelligence packs merge hierarchically. Region pack overrides Sub-Vertical, which overrides Vertical. This creates precision.',
    example: 'UAE tone adjustments (Region Pack) override generic Banking persona (Vertical Pack).',
  },
  {
    title: 'Self-Healing Intelligence',
    subtitle: 'The system improves itself',
    description: 'When scoring drifts, personas become stale, or signals lose correlation, the system detects, diagnoses, and proposes fixes.',
    example: 'If "office opening" signal stops converting, system suggests reducing its scoring weight.',
  },
  {
    title: 'Multi-Agent Orchestration',
    subtitle: '11 AI departments supervise SIVA',
    description: 'SIVA doesn\'t operate alone. CTO AI watches performance, CFO AI optimizes costs, QA AI catches errors, Founder AI protects vision.',
    example: 'Before deploying a new pack, QA AI validates it won\'t break existing logic.',
  },
  {
    title: 'Context Is Everything',
    subtitle: 'SalesContext Engine drives all decisions',
    description: 'Every SIVA response, every tool call, every score calculation starts with the SalesContext. It\'s the spinal cord of the OS.',
    example: 'SIVA loads different tools, personas, and signals based on whether user is EB, Corporate, or SME.',
  },
  {
    title: 'Evidence-Based Reasoning',
    subtitle: 'SIVA never hallucinates',
    description: 'Every claim SIVA makes must be backed by evidence. No fabricated facts, no assumed data, no creative interpretations.',
    example: '"This company is hiring 50 people" comes with source link, confidence score, and data freshness.',
  },
  {
    title: 'Pageless OS',
    subtitle: 'Workspace is AI-driven, not menu-driven',
    description: 'The main workspace has no traditional navigation. SIVA surfaces what\'s needed when needed. Zero cognitive load.',
    example: 'User doesn\'t hunt for "Enrichment page" - SIVA shows enrichment panel when context demands it.',
  },
  {
    title: 'API Cost Governance',
    subtitle: 'Profitability is non-negotiable',
    description: 'Every API call is monitored, optimized, and budget-controlled. The system routes to cheapest acceptable model automatically.',
    example: 'Simple tasks use Haiku, complex reasoning uses GPT-4. Tenant budgets are enforced in real-time.',
  },
];

// ============================================================================
// ARCHITECTURE SECTION
// ============================================================================

function ArchitectureSection() {
  const [activeArch, setActiveArch] = useState<'siva' | 'sce' | 'packs' | 'agents'>('siva');

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">System Architecture</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Deep dive into the technical architecture of PremiumRadar's AI Operating System.
        </p>
      </div>

      {/* Architecture Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'siva', label: 'SIVA OS Kernel', icon: '🧠' },
          { id: 'sce', label: 'SalesContext Engine', icon: '🎯' },
          { id: 'packs', label: 'Intelligence Packs', icon: '📦' },
          { id: 'agents', label: 'Multi-Agent System', icon: '🤖' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveArch(tab.id as typeof activeArch)}
            className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
              activeArch === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Architecture Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeArch}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {activeArch === 'siva' && <SIVAKernelDiagram />}
          {activeArch === 'sce' && <SCEDiagram />}
          {activeArch === 'packs' && <PacksDiagram />}
          {activeArch === 'agents' && <AgentsDiagram />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SIVAKernelDiagram() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">SIVA OS Kernel Architecture</h2>

      {/* ASCII Diagram */}
      <div className="bg-slate-950 rounded-xl p-6 font-mono text-sm overflow-x-auto mb-8">
        <pre className="text-emerald-400">{`
                    ┌──────────────────────────┐
                    │     SIVA OS KERNEL       │
                    │ (Reasoning Superlayer)   │
                    └───────────┬──────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         ▼                      ▼                      ▼
 ┌───────────────┐     ┌────────────────┐     ┌───────────────────┐
 │ Context Engine │     │ Persona Engine │     │ Evidence Engine   │
 └───────┬────────┘     └──────┬─────────┘     └────────┬──────────┘
         │                      │                        │
         ▼                      ▼                        ▼
 ┌──────────────┐      ┌────────────────┐      ┌──────────────────┐
 │ Tools Engine │      │ Reasoning Flow │      │ Safety & Guardrail│
 └───────┬──────┘      └────────────────┘      └─────────┬────────┘
         │                                               │
         ▼                                               ▼
 ┌────────────────┐                           ┌────────────────────┐
 │ Execution Layer│                           │  Logging & Memory  │
 └────────────────┘                           └────────────────────┘
        `}</pre>
      </div>

      {/* Components */}
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { name: 'Context Engine', desc: 'Provides situational awareness - who is the user, what vertical, what region, what entity target', color: 'emerald' },
          { name: 'Persona Engine', desc: 'Loads role-specific behavior - tone, vocabulary, boundaries, regulatory awareness', color: 'cyan' },
          { name: 'Evidence Engine', desc: 'Ensures every claim is backed by data - no hallucinations, only verified facts', color: 'purple' },
          { name: 'Tools Engine', desc: '12 atomic SIVA tools for scoring, ranking, outreach, enrichment', color: 'orange' },
          { name: 'Safety & Guardrail', desc: 'Prevents wrong outputs - compliance rules, banned topics, persona boundaries', color: 'red' },
          { name: 'Execution & Memory', desc: 'Renders output, logs decisions, updates learning, trains future models', color: 'blue' },
        ].map((comp) => (
          <div key={comp.name} className={`bg-${comp.color}-500/10 border border-${comp.color}-500/30 rounded-xl p-4`}>
            <h3 className={`text-${comp.color}-400 font-bold mb-2`}>{comp.name}</h3>
            <p className="text-slate-300 text-sm">{comp.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SCEDiagram() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">SalesContext Engine (SCE)</h2>
      <p className="text-slate-400 mb-8">
        The SCE is the "spinal cord" of PremiumRadar. Every decision flows through it.
      </p>

      {/* Flow Diagram */}
      <div className="bg-slate-950 rounded-xl p-6 font-mono text-sm overflow-x-auto mb-8">
        <pre className="text-cyan-400">{`
         ┌────────────────────────────────────┐
         │      SALES CONTEXT ENGINE (SCE)    │
         └────────────────────────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────────┐
        │ Resolve Vertical (Banking)            │
        └───────────────────────────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────────┐
        │ Resolve Sub-Vertical (Employee Banking)│
        └───────────────────────────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────────┐
        │ Apply Region Pack (UAE - Dubai)       │
        └───────────────────────────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────────┐
        │ Determine ENTITY TARGET (Company)     │
        └───────────────────────────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────────┐
        │ Validate Signals / Tools / Persona    │
        └───────────────────────────────────────┘
                          │
                          ▼
        ┌───────────────────────────────────────┐
        │ Construct FINAL PACK + CONTEXT OBJECT │
        └───────────────────────────────────────┘
                          │
                          ▼
           ┌────────────────────────────┐
           │       SIVA OS KERNEL       │
           └────────────────────────────┘
        `}</pre>
      </div>

      {/* Context Object Example */}
      <div className="bg-slate-800/50 rounded-xl p-6">
        <h3 className="font-bold mb-4 text-emerald-400">Example Context Object</h3>
        <pre className="text-sm text-slate-300 overflow-x-auto">{`{
  vertical: "Banking",
  subVertical: "Employee Banking",
  region: "UAE – Dubai",
  entityTarget: "Company",
  allowedSignals: ["hiring-expansion", "headcount-jump", "office-opening", "market-entry", "funding-round"],
  allowedTools: ["enrich.company", "discover.company", "outreach.email", "score.opportunity"],
  personaId: "EB_UAE_Default",
  complianceRules: ["no-credit-advice", "no-regulatory-statements"],
  scoringModel: "EB_UAE_Score_v5",
  journeyTemplate: "EB_Onboarding_Journey_v2"
}`}</pre>
      </div>
    </div>
  );
}

function PacksDiagram() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">Intelligence Pack Engine</h2>
      <p className="text-slate-400 mb-8">
        Packs are self-evolving knowledge capsules that define behavior per vertical, sub-vertical, and region.
      </p>

      {/* Pack Hierarchy */}
      <div className="bg-slate-950 rounded-xl p-6 font-mono text-sm overflow-x-auto mb-8">
        <pre className="text-purple-400">{`
  ┌───────────────┐     ┌────────────────┐     ┌───────────────┐
  │ Vertical Pack │  +  │ SubVertical    │  +  │ Region Pack   │
  │   (Banking)   │     │ Pack (EB)      │     │   (UAE)       │
  └───────────────┘     └────────────────┘     └───────────────┘
          │                    │                    │
          └───────────┬────────┴───────────┬────────┘
                      ▼                    ▼
               ┌─────────────────────────────────┐
               │         FINAL PACK              │
               │  (EB_UAE with all overrides)    │
               └─────────────────────────────────┘
        `}</pre>
      </div>

      {/* Pack Components */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <h3 className="text-emerald-400 font-bold mb-3">Vertical Pack</h3>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>• Entity target type</li>
            <li>• Allowed signal types</li>
            <li>• Base scoring model</li>
            <li>• ICP definition</li>
            <li>• Tool eligibility</li>
          </ul>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
          <h3 className="text-cyan-400 font-bold mb-3">Sub-Vertical Pack</h3>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>• Role-specific persona</li>
            <li>• Scoring weight adjustments</li>
            <li>• Journey flow steps</li>
            <li>• Decision chains</li>
            <li>• Edge case rules</li>
          </ul>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <h3 className="text-purple-400 font-bold mb-3">Region Pack</h3>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>• Tone & vocabulary</li>
            <li>• Compliance rules</li>
            <li>• Cultural adjustments</li>
            <li>• Timing rules (Ramadan)</li>
            <li>• Local signal weights</li>
          </ul>
        </div>
      </div>

      {/* Self-Healing */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
        <h3 className="text-orange-400 font-bold mb-4">🔧 Self-Healing Engine</h3>
        <p className="text-slate-300 mb-4">Packs improve themselves through continuous monitoring:</p>
        <div className="flex flex-wrap gap-2">
          {['Telemetry Collection', 'Drift Detection', 'AI Diagnosis', 'Fix Generation', 'Human Approval', 'Auto-Apply', 'Reinforcement'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm">{step}</span>
              {i < 6 && <span className="text-orange-400">→</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgentsDiagram() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">Multi-Agent AI Orchestration</h2>
      <p className="text-slate-400 mb-8">
        11 specialized AI departments supervise SIVA, creating a virtual 300-person company that runs PremiumRadar.
      </p>

      {/* Agent Grid */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {AI_DEPARTMENTS.map((dept) => (
          <div key={dept.name} className={`bg-${dept.color}-500/10 border border-${dept.color}-500/30 rounded-xl p-4`}>
            <div className="text-2xl mb-2">{dept.icon}</div>
            <h3 className={`text-${dept.color}-400 font-bold mb-1`}>{dept.name}</h3>
            <p className="text-xs text-slate-400 mb-2">{dept.role}</p>
            <p className="text-sm text-slate-300">{dept.responsibility}</p>
          </div>
        ))}
      </div>

      {/* Supervision Model */}
      <div className="mt-8 bg-slate-950 rounded-xl p-6 font-mono text-sm">
        <pre className="text-emerald-400">{`
                   ┌────────────────────────┐
                   │     MULTI-AGENT AI      │
                   │  (Supervision Layer)    │
                   └───────────┬────────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │       SIVA OS Kernel    │
                  └────────────────────────┘
                               │
                               ▼
                  ┌────────────────────────┐
                  │     PremiumRadar OS     │
                  └────────────────────────┘
        `}</pre>
      </div>
    </div>
  );
}

const AI_DEPARTMENTS = [
  { name: 'Founder AI', role: 'Chief Vision Officer', responsibility: 'Protects vision, enforces 12 laws', icon: '👑', color: 'emerald' },
  { name: 'CTO AI', role: 'Technical Oversight', responsibility: 'Architecture, performance, scalability', icon: '🔧', color: 'cyan' },
  { name: 'CISO AI', role: 'Security & Compliance', responsibility: 'Prompt injection, data leakage, RBAC', icon: '🛡️', color: 'red' },
  { name: 'CFO AI', role: 'Cost Optimization', responsibility: 'API costs, model routing, budgets', icon: '💰', color: 'yellow' },
  { name: 'CPO AI', role: 'Product Strategy', responsibility: 'Feature prioritization, UX friction', icon: '📊', color: 'purple' },
  { name: 'QA AI', role: 'Quality Assurance', responsibility: 'Pack testing, hallucination detection', icon: '✅', color: 'green' },
  { name: 'Data Science AI', role: 'Model Optimization', responsibility: 'Scoring drift, conversion patterns', icon: '📈', color: 'blue' },
  { name: 'Research AI', role: 'Intelligence Research', responsibility: 'New signals, persona improvements', icon: '🔬', color: 'indigo' },
  { name: 'Analyst AI', role: 'Insights & Reports', responsibility: 'Bottlenecks, churn prediction', icon: '📉', color: 'orange' },
  { name: 'Marketing AI', role: 'GTM & Content', responsibility: 'Demo scripts, landing pages', icon: '📣', color: 'pink' },
  { name: 'CS AI', role: 'Customer Success', responsibility: 'User guidance, friction detection', icon: '🤝', color: 'teal' },
];

// ============================================================================
// PRD SECTION
// ============================================================================

function PRDSection() {
  const [activePRD, setActivePRD] = useState<'phases' | 'tools' | 'api' | 'db'>('phases');

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Master PRD</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Complete 5-phase roadmap with 85 sprints (S133-S217), API contracts, and database schemas.
        </p>
      </div>

      {/* PRD Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'phases', label: 'All 5 Phases', icon: '🗺️' },
          { id: 'tools', label: 'SIVA Tools', icon: '🔧' },
          { id: 'api', label: 'API Contracts', icon: '🔌' },
          { id: 'db', label: 'Database Schema', icon: '🗄️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePRD(tab.id as typeof activePRD)}
            className={`px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-all ${
              activePRD === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activePRD}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          {activePRD === 'phases' && <AllPhasesPRD />}
          {activePRD === 'tools' && <SIVAToolsPRD />}
          {activePRD === 'api' && <APIContractsPRD />}
          {activePRD === 'db' && <DatabaseSchemaPRD />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AllPhasesPRD() {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {ALL_PHASES_DATA.map((phase) => (
          <div
            key={phase.phase}
            className={`bg-slate-900/50 border rounded-xl p-4 cursor-pointer transition-all ${
              phase.current ? 'border-emerald-500' : 'border-slate-800 hover:border-slate-700'
            }`}
            onClick={() => setExpandedPhase(expandedPhase === phase.phase ? null : phase.phase)}
          >
            <div className={`text-3xl font-bold ${phase.current ? 'text-emerald-400' : 'text-slate-400'}`}>
              P{phase.phase}
            </div>
            <div className="text-sm text-slate-300">{phase.name}</div>
            <div className="text-xs text-slate-500">{phase.sprintRange}</div>
            <div className={`text-lg font-bold mt-2 ${phase.current ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {phase.targetARR}
            </div>
            {phase.current && (
              <span className="inline-block mt-2 bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded">
                CURRENT
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Phase Details */}
      {ALL_PHASES_DATA.map((phase) => (
        <div
          key={phase.phase}
          className={`bg-slate-900/50 border rounded-2xl overflow-hidden ${
            phase.current ? 'border-emerald-500' : 'border-slate-800'
          }`}
        >
          <button
            onClick={() => setExpandedPhase(expandedPhase === phase.phase ? null : phase.phase)}
            className="w-full px-8 py-6 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${
                phase.current ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                P{phase.phase}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{phase.name}</h2>
                <p className="text-slate-400">{phase.goal}</p>
                <p className="text-sm text-slate-500">{phase.sprintRange} • {phase.sprintCount} sprints</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-400">{phase.targetARR}</p>
                <p className="text-sm text-slate-500">Target ARR</p>
              </div>
              <span className={`text-2xl transition-transform ${expandedPhase === phase.phase ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </div>
          </button>

          <AnimatePresence>
            {expandedPhase === phase.phase && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-8 pb-8 border-t border-slate-800 pt-6">
                  {/* Highlights */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {phase.highlights.map((h) => (
                      <span key={h} className="bg-slate-800 text-slate-300 text-sm px-3 py-1 rounded-full">
                        {h}
                      </span>
                    ))}
                  </div>

                  {/* Exit Criteria */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
                    <h4 className="text-emerald-400 font-bold mb-2">Exit Criteria:</h4>
                    <ul className="grid md:grid-cols-2 gap-2">
                      {phase.exitCriteria.map((c, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-center gap-2">
                          <span className="text-emerald-400">□</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sprint Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-slate-400">Sprint</th>
                          <th className="text-left py-3 px-4 text-slate-400">Focus</th>
                          <th className="text-left py-3 px-4 text-slate-400">Repo</th>
                          <th className="text-left py-3 px-4 text-slate-400">Key Deliverables</th>
                        </tr>
                      </thead>
                      <tbody>
                        {phase.sprints.map((sprint) => (
                          <tr key={sprint.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                            <td className="py-3 px-4 font-mono text-emerald-400">{sprint.id}</td>
                            <td className="py-3 px-4">{sprint.focus}</td>
                            <td className="py-3 px-4 text-slate-400">{sprint.repo}</td>
                            <td className="py-3 px-4 text-slate-300">{sprint.deliverables}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Success Metrics by Phase */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Success Metrics by Phase</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Phase</th>
                <th className="text-right py-3 px-4 text-slate-400">Users</th>
                <th className="text-right py-3 px-4 text-slate-400">ARR</th>
                <th className="text-right py-3 px-4 text-slate-400">SIVA Queries/Day</th>
                <th className="text-left py-3 px-4 text-slate-400">Key Milestone</th>
              </tr>
            </thead>
            <tbody>
              {[
                { phase: 1, users: '100', arr: '$100K', queries: '1K', milestone: 'First paying customers' },
                { phase: 2, users: '500', arr: '$500K', queries: '10K', milestone: 'SIVA indispensable' },
                { phase: 3, users: '2K', arr: '$3M', queries: '50K', milestone: 'Enterprise deals' },
                { phase: 4, users: '10K', arr: '$20M', queries: '500K', milestone: 'Multi-vertical' },
                { phase: 5, users: '50K', arr: '$100M+', queries: '5M', milestone: 'Market leader' },
              ].map((row) => (
                <tr key={row.phase} className="border-b border-slate-800">
                  <td className="py-3 px-4 font-bold text-emerald-400">Phase {row.phase}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{row.users}</td>
                  <td className="py-3 px-4 text-right text-cyan-400 font-bold">{row.arr}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{row.queries}</td>
                  <td className="py-3 px-4 text-slate-300">{row.milestone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Types Section */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">User Types</h2>
        <p className="text-slate-400 mb-8">
          Understanding user types is critical. Individual users are NOT just &quot;free tier&quot; - they&apos;re salespeople whose companies haven&apos;t adopted PremiumRadar yet.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {USER_TYPES_DATA.map((user) => (
            <div key={user.type} className={`bg-${user.color}-500/10 border border-${user.color}-500/30 rounded-xl p-6`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{user.icon}</span>
                <h3 className={`text-${user.color}-400 font-bold text-lg`}>{user.type}</h3>
              </div>
              <p className="text-slate-300 text-sm mb-3">{user.description}</p>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">REAL WORLD</p>
                <p className="text-slate-300 text-xs italic">{user.realWorld}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Complete Phase Data with All Sprints
const ALL_PHASES_DATA = [
  {
    phase: 1,
    name: 'Launch Ready',
    sprintRange: 'S133-S152',
    sprintCount: 20,
    goal: 'Ship MVP to first paying customers',
    targetARR: '$100K',
    current: true,
    highlights: ['Banking EB UAE', 'SIVA workspace', 'Billing', 'Onboarding', '12 SIVA tools'],
    exitCriteria: [
      '10 beta customers onboarded',
      'Full user journey working',
      'Billing functional',
      'Support channels ready',
    ],
    sprints: [
      { id: 'S133', focus: 'Stealth Mode Polish', repo: 'SaaS', deliverables: 'Landing page, waitlist, private beta' },
      { id: 'S134', focus: 'User Onboarding v1', repo: 'SaaS', deliverables: 'Sign up, company setup, vertical selection' },
      { id: 'S135', focus: 'User Journey', repo: 'SaaS', deliverables: 'First-time experience, guided setup' },
      { id: 'S136', focus: 'Dashboard v2', repo: 'SaaS', deliverables: 'Core dashboard improvements' },
      { id: 'S137', focus: 'SIVA Chat Enhancement', repo: 'SaaS', deliverables: 'Chat interface, history, context' },
      { id: 'S138', focus: 'Signal Display', repo: 'SaaS', deliverables: 'Signal cards, filtering, details' },
      { id: 'S139', focus: 'Company Profiles', repo: 'SaaS', deliverables: 'Company view, signal history, contacts' },
      { id: 'S140', focus: 'Scoring UI', repo: 'SaaS', deliverables: 'QTLE visualization, score breakdown' },
      { id: 'S141', focus: 'Auth & Security', repo: 'SaaS', deliverables: 'NextAuth, RBAC basics' },
      { id: 'S142', focus: 'Billing Integration', repo: 'SaaS', deliverables: 'Stripe, subscription management' },
      { id: 'S143', focus: 'SIVA Tools v1', repo: 'OS', deliverables: 'Score, search, prioritize tools' },
      { id: 'S144', focus: 'Banking Intelligence', repo: 'OS', deliverables: 'Banking-specific scoring' },
      { id: 'S145', focus: 'Signal Pipeline v2', repo: 'OS', deliverables: 'Signal processing improvements' },
      { id: 'S146', focus: 'API Hardening', repo: 'OS', deliverables: 'Rate limiting, error handling' },
      { id: 'S147', focus: 'Super Admin Core', repo: 'SA', deliverables: 'Vertical config editor' },
      { id: 'S148', focus: 'Super Admin Personas', repo: 'SA', deliverables: 'Persona management' },
      { id: 'S149', focus: 'Tenant Admin MVP', repo: 'SaaS', deliverables: 'Basic tenant management' },
      { id: 'S150', focus: 'E2E Testing', repo: 'All', deliverables: 'Comprehensive test coverage' },
      { id: 'S151', focus: 'Performance', repo: 'All', deliverables: 'Load testing, optimization' },
      { id: 'S152', focus: 'Launch Prep', repo: 'All', deliverables: 'Documentation, support setup' },
    ],
  },
  {
    phase: 2,
    name: 'Intelligence Engine',
    sprintRange: 'S153-S167',
    sprintCount: 15,
    goal: 'SIVA becomes indispensable',
    targetARR: '$500K',
    current: false,
    highlights: ['Proactive alerts', 'Knowledge graph', 'Citations', 'Voice input', 'SIVA Memory'],
    exitCriteria: [
      'Daily proactive briefings working',
      'Citation system complete',
      'Voice input functional',
      'Users describe SIVA as "indispensable"',
    ],
    sprints: [
      { id: 'S153', focus: 'SIVA Proactive Alerts', repo: 'OS', deliverables: 'Daily briefings, signal alerts' },
      { id: 'S154', focus: 'Knowledge Graph v1', repo: 'OS', deliverables: 'Company-people-signal relationships' },
      { id: 'S155', focus: 'Citation System', repo: 'OS', deliverables: '"Based on..." with sources' },
      { id: 'S156', focus: 'SIVA Memory', repo: 'OS', deliverables: 'Conversation history, user preferences' },
      { id: 'S157', focus: 'Multi-Source Intel', repo: 'OS', deliverables: 'LinkedIn, news, company data fusion' },
      { id: 'S158', focus: 'Pattern Detection', repo: 'OS', deliverables: 'Trend analysis, opportunity patterns' },
      { id: 'S159', focus: 'SIVA Tools v2', repo: 'OS', deliverables: 'Outreach, objection handling' },
      { id: 'S160', focus: 'Scoring v2', repo: 'OS', deliverables: 'ML-enhanced scoring' },
      { id: 'S161', focus: 'Contact Intelligence', repo: 'OS', deliverables: 'Decision maker mapping' },
      { id: 'S162', focus: 'SIVA Voice Input', repo: 'SaaS', deliverables: 'Web speech recognition' },
      { id: 'S163', focus: 'Dashboard Intelligence', repo: 'SaaS', deliverables: 'Smart widgets, recommendations' },
      { id: 'S164', focus: 'Pipeline Predictions', repo: 'SaaS', deliverables: 'Deal probability, timing' },
      { id: 'S165', focus: 'Learning System', repo: 'OS', deliverables: 'User feedback integration' },
      { id: 'S166', focus: 'Sub-Vertical Depth', repo: 'OS', deliverables: 'Corporate banking, SME banking' },
      { id: 'S167', focus: 'Intelligence Metrics', repo: 'All', deliverables: 'Usage analytics, AI performance' },
    ],
  },
  {
    phase: 3,
    name: 'Enterprise Ready',
    sprintRange: 'S168-S182',
    sprintCount: 15,
    goal: 'SOC2, SDK, Mobile',
    targetARR: '$3M',
    current: false,
    highlights: ['SOC2 Type II', 'SIVA SDK v1', 'Mobile app', 'Enterprise SSO', 'Salesforce integration'],
    exitCriteria: [
      'SOC2 Type II audit passed',
      'SIVA SDK published',
      'Mobile app in app stores',
      '5 enterprise customers',
    ],
    sprints: [
      { id: 'S168', focus: 'SOC2 Foundation', repo: 'All', deliverables: 'Audit logging, access controls' },
      { id: 'S169', focus: 'SOC2 Controls', repo: 'All', deliverables: 'Security policies, monitoring' },
      { id: 'S170', focus: 'GDPR Compliance', repo: 'All', deliverables: 'Data subject rights, consent' },
      { id: 'S171', focus: 'Enterprise SSO', repo: 'SaaS', deliverables: 'SAML, OIDC, custom IdP' },
      { id: 'S172', focus: 'Advanced RBAC', repo: 'SaaS', deliverables: 'Custom roles, permissions' },
      { id: 'S173', focus: 'Tenant Admin v2', repo: 'SaaS', deliverables: 'Full admin capabilities' },
      { id: 'S174', focus: 'SIVA SDK v1', repo: 'OS', deliverables: 'Public API, SDK scaffolding' },
      { id: 'S175', focus: 'SDK Documentation', repo: 'OS', deliverables: 'Developer docs, examples' },
      { id: 'S176', focus: 'Salesforce Integration', repo: 'OS', deliverables: 'Native SF connector' },
      { id: 'S177', focus: 'Mobile App v1', repo: 'SaaS', deliverables: 'iOS/Android MVP' },
      { id: 'S178', focus: 'Mobile SIVA', repo: 'SaaS', deliverables: 'Voice on mobile' },
      { id: 'S179', focus: 'Push Notifications', repo: 'SaaS', deliverables: 'Real-time mobile alerts' },
      { id: 'S180', focus: 'Audit & Compliance UI', repo: 'SA', deliverables: 'Compliance dashboards' },
      { id: 'S181', focus: 'Enterprise Onboarding', repo: 'SaaS', deliverables: 'Bulk user import, SSO setup' },
      { id: 'S182', focus: 'Enterprise Launch', repo: 'All', deliverables: 'Enterprise tier ready' },
    ],
  },
  {
    phase: 4,
    name: 'Scale & Expand',
    sprintRange: 'S183-S202',
    sprintCount: 20,
    goal: 'Multi-vertical, SLM development',
    targetARR: '$20M',
    current: false,
    highlights: ['Insurance vertical', 'Real Estate vertical', 'SLM v1', 'HubSpot integration', 'White-label'],
    exitCriteria: [
      '3 verticals active (Banking, Insurance, Real Estate)',
      'SLM v1 deployed',
      '10+ integration partners',
      '1000+ paying customers',
    ],
    sprints: [
      { id: 'S183', focus: 'Insurance Vertical', repo: 'All', deliverables: 'Insurance config, personas' },
      { id: 'S184', focus: 'Insurance Signals', repo: 'OS', deliverables: 'Insurance-specific signals' },
      { id: 'S185', focus: 'Insurance Intelligence', repo: 'OS', deliverables: 'Insurance scoring, patterns' },
      { id: 'S186', focus: 'Real Estate Vertical', repo: 'All', deliverables: 'RE config, personas' },
      { id: 'S187', focus: 'Real Estate Signals', repo: 'OS', deliverables: 'RE-specific signals' },
      { id: 'S188', focus: 'Real Estate Intelligence', repo: 'OS', deliverables: 'RE scoring, patterns' },
      { id: 'S189', focus: 'SLM Data Collection', repo: 'OS', deliverables: 'Sales conversation corpus' },
      { id: 'S190', focus: 'SLM Pipeline', repo: 'OS', deliverables: 'Fine-tuning infrastructure' },
      { id: 'S191', focus: 'SLM v1 Training', repo: 'OS', deliverables: 'First fine-tuned model' },
      { id: 'S192', focus: 'SLM Integration', repo: 'OS', deliverables: 'Replace base model calls' },
      { id: 'S193', focus: 'SLM Evaluation', repo: 'OS', deliverables: 'Benchmarks, quality metrics' },
      { id: 'S194', focus: 'SIVA SDK v2', repo: 'OS', deliverables: 'Enhanced APIs, webhooks' },
      { id: 'S195', focus: 'HubSpot Integration', repo: 'OS', deliverables: 'Native HubSpot connector' },
      { id: 'S196', focus: 'Pipedrive Integration', repo: 'OS', deliverables: 'Native Pipedrive connector' },
      { id: 'S197', focus: 'White-Label v1', repo: 'SaaS', deliverables: 'Rebrandable SIVA' },
      { id: 'S198', focus: 'Marketplace', repo: 'SaaS', deliverables: 'Integration marketplace' },
      { id: 'S199', focus: 'International v1', repo: 'All', deliverables: 'Multi-currency, localization' },
      { id: 'S200', focus: 'UAE Expansion', repo: 'All', deliverables: 'UAE-specific features' },
      { id: 'S201', focus: 'India Market', repo: 'All', deliverables: 'India-specific features' },
      { id: 'S202', focus: 'Scale Metrics', repo: 'All', deliverables: 'Growth analytics' },
    ],
  },
  {
    phase: 5,
    name: 'Dominance',
    sprintRange: 'S203-S217',
    sprintCount: 15,
    goal: 'Platform play, $1B+ potential',
    targetARR: '$100M+',
    current: false,
    highlights: ['5 verticals', 'SIVA voice device', 'Open-source SLM', 'Global regions', 'IPO readiness'],
    exitCriteria: [
      '5 verticals active',
      'SIVA recognized as industry standard',
      '$100M+ ARR',
      '100+ SDK integrations',
      'SIVA devices shipping',
    ],
    sprints: [
      { id: 'S203', focus: 'Recruitment Vertical', repo: 'All', deliverables: 'Recruitment config, personas' },
      { id: 'S204', focus: 'SaaS Sales Vertical', repo: 'All', deliverables: 'B2B SaaS sales config' },
      { id: 'S205', focus: 'SIVA Voice Device', repo: 'All', deliverables: 'Dedicated hardware design' },
      { id: 'S206', focus: 'Wake Word System', repo: 'OS', deliverables: '"Hey SIVA" detection' },
      { id: 'S207', focus: 'SLM v2', repo: 'OS', deliverables: 'Advanced fine-tuning' },
      { id: 'S208', focus: 'Open Source SLM', repo: 'OS', deliverables: 'Community release' },
      { id: 'S209', focus: 'Developer Ecosystem', repo: 'All', deliverables: 'Partner program' },
      { id: 'S210', focus: 'SIVA Marketplace', repo: 'SaaS', deliverables: 'Skills, plugins, integrations' },
      { id: 'S211', focus: 'Multi-Language', repo: 'All', deliverables: '10+ language support' },
      { id: 'S212', focus: 'Global Regions', repo: 'All', deliverables: 'EU, APAC data centers' },
      { id: 'S213', focus: 'Enterprise Scale', repo: 'All', deliverables: '10K+ seat deployments' },
      { id: 'S214', focus: 'Platform Analytics', repo: 'All', deliverables: 'Ecosystem metrics' },
      { id: 'S215', focus: 'Strategic Partnerships', repo: 'All', deliverables: 'Major CRM partnerships' },
      { id: 'S216', focus: 'IPO Readiness', repo: 'All', deliverables: 'Financial systems, audits' },
      { id: 'S217', focus: 'Market Leadership', repo: 'All', deliverables: 'Category definition' },
    ],
  },
];

function Phase1PRD() {
  return (
    <div className="space-y-8">
      {/* Phase 1 Scope */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6 text-emerald-400">Phase 1: Launch Ready (S133-S152)</h2>
        <p className="text-slate-400 mb-6">
          Ship a complete Banking EB UAE sales intelligence product to first paying customers.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* What's In Scope */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
            <h3 className="text-emerald-400 font-bold mb-4">✅ In Scope (Phase 1)</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Banking vertical ONLY</li>
              <li>• Employee Banking sub-vertical focus</li>
              <li>• UAE region</li>
              <li>• Company entity target</li>
              <li>• 12 SIVA tools (all built)</li>
              <li>• SIVA pageless workspace</li>
              <li>• Individual + Tenant user types</li>
              <li>• Basic Super Admin</li>
              <li>• Stripe billing integration</li>
              <li>• NextAuth authentication</li>
            </ul>
          </div>

          {/* What's Deferred */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
            <h3 className="text-red-400 font-bold mb-4">🚫 Deferred (Phase 2+)</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Insurance, Real Estate, Recruitment verticals</li>
              <li>• Full 11-department AI orchestration</li>
              <li>• Self-healing pack updates</li>
              <li>• SIVA SDK for third parties</li>
              <li>• Mobile app</li>
              <li>• Voice input</li>
              <li>• SOC2 compliance</li>
              <li>• Enterprise SSO</li>
            </ul>
          </div>
        </div>
      </div>

      {/* User Types - Detailed */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">User Types (Phase 1) - Deep Dive</h2>
        <p className="text-slate-400 mb-8">
          Understanding user types is critical. Individual users are NOT just "free tier" - they're salespeople whose companies haven't adopted PremiumRadar yet.
        </p>

        <div className="space-y-6">
          {USER_TYPES_DATA.map((user) => (
            <div key={user.type} className={`bg-${user.color}-500/10 border border-${user.color}-500/30 rounded-2xl p-6`}>
              <div className="flex items-start gap-4 mb-4">
                <span className="text-4xl">{user.icon}</span>
                <div>
                  <h3 className={`text-${user.color}-400 font-bold text-xl mb-1`}>{user.type}</h3>
                  <p className="text-slate-300">{user.description}</p>
                </div>
              </div>

              {/* Real World Example */}
              <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                <p className="text-xs text-slate-500 mb-1">REAL WORLD EXAMPLE</p>
                <p className="text-slate-300 text-sm italic">{user.realWorld}</p>
              </div>

              {/* Characteristics */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className={`text-${user.color}-400 font-medium text-sm mb-2`}>Key Characteristics:</p>
                  <ul className="space-y-1">
                    {user.characteristics.map((c, i) => (
                      <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                        <span className={`text-${user.color}-400`}>•</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Powers/Features or Limitations */}
                <div>
                  {'powers' in user && (
                    <>
                      <p className="text-emerald-400 font-medium text-sm mb-2">Powers:</p>
                      <ul className="space-y-1">
                        {user.powers?.map((p, i) => (
                          <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                            <span className="text-emerald-400">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {'features' in user && (
                    <>
                      <p className="text-purple-400 font-medium text-sm mb-2">Features:</p>
                      <ul className="space-y-1">
                        {user.features?.map((f, i) => (
                          <li key={i} className="text-slate-300 text-xs flex items-start gap-2">
                            <span className="text-purple-400">✓</span> {f}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {'limitations' in user && user.limitations && (
                    <>
                      <p className="text-red-400 font-medium text-sm mb-2 mt-3">Limitations:</p>
                      <ul className="space-y-1">
                        {user.limitations.map((l, i) => (
                          <li key={i} className="text-slate-400 text-xs flex items-start gap-2">
                            <span className="text-red-400">✗</span> {l}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {/* Upgrade Path */}
              {'upgrade' in user && (
                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <p className="text-emerald-400 text-xs font-medium">UPGRADE PATH:</p>
                  <p className="text-slate-300 text-sm">{user.upgrade}</p>
                </div>
              )}

              {/* Access Note */}
              {'access' in user && (
                <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-yellow-400 text-xs font-medium">ACCESS:</p>
                  <p className="text-slate-300 text-sm">{user.access}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sprint Breakdown */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Sprint Breakdown (S133-S152)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400">Sprint</th>
                <th className="text-left py-3 px-4 text-slate-400">Focus</th>
                <th className="text-left py-3 px-4 text-slate-400">Repo</th>
                <th className="text-left py-3 px-4 text-slate-400">Key Deliverables</th>
              </tr>
            </thead>
            <tbody>
              {PHASE1_SPRINTS.map((sprint) => (
                <tr key={sprint.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-mono text-emerald-400">{sprint.id}</td>
                  <td className="py-3 px-4">{sprint.focus}</td>
                  <td className="py-3 px-4 text-slate-400">{sprint.repo}</td>
                  <td className="py-3 px-4 text-slate-300">{sprint.deliverables}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const PHASE1_SPRINTS = [
  { id: 'S133', focus: 'Stealth Mode Polish', repo: 'SaaS', deliverables: 'Landing page, waitlist, private beta' },
  { id: 'S134', focus: 'User Onboarding v1', repo: 'SaaS', deliverables: 'Sign up, company setup, vertical selection' },
  { id: 'S135', focus: 'User Journey', repo: 'SaaS', deliverables: 'First-time experience, guided setup' },
  { id: 'S136', focus: 'Dashboard v2', repo: 'SaaS', deliverables: 'Core dashboard improvements' },
  { id: 'S137', focus: 'SIVA Chat Enhancement', repo: 'SaaS', deliverables: 'Chat interface, history, context' },
  { id: 'S138', focus: 'Signal Display', repo: 'SaaS', deliverables: 'Signal cards, filtering, details' },
  { id: 'S139', focus: 'Company Profiles', repo: 'SaaS', deliverables: 'Company view, signal history, contacts' },
  { id: 'S140', focus: 'Scoring UI', repo: 'SaaS', deliverables: 'QTLE visualization, score breakdown' },
  { id: 'S141', focus: 'Auth & Security', repo: 'SaaS', deliverables: 'NextAuth, RBAC basics' },
  { id: 'S142', focus: 'Billing Integration', repo: 'SaaS', deliverables: 'Stripe, subscription management' },
  { id: 'S143', focus: 'SIVA Tools v1', repo: 'OS', deliverables: 'Score, search, prioritize tools' },
  { id: 'S144', focus: 'Banking Intelligence', repo: 'OS', deliverables: 'Banking-specific scoring' },
  { id: 'S145', focus: 'Signal Pipeline v2', repo: 'OS', deliverables: 'Signal processing improvements' },
  { id: 'S146', focus: 'API Hardening', repo: 'OS', deliverables: 'Rate limiting, error handling' },
  { id: 'S147', focus: 'Super Admin Core', repo: 'SA', deliverables: 'Vertical config editor' },
  { id: 'S148', focus: 'Super Admin Personas', repo: 'SA', deliverables: 'Persona management' },
  { id: 'S149', focus: 'Tenant Admin MVP', repo: 'SaaS', deliverables: 'Basic tenant management' },
  { id: 'S150', focus: 'E2E Testing', repo: 'All', deliverables: 'Comprehensive test coverage' },
  { id: 'S151', focus: 'Performance', repo: 'All', deliverables: 'Load testing, optimization' },
  { id: 'S152', focus: 'Launch Prep', repo: 'All', deliverables: 'Documentation, support setup' },
];

// ============================================================================
// USER TYPES DATA (Based on Founder's Clarification)
// ============================================================================

const USER_TYPES_DATA = [
  {
    type: 'Individual User',
    icon: '👤',
    color: 'blue',
    description: 'A solo salesperson who discovers PremiumRadar and wants to boost their productivity. They work for a company (e.g., ADCB Bank) but their employer is NOT enrolled as a tenant.',
    realWorld: 'Ahmed works at ADCB Employee Banking. He hears about PremiumRadar, signs up with his personal email, and uses it to find hiring companies in Dubai. ADCB has no idea he\'s using it.',
    characteristics: [
      'Signs up with personal email (not company email)',
      'Uses global intelligence packs (not tenant-customized)',
      'Has limited API budget (pay-as-you-go or basic plan)',
      'SIVA adapts to their individual style via "mini-persona"',
      'Cannot create sub-verticals or customize packs',
      'Data is isolated - only they can see their leads',
    ],
    limitations: [
      'No team features or collaboration',
      'No custom branding or white-label',
      'No tenant-level analytics',
      'Limited API calls per month',
    ],
    upgrade: 'When ADCB decides to adopt PremiumRadar, Ahmed can convert to a Tenant User under ADCB\'s account.',
  },
  {
    type: 'Tenant User',
    icon: '👥',
    color: 'purple',
    description: 'A salesperson whose company (tenant) has enrolled in PremiumRadar. They benefit from company-specific packs, shared intelligence, and team features.',
    realWorld: 'Sarah works at Emirates NBD, which has an enterprise subscription. She uses her company email, sees company-branded SIVA persona, and her leads feed into team analytics.',
    characteristics: [
      'Signs up with company email domain',
      'Uses tenant-customized intelligence packs',
      'Benefits from team-shared signals and contacts',
      'SIVA has tenant-specific persona adjustments',
      'Leads and activities visible to Tenant Admin',
      'Higher API limits (enterprise budgets)',
    ],
    features: [
      'Team leaderboards and collaboration',
      'Shared contact database',
      'Company-branded SIVA responses',
      'Access to tenant campaigns',
    ],
    upgrade: 'Can be promoted to Tenant Admin by existing admin.',
  },
  {
    type: 'Tenant Admin',
    icon: '⚙️',
    color: 'cyan',
    description: 'The administrator who manages a tenant\'s PremiumRadar account. Typically a Sales Manager or Revenue Operations leader.',
    realWorld: 'Mohammad is Head of Corporate Banking at FAB. He manages 25 salespeople, configures their SIVA persona, monitors team performance, and adjusts campaign settings.',
    characteristics: [
      'Manages all users within the tenant',
      'Configures tenant-level settings and campaigns',
      'Can override SIVA persona tone (within bounds)',
      'Views team analytics and performance',
      'Manages billing and subscription',
      'Sets up integrations (CRM, email)',
    ],
    powers: [
      'Add/remove users',
      'Create sales territories',
      'Configure outreach campaigns',
      'View all team leads and activities',
      'Adjust scoring weights (regional)',
    ],
    limitations: [
      'Cannot create new verticals or sub-verticals',
      'Cannot modify core scoring algorithms',
      'Cannot access other tenants\' data',
    ],
  },
  {
    type: 'Super Admin',
    icon: '👑',
    color: 'emerald',
    description: 'Founder-only access. The god-mode account that manages the entire PremiumRadar platform.',
    realWorld: 'You (Sivakumar) - the only person who can create verticals, modify global packs, monitor all tenants, and configure the AI system.',
    characteristics: [
      'Full platform access (all tenants)',
      'Creates and manages verticals/sub-verticals',
      'Configures global intelligence packs',
      'Monitors API costs across all tenants',
      'Deploys personas and scoring models',
      'Access to Founder Bible and system internals',
    ],
    powers: [
      'Create/delete verticals and sub-verticals',
      'Manage global personas and packs',
      'Override any tenant settings',
      'View platform-wide analytics',
      'Configure AI model routing and costs',
      'Access all audit logs',
    ],
    access: 'Protected by special session cookie. Only accessible at /superadmin with founder credentials.',
  },
];

function SIVAToolsPRD() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">12 SIVA Tools (All Built)</h2>
      <p className="text-slate-400 mb-8">
        These atomic tools form the foundation of SIVA's reasoning. Each has strict schemas and deterministic outputs.
      </p>

      <div className="grid gap-4">
        {SIVA_TOOLS.map((tool, index) => (
          <div key={tool.name} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 text-sm">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-emerald-400">{tool.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    tool.type === 'Foundation' ? 'bg-blue-500/20 text-blue-400' :
                    tool.type === 'Strict' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-orange-500/20 text-orange-400'
                  }`}>{tool.type}</span>
                </div>
                <p className="text-slate-300 text-sm mb-2">{tool.description}</p>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span>Input: {tool.input}</span>
                  <span>Output: {tool.output}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SIVA_TOOLS = [
  { name: 'EVALUATE_COMPANY_QUALITY', type: 'Strict', description: 'Scores company fit using banking signals', input: 'company_name, domain, industry, size, uae_signals', output: 'quality_score (0-100), reasoning' },
  { name: 'SELECT_CONTACT_TIER', type: 'Foundation', description: 'Selects target contact roles based on company profile', input: 'company_size, hiring_velocity, maturity', output: 'target_titles[] (HR Director, Payroll Manager)' },
  { name: 'CALCULATE_TIMING_SCORE', type: 'Foundation', description: 'Applies temporal multipliers (Ramadan, Q1, signals)', input: 'current_month, last_contact_date, recent_signals', output: 'timing_multiplier (0.0-2.0)' },
  { name: 'CHECK_EDGE_CASES', type: 'Foundation', description: 'Detects enterprise brands, government, free zones', input: 'company_name, sector, license_type, signals', output: 'adjusted_score with business rules' },
  { name: 'MATCH_BANKING_PRODUCTS', type: 'Strict', description: 'Maps company profile to banking products', input: 'company_profile, signals', output: 'product_recommendations (payroll, credit, loans)' },
  { name: 'SELECT_OUTREACH_CHANNEL', type: 'Strict', description: 'Selects best channel (email, SMS, phone)', input: 'contact_profile, company_context', output: 'channel recommendation with confidence' },
  { name: 'GENERATE_OPENING_CONTEXT', type: 'Strict', description: 'Creates personalized opening referencing signal', input: 'company, signal, contact', output: '"I noticed {{company}} recently {{signal}}..."' },
  { name: 'GENERATE_COMPOSITE_SCORE', type: 'Strict', description: 'Combines Q-Score, T-Score, L-Score, E-Score', input: 'individual scores', output: 'final_score = COMPUTE_QSCORE × timing_multiplier' },
  { name: 'GENERATE_OUTREACH_MESSAGE', type: 'Delegated', description: 'Full email/message generation with templates', input: 'context, persona, signal', output: 'complete outreach message' },
  { name: 'DETERMINE_FOLLOWUP_STRATEGY', type: 'Delegated', description: 'Plans follow-up sequences based on responses', input: 'response_patterns, engagement_history', output: 'follow-up plan' },
  { name: 'HANDLE_OBJECTION', type: 'Delegated', description: 'Generates responses to common objections', input: 'objection_type, company_context', output: 'personalized counter-arguments' },
  { name: 'TRACK_RELATIONSHIP_HEALTH', type: 'Delegated', description: 'Monitors relationship status over time', input: 'engagement_history, decision_points', output: 'relationship_health_score' },
];

function APIContractsPRD() {
  return (
    <div className="space-y-8">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Core API Endpoints</h2>

        {/* OS API Routes */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-emerald-400 mb-4">UPR OS API Routes</h3>
          <div className="bg-slate-950 rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400">Method</th>
                  <th className="text-left py-2 px-3 text-slate-400">Endpoint</th>
                  <th className="text-left py-2 px-3 text-slate-400">Purpose</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {API_ENDPOINTS.map((ep) => (
                  <tr key={ep.endpoint} className="border-b border-slate-800">
                    <td className={`py-2 px-3 ${ep.method === 'POST' ? 'text-emerald-400' : 'text-cyan-400'}`}>{ep.method}</td>
                    <td className="py-2 px-3">{ep.endpoint}</td>
                    <td className="py-2 px-3 text-slate-400">{ep.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Example Request/Response */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-bold text-cyan-400 mb-2">Example: Score Request</h4>
            <pre className="bg-slate-950 rounded-xl p-4 text-xs overflow-x-auto text-slate-300">{`POST /api/os/score
Content-Type: application/json

{
  "company": {
    "name": "TechCorp UAE",
    "domain": "techcorp.ae",
    "size": 150,
    "industry": "Technology"
  },
  "signals": [
    { "type": "hiring-expansion", "count": 25 },
    { "type": "office-opening", "location": "Dubai" }
  ],
  "context": {
    "vertical": "banking",
    "subVertical": "employee-banking",
    "region": "UAE"
  }
}`}</pre>
          </div>
          <div>
            <h4 className="font-bold text-emerald-400 mb-2">Example: Score Response</h4>
            <pre className="bg-slate-950 rounded-xl p-4 text-xs overflow-x-auto text-slate-300">{`{
  "success": true,
  "data": {
    "q_score": 85,
    "t_score": 72,
    "l_score": 60,
    "e_score": 45,
    "composite_score": 78,
    "reasoning": {
      "quality": "Strong hiring signal indicates payroll growth",
      "timing": "Q1 optimal for banking conversations",
      "lifecycle": "Mature company, likely has existing bank",
      "engagement": "No prior contact history"
    },
    "recommendation": "HIGH_PRIORITY",
    "suggested_action": "Initiate outreach within 48 hours"
  }
}`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

const API_ENDPOINTS = [
  { method: 'POST', endpoint: '/api/os/discovery', purpose: 'Signal discovery from multiple sources' },
  { method: 'POST', endpoint: '/api/os/enrich', purpose: 'Entity enrichment from Apollo, LinkedIn' },
  { method: 'POST', endpoint: '/api/os/score', purpose: 'QTLE scoring calculation' },
  { method: 'POST', endpoint: '/api/os/rank', purpose: 'Profile-based ranking' },
  { method: 'POST', endpoint: '/api/os/outreach', purpose: 'Message generation' },
  { method: 'POST', endpoint: '/api/os/pipeline', purpose: 'Full discovery-to-outreach pipeline' },
  { method: 'GET', endpoint: '/api/os/verticals', purpose: 'List vertical configurations' },
  { method: 'GET', endpoint: '/api/os/verticals/:slug/config', purpose: 'Get vertical pack' },
  { method: 'POST', endpoint: '/api/os/llm/select', purpose: 'Select optimal LLM for task' },
  { method: 'POST', endpoint: '/api/os/llm/complete', purpose: 'LLM completion with routing' },
  { method: 'POST', endpoint: '/api/agent-core/v1/tools/:toolName', purpose: 'Execute SIVA tool' },
  { method: 'GET', endpoint: '/api/agent-core/v1/decisions', purpose: 'Get decision history' },
];

function DatabaseSchemaPRD() {
  return (
    <div className="space-y-8">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Database Schema Overview</h2>
        <p className="text-slate-400 mb-6">
          130+ tables across 74 migrations. Key table groups below.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {DB_TABLE_GROUPS.map((group) => (
            <div key={group.name} className={`bg-${group.color}-500/10 border border-${group.color}-500/30 rounded-xl p-4`}>
              <h3 className={`text-${group.color}-400 font-bold mb-3`}>{group.name}</h3>
              <div className="space-y-2">
                {group.tables.map((table) => (
                  <div key={table.name} className="bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="font-mono text-sm text-slate-300">{table.name}</span>
                    <p className="text-xs text-slate-500">{table.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const DB_TABLE_GROUPS = [
  {
    name: 'Core Entities',
    color: 'emerald',
    tables: [
      { name: 'entities_company', desc: 'Company profiles with UAE signals' },
      { name: 'entities_person', desc: 'Individual contacts' },
      { name: 'signals', desc: 'Company events (hiring, funding)' },
      { name: 'hiring_signals', desc: 'HR-specific signals' },
    ],
  },
  {
    name: 'Vertical Configuration',
    color: 'cyan',
    tables: [
      { name: 'vertical_packs', desc: 'Main vertical definitions' },
      { name: 'vertical_signal_types', desc: 'Signals per vertical' },
      { name: 'vertical_persona_templates', desc: 'Persona per sub-vertical' },
      { name: 'vertical_scoring_templates', desc: 'Scoring formulas' },
    ],
  },
  {
    name: 'Scoring & Analytics',
    color: 'purple',
    tables: [
      { name: 'lead_scores', desc: 'Lead quality scores' },
      { name: 'lead_score_history', desc: 'Score evolution tracking' },
      { name: 'score_alerts', desc: 'Score-based alerts' },
      { name: 'agent_decisions', desc: 'SIVA tool decision logging' },
    ],
  },
  {
    name: 'Multi-Tenancy',
    color: 'orange',
    tables: [
      { name: 'tenants', desc: 'Organization/tenant records' },
      { name: 'tenant_region_bindings', desc: 'Tenant-region assignments' },
      { name: 'territory_definitions', desc: 'Territory configurations' },
      { name: 'region_profiles', desc: 'Regional customization' },
    ],
  },
];

// ============================================================================
// ROADMAP SECTION
// ============================================================================

function RoadmapSection() {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Product Roadmap</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          85 sprints (S133-S217) across 5 phases to reach $1B+ platform.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {ROADMAP_PHASES.map((phase, index) => (
          <div key={phase.name} className="mb-8 relative">
            <div className={`bg-slate-900/50 border rounded-2xl p-8 ${
              phase.current ? 'border-emerald-500' : 'border-slate-800'
            }`}>
              {phase.current && (
                <span className="absolute -top-3 left-8 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full">
                  CURRENT PHASE
                </span>
              )}
              <div className="flex items-start gap-6">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${
                  phase.current
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h2 className="text-2xl font-bold">{phase.name}</h2>
                    <span className="text-sm text-slate-500">({phase.sprints})</span>
                  </div>
                  <p className="text-slate-400 mb-4">{phase.goal}</p>
                  <div className="flex flex-wrap gap-2">
                    {phase.highlights.map((h) => (
                      <span key={h} className="bg-slate-800 text-slate-300 text-sm px-3 py-1 rounded-full">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">{phase.target}</p>
                  <p className="text-sm text-slate-500">Target ARR</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ROADMAP_PHASES = [
  {
    name: 'Launch Ready',
    sprints: 'S133-S152',
    goal: 'Ship MVP to first paying customers',
    highlights: ['Banking EB UAE', 'SIVA workspace', 'Billing', 'Onboarding'],
    target: '$100K',
    current: true,
  },
  {
    name: 'Intelligence Engine',
    sprints: 'S153-S167',
    goal: 'SIVA becomes indispensable',
    highlights: ['Proactive alerts', 'Knowledge graph', 'Citations', 'Voice input'],
    target: '$500K',
    current: false,
  },
  {
    name: 'Enterprise Ready',
    sprints: 'S168-S182',
    goal: 'SOC2, SDK, Mobile',
    highlights: ['SOC2 Type II', 'SIVA SDK v1', 'Mobile app', 'Enterprise SSO'],
    target: '$3M',
    current: false,
  },
  {
    name: 'Scale & Expand',
    sprints: 'S183-S202',
    goal: 'Multi-vertical, SLM development',
    highlights: ['Insurance', 'Real Estate', 'SLM v1', 'HubSpot integration'],
    target: '$20M',
    current: false,
  },
  {
    name: 'Dominance',
    sprints: 'S203-S217',
    goal: 'Platform play, $1B+ potential',
    highlights: ['5 verticals', 'SIVA device', 'Open-source SLM', 'Global regions'],
    target: '$100M+',
    current: false,
  },
];

// ============================================================================
// LEARN SECTION
// ============================================================================

function LearnSection({
  expandedModule,
  setExpandedModule,
  markTopicComplete,
  completedTopics,
}: {
  expandedModule: string | null;
  setExpandedModule: (id: string | null) => void;
  markTopicComplete: (id: string) => void;
  completedTopics: string[];
}) {
  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Learning Modules</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Master PremiumRadar from A to Z. Each module builds on the previous.
        </p>
      </div>

      <div className="space-y-4">
        {LEARNING_MODULES.map((module) => {
          const completedCount = module.topics.filter(t => completedTopics.includes(t.id)).length;
          const isComplete = completedCount === module.topics.length;

          return (
            <div key={module.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isComplete ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}>
                    {isComplete ? '✓' : module.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{module.title}</h3>
                    <p className="text-sm text-slate-400">{module.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-emerald-400">{completedCount}/{module.topics.length} topics</p>
                    <p className="text-xs text-slate-500">{module.estimatedTime}</p>
                  </div>
                  <span className={`text-2xl transition-transform ${expandedModule === module.id ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {expandedModule === module.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-slate-800 pt-4">
                      {module.topics.map((topic) => (
                        <TopicCard
                          key={topic.id}
                          topic={topic}
                          isComplete={completedTopics.includes(topic.id)}
                          onComplete={() => markTopicComplete(topic.id)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopicCard({
  topic,
  isComplete,
  onComplete
}: {
  topic: LearningTopic;
  isComplete: boolean;
  onComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`mb-4 rounded-xl border ${
      isComplete ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
            isComplete ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'
          }`}>
            {isComplete ? '✓' : '○'}
          </span>
          <span className={isComplete ? 'text-emerald-400' : 'text-white'}>{topic.title}</span>
        </div>
        <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              <p className="text-slate-300">{topic.content}</p>

              {topic.analogy && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                  <p className="text-cyan-400 text-sm font-medium mb-1">💡 Analogy</p>
                  <p className="text-slate-300 text-sm">{topic.analogy}</p>
                </div>
              )}

              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-emerald-400 text-sm font-medium mb-2">Key Points:</p>
                <ul className="space-y-1">
                  {topic.keyPoints.map((point, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-emerald-400">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {!isComplete && (
                <button
                  onClick={onComplete}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Mark as Complete
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'foundations',
    title: 'Module 1: Foundations',
    description: 'Understand what PremiumRadar is and why it exists',
    icon: '📚',
    estimatedTime: '30 min',
    difficulty: 'beginner',
    topics: [
      {
        id: 'what-is-pr',
        title: 'What is PremiumRadar?',
        content: 'PremiumRadar is a Sales Intelligence Operating System, not a CRM. It helps salespeople find, prioritize, and engage with the right prospects at the right time using AI-powered intelligence.',
        analogy: 'Think of it like Waze for salespeople. Waze doesn\'t just show you roads - it tells you WHICH road to take and WHEN based on real-time traffic. PremiumRadar tells salespeople WHICH prospect to contact and WHEN based on real-time signals.',
        keyPoints: [
          'NOT a CRM - it\'s an intelligence layer that sits on top',
          'Powered by SIVA (Sales Intelligence Virtual Assistant)',
          'Focuses on sales triggers (signals), not generic company data',
          'Currently Banking-only, designed for multi-vertical expansion',
        ],
      },
      {
        id: 'siva-explained',
        title: 'What is SIVA?',
        content: 'SIVA (Sales Intelligence Virtual Assistant) is the AI brain of PremiumRadar. It\'s not just a chatbot - it\'s the entire workflow. Users don\'t click through menus; they converse with SIVA.',
        analogy: 'SIVA is like Jarvis from Iron Man. Tony Stark doesn\'t hunt through menus - he tells Jarvis what he needs, and Jarvis orchestrates everything. SIVA does the same for salespeople.',
        keyPoints: [
          'SIVA = The primary interface (not a feature)',
          'Pageless experience - no traditional navigation',
          '12 atomic tools for scoring, ranking, outreach',
          'Context-aware based on vertical/sub-vertical/region',
        ],
      },
      {
        id: 'vertical-model',
        title: 'The Vertical Model',
        content: 'Vertical defines the salesperson\'s complete professional context. It\'s NOT the industry they sell TO, it\'s the world they operate IN.',
        analogy: 'Think of verticals like different video games. A basketball game and a racing game both have players, but everything else is different - the rules, the controls, the objectives. Banking and Insurance are different "games" for salespeople.',
        keyPoints: [
          'Vertical = Salesperson\'s world (Banking, Insurance, etc.)',
          'Sub-Vertical = Specific role (Employee Banking, Corporate)',
          'Region = Operating territory (UAE, India, etc.)',
          'Entity Target = What they sell to (Companies, Individuals)',
        ],
      },
    ],
  },
  {
    id: 'architecture',
    title: 'Module 2: Architecture',
    description: 'How the system works under the hood',
    icon: '🏗️',
    estimatedTime: '45 min',
    difficulty: 'intermediate',
    topics: [
      {
        id: 'siva-kernel',
        title: 'SIVA OS Kernel',
        content: 'The SIVA Kernel is the reasoning engine that processes every user request. It has 6 sub-systems: Context Engine, Persona Engine, Evidence Engine, Tools Engine, Safety & Guardrails, and Execution Layer.',
        analogy: 'Like a car engine with multiple systems (fuel, ignition, cooling), the SIVA Kernel has multiple engines working together. Each has a specific job, and they all coordinate to produce the final output.',
        keyPoints: [
          'Context Engine: Provides situational awareness',
          'Persona Engine: Loads role-specific behavior',
          'Evidence Engine: Ensures no hallucinations',
          'Tools Engine: 12 atomic execution tools',
          'Safety Layer: Compliance and guardrails',
        ],
      },
      {
        id: 'sce-explained',
        title: 'SalesContext Engine (SCE)',
        content: 'The SCE is the "spinal cord" of PremiumRadar. Every decision flows through it. It resolves vertical → sub-vertical → region → entity target and produces the Context Object that drives all SIVA behavior.',
        analogy: 'SCE is like a GPS system. Before giving directions, GPS needs to know: Where are you? Where are you going? What type of vehicle? SCE does the same: What vertical? What sub-vertical? What region? Then it routes everything correctly.',
        keyPoints: [
          'Canonical input for all SIVA reasoning',
          'Validates signals, tools, personas per context',
          'Produces Context Object for every request',
          'Nothing bypasses SCE - it\'s mandatory',
        ],
      },
      {
        id: 'intelligence-packs',
        title: 'Intelligence Packs',
        content: 'Packs are self-evolving knowledge capsules. Vertical Pack + Sub-Vertical Pack + Region Pack merge to create the Final Pack that controls SIVA\'s behavior.',
        analogy: 'Think of Packs like layers in Photoshop. The base layer (Vertical) provides the foundation. The middle layer (Sub-Vertical) adds specific details. The top layer (Region) makes final adjustments. Together they create the complete image.',
        keyPoints: [
          'Three layers: Vertical, Sub-Vertical, Region',
          'Region overrides Sub-Vertical overrides Vertical',
          'Contains: signals, scoring, personas, journeys',
          'Self-healing: detects drift and proposes fixes',
        ],
      },
    ],
  },
  {
    id: 'tools',
    title: 'Module 3: SIVA Tools',
    description: 'The 12 atomic tools that power SIVA',
    icon: '🔧',
    estimatedTime: '60 min',
    difficulty: 'intermediate',
    topics: [
      {
        id: 'tool-categories',
        title: 'Tool Categories',
        content: 'SIVA has 12 tools in 3 categories: Foundation (4), Strict (4), and Delegated (4). Foundation tools are deterministic, Strict tools have rigid schemas, Delegated tools use LLMs.',
        analogy: 'Like a chef\'s toolkit: Foundation tools are measuring cups (exact), Strict tools are recipes (must follow precisely), Delegated tools are "season to taste" (judgment required).',
        keyPoints: [
          'Foundation: CompanyQuality, ContactTier, TimingScore, EdgeCases',
          'Strict: BankingProduct, OutreachChannel, OpeningContext, CompositeScore',
          'Delegated: OutreachMessage, FollowUp, Objection, RelationshipTracker',
          'All tools have strict input/output schemas',
        ],
      },
      {
        id: 'qtle-scoring',
        title: 'QTLE Scoring Model',
        content: 'QTLE = Quality + Timing + Lifecycle + Engagement. Four scores combine into a Composite Score that determines prospect priority.',
        analogy: 'Like a restaurant rating: Food quality (Q), How busy right now (T), How long you\'ve been a customer (L), Your recent visits (E). All factors matter for deciding who gets the best table.',
        keyPoints: [
          'Q-Score: Company fit based on signals (0-100)',
          'T-Score: Timing multiplier based on calendar/signals (0-2x)',
          'L-Score: Where in the sales lifecycle (0-100)',
          'E-Score: Past engagement history (0-100)',
          'Composite = Q × T_multiplier × weighted(L, E)',
        ],
      },
    ],
  },
  {
    id: 'frontend',
    title: 'Module 4: Frontend Architecture',
    description: 'How the SaaS application is built',
    icon: '🖥️',
    estimatedTime: '45 min',
    difficulty: 'intermediate',
    topics: [
      {
        id: 'tech-stack',
        title: 'Technology Stack',
        content: 'Next.js 14 with App Router, React 18, TypeScript, Tailwind CSS, Framer Motion for animations, Zustand for state management.',
        analogy: 'Like building a house: Next.js is the foundation, React is the walls, TypeScript is the blueprint, Tailwind is the paint, Framer Motion is the moving doors, Zustand is the electrical wiring connecting rooms.',
        keyPoints: [
          'Next.js 14: Server components, App Router',
          'Zustand: 11 stores for state management',
          'Tailwind: Utility-first CSS',
          'Framer Motion: Smooth animations',
        ],
      },
      {
        id: 'pageless-ui',
        title: 'Pageless Workspace',
        content: 'The main workspace (dashboard/siva) has NO traditional navigation. SIVA surfaces what\'s needed when needed. This is the "SIVA is the UI" philosophy.',
        analogy: 'Traditional apps are like libraries - you walk to shelves to find books. Pageless is like a personal librarian who brings you exactly what you need based on your request.',
        keyPoints: [
          'PagelessShell wraps the SIVA surface',
          'No menus, no navigation trees',
          'Surfaces appear based on context',
          'Legacy pages exist for deep links only',
        ],
      },
    ],
  },
  {
    id: 'backend',
    title: 'Module 5: Backend Architecture',
    description: 'UPR OS and the API layer',
    icon: '⚙️',
    estimatedTime: '45 min',
    difficulty: 'advanced',
    topics: [
      {
        id: 'upr-os',
        title: 'UPR OS Overview',
        content: 'UPR OS is the backend operating system. It handles all intelligence operations: discovery, enrichment, scoring, ranking, outreach generation. Runs on Cloud Run.',
        analogy: 'UPR OS is like the kitchen in a restaurant. The frontend (SaaS) is the dining room where customers interact. The kitchen (OS) does all the actual cooking and preparation.',
        keyPoints: [
          'Node.js + Express backend',
          'PostgreSQL (130+ tables)',
          'Neo4j for knowledge graph',
          'LLM Router for multi-model AI',
          'Deployed on Google Cloud Run',
        ],
      },
      {
        id: 'api-routes',
        title: 'API Routes',
        content: 'Core routes: /api/os/discovery, /api/os/enrich, /api/os/score, /api/os/rank, /api/os/outreach. SIVA tools at /api/agent-core/v1/tools/:toolName.',
        keyPoints: [
          'Discovery: Find companies with signals',
          'Enrich: Get detailed company/contact data',
          'Score: Calculate QTLE scores',
          'Rank: Order by priority profile',
          'Outreach: Generate messages',
        ],
      },
    ],
  },
  {
    id: 'signals',
    title: 'Module 6: Sales Signals',
    description: 'Understanding what signals are and how they drive SIVA',
    icon: '📡',
    estimatedTime: '45 min',
    difficulty: 'intermediate',
    topics: [
      {
        id: 'what-are-signals',
        title: 'What Are Sales Signals?',
        content: 'Signals are company events that indicate a potential sales opportunity. They are NOT life events, not industry news, not generic data. Every signal must answer: "Does this suggest the company might need banking services?"',
        analogy: 'Signals are like smoke detectors. A smoke detector doesn\'t tell you everything about a house - it tells you ONE thing: there might be fire. Similarly, a "hiring-expansion" signal tells you ONE thing: this company might need payroll banking.',
        keyPoints: [
          'Signal = Company event that indicates sales opportunity',
          'NOT life events (marriage, birth, retirement)',
          'NOT family events or individual relocations',
          'Must directly correlate to buying intent',
          'Each vertical has different relevant signals',
        ],
      },
      {
        id: 'banking-signals',
        title: 'Banking-Specific Signals',
        content: 'For Banking vertical (especially Employee Banking), signals focus on company growth and change events that indicate banking needs.',
        keyPoints: [
          'hiring-expansion: Hiring 10+ employees = needs payroll accounts',
          'headcount-jump: Rapid growth = scaling banking needs',
          'office-opening: New location = new corporate accounts',
          'market-entry: Entering UAE = needs local bank',
          'funding-round: Raised capital = treasury needs',
          'project-award: New project = working capital needs',
          'subsidiary-creation: New entity = multi-entity banking',
        ],
      },
      {
        id: 'signal-freshness',
        title: 'Signal Freshness & Decay',
        content: 'Signals lose relevance over time. A company that was hiring 6 months ago may have already selected a banking partner. SIVA applies decay functions to older signals.',
        analogy: 'Like fresh bread. A hiring signal from yesterday is "fresh" - act now. A hiring signal from 6 months ago is "stale" - the opportunity may have passed.',
        keyPoints: [
          'Fresh: 0-14 days = Full signal weight',
          'Recent: 15-30 days = 80% weight',
          'Aging: 31-60 days = 50% weight',
          'Stale: 60+ days = 20% weight or ignored',
          'SIVA applies timing multipliers automatically',
        ],
      },
    ],
  },
  {
    id: 'personas',
    title: 'Module 7: Personas & Packs',
    description: 'How SIVA behavior is configured per sub-vertical',
    icon: '🎭',
    estimatedTime: '60 min',
    difficulty: 'advanced',
    topics: [
      {
        id: 'persona-concept',
        title: 'What is a Persona?',
        content: 'A persona is NOT a prompt template. It\'s a complete behavioral ruleset that controls how SIVA thinks, speaks, and acts for a specific sub-vertical. Each sub-vertical has its own persona.',
        analogy: 'Think of a persona like a character in a role-playing game. The character has stats (scoring weights), abilities (tools), personality (tone), and rules (what they can/cannot do). Changing the character changes everything about how they interact.',
        keyPoints: [
          'Persona = Complete behavioral configuration',
          'Stored per sub-vertical (NOT per vertical)',
          'Controls: tone, vocabulary, boundaries, compliance',
          'Includes: edge cases, timing rules, contact priority',
          'EB persona ≠ Corporate Banking persona',
        ],
      },
      {
        id: 'pack-hierarchy',
        title: 'Intelligence Pack Hierarchy',
        content: 'Intelligence Packs are knowledge capsules that merge hierarchically. Vertical Pack (base) + Sub-Vertical Pack (specific) + Region Pack (local) = Final Pack.',
        analogy: 'Like CSS cascading. Global styles (Vertical) can be overridden by component styles (Sub-Vertical), which can be overridden by inline styles (Region). The most specific rule wins.',
        keyPoints: [
          'Vertical Pack: Entity target, signal types, base scoring',
          'Sub-Vertical Pack: Persona, decision chains, edge cases',
          'Region Pack: Tone, compliance, timing (e.g., Ramadan)',
          'Merge order: VP → SVP → RP (RP highest priority)',
          'No Hardcode Doctrine: All configurable via Super Admin',
        ],
      },
      {
        id: 'persona-components',
        title: 'Persona Components',
        content: 'A complete persona includes: identity, mission, edge cases, timing rules, contact priority, outreach doctrine, anti-patterns, scoring weights, and action thresholds.',
        keyPoints: [
          'Identity: "You are an Employee Banking specialist..."',
          'Mission: "Help users win payroll accounts..."',
          'Edge Cases: Boost for MNCs, block for government',
          'Timing Rules: Avoid Ramadan, prioritize Q1',
          'Contact Priority: HR Director > Payroll Manager > CFO',
          'Outreach Doctrine: Never cold-call, always reference signal',
          'Anti-Patterns: Never discuss credit, never promise rates',
        ],
      },
    ],
  },
  {
    id: 'multi-agent',
    title: 'Module 8: Multi-Agent AI System',
    description: 'The 11 AI departments that supervise SIVA',
    icon: '🤖',
    estimatedTime: '45 min',
    difficulty: 'advanced',
    topics: [
      {
        id: 'why-multi-agent',
        title: 'Why Multi-Agent?',
        content: 'A single AI can\'t do everything well. By splitting responsibilities into specialized "departments," we get better oversight, faster iteration, and clearer accountability. Think of it as building a virtual 300-person company.',
        analogy: 'Like a hospital. You wouldn\'t want one doctor doing surgery, prescriptions, and billing. Specialists (surgeons, pharmacists, administrators) work together. Similarly, CTO AI handles tech, CFO AI handles costs, QA AI catches errors.',
        keyPoints: [
          'Each department has ONE clear responsibility',
          'Departments can be upgraded independently',
          'Clear audit trail: which AI made which decision',
          'Disagreements escalate to Founder AI (you)',
          'Phase 1: Simplified supervision. Phase 2: Full orchestration',
        ],
      },
      {
        id: 'ai-departments',
        title: 'The 11 AI Departments',
        content: 'Founder AI (vision), CTO AI (tech), CFO AI (costs), CISO AI (security), CPO AI (product), QA AI (quality), Data Science AI (models), Research AI (intelligence), Analyst AI (insights), Marketing AI (GTM), CS AI (support).',
        keyPoints: [
          'Founder AI: Protects 12 Laws, breaks ties',
          'CTO AI: Performance, architecture, scalability',
          'CFO AI: API costs, model routing, budgets',
          'CISO AI: Prompt injection, data leakage, RBAC',
          'CPO AI: Feature prioritization, UX friction',
          'QA AI: Pack testing, hallucination detection',
          'Data Science AI: Scoring drift, conversion patterns',
          'Research AI: New signals, persona improvements',
          'Analyst AI: Bottlenecks, churn prediction',
          'Marketing AI: Demo scripts, landing pages',
          'CS AI: User guidance, friction detection',
        ],
      },
    ],
  },
  {
    id: 'tenancy',
    title: 'Module 9: Multi-Tenancy',
    description: 'How data isolation and customization work',
    icon: '🏢',
    estimatedTime: '30 min',
    difficulty: 'intermediate',
    topics: [
      {
        id: 'tenant-isolation',
        title: 'Tenant Data Isolation',
        content: 'Every tenant\'s data is completely isolated. ADCB cannot see Emirates NBD\'s leads. Individual users cannot see tenant data. Isolation is enforced at database query level.',
        analogy: 'Like apartment buildings. Each tenant has their own locked unit. The building owner (Super Admin) has master keys, but tenants only access their own space.',
        keyPoints: [
          'Row-level security in PostgreSQL',
          'tenant_id filter on every query',
          'Individual users are "tenants of one"',
          'Cross-tenant queries only for Super Admin',
          'Audit logs track all data access',
        ],
      },
      {
        id: 'tenant-customization',
        title: 'Tenant Customization',
        content: 'Tenants can customize SIVA within bounds. They can adjust persona tone, set regional preferences, configure outreach campaigns, but cannot create new verticals or modify scoring algorithms.',
        keyPoints: [
          'Tenant Admin can: Adjust tone, create territories, configure campaigns',
          'Tenant Admin cannot: Create verticals, modify scoring formulas, access other tenants',
          'Customizations stored as tenant-level overrides',
          'Super Admin can override any tenant setting',
        ],
      },
    ],
  },
  {
    id: 'business-model',
    title: 'Module 10: Business Model & GTM',
    description: 'How PremiumRadar makes money',
    icon: '💰',
    estimatedTime: '30 min',
    difficulty: 'beginner',
    topics: [
      {
        id: 'pricing-tiers',
        title: 'Pricing Tiers',
        content: 'Three tiers: Individual (pay-as-you-go), Team (per-seat subscription), Enterprise (custom). All tiers get SIVA - the difference is limits, customization, and support.',
        keyPoints: [
          'Individual: $49/month, limited API calls, no team features',
          'Team: $199/seat/month, higher limits, team analytics',
          'Enterprise: Custom, unlimited, dedicated support, SSO',
          'Usage-based component: Extra API calls billed separately',
        ],
      },
      {
        id: 'gtm-strategy',
        title: 'Go-to-Market Strategy',
        content: 'Phase 1: Banking EB UAE. Prove product-market fit with one vertical, one region. Phase 2: Expand to Corporate/SME Banking. Phase 3: Add Insurance, Real Estate. Phase 4: Global expansion.',
        analogy: 'Like Uber starting in San Francisco. Perfect one city, then expand. We perfect one vertical (Banking EB), one region (UAE), then scale.',
        keyPoints: [
          'Phase 1: 10 paying customers in Banking EB UAE',
          'Validation: >80% weekly active usage, >$50K ARR',
          'Expansion trigger: PMF confirmed + sales playbook',
          'Never add vertical until previous is profitable',
        ],
      },
    ],
  },
];

// ============================================================================
// QUIZ SECTION
// ============================================================================

function QuizSection({
  currentQuiz,
  setCurrentQuiz,
  saveQuizScore,
  quizScores,
}: {
  currentQuiz: string | null;
  setCurrentQuiz: (id: string | null) => void;
  saveQuizScore: (id: string, score: number) => void;
  quizScores: Record<string, number>;
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const quiz = currentQuiz ? QUIZZES.find(q => q.id === currentQuiz) : null;

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
      if (quiz) {
        const score = newAnswers.reduce((acc, ans, idx) => {
          return acc + (ans === quiz.questions[idx].correctAnswer ? 1 : 0);
        }, 0);
        saveQuizScore(quiz.id, Math.round((score / quiz.questions.length) * 100));
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
    setCurrentQuiz(null);
  };

  if (!currentQuiz) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Knowledge Assessment</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Test your understanding of PremiumRadar concepts.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {QUIZZES.map((quiz) => (
            <div key={quiz.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">{quiz.title}</h3>
                {quizScores[quiz.id] !== undefined && (
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    quizScores[quiz.id] >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                    quizScores[quiz.id] >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {quizScores[quiz.id]}%
                  </span>
                )}
              </div>
              <p className="text-slate-400 mb-4">{quiz.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{quiz.questions.length} questions</span>
                <button
                  onClick={() => setCurrentQuiz(quiz.id)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {quizScores[quiz.id] !== undefined ? 'Retake' : 'Start'} Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (showResults && quiz) {
    const score = answers.reduce((acc, ans, idx) => {
      return acc + (ans === quiz.questions[idx].correctAnswer ? 1 : 0);
    }, 0);
    const percentage = Math.round((score / quiz.questions.length) * 100);

    return (
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
          <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl ${
            percentage >= 80 ? 'bg-emerald-500' :
            percentage >= 60 ? 'bg-yellow-500' :
            'bg-red-500'
          }`}>
            {percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '📚'}
          </div>
          <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-xl text-slate-300 mb-6">
            You scored <span className={`font-bold ${
              percentage >= 80 ? 'text-emerald-400' :
              percentage >= 60 ? 'text-yellow-400' :
              'text-red-400'
            }`}>{score}/{quiz.questions.length}</span> ({percentage}%)
          </p>

          {/* Review answers */}
          <div className="text-left space-y-4 mb-8">
            {quiz.questions.map((q, idx) => (
              <div key={q.id} className={`p-4 rounded-xl ${
                answers[idx] === q.correctAnswer
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <p className="font-medium mb-2">{q.question}</p>
                <p className="text-sm text-slate-400">
                  Your answer: <span className={answers[idx] === q.correctAnswer ? 'text-emerald-400' : 'text-red-400'}>
                    {q.options[answers[idx]]}
                  </span>
                </p>
                {answers[idx] !== q.correctAnswer && (
                  <p className="text-sm text-emerald-400">Correct: {q.options[q.correctAnswer]}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">{q.explanation}</p>
              </div>
            ))}
          </div>

          <button
            onClick={resetQuiz}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const question = quiz.questions[currentQuestion];

  return (
    <div className="max-w-3xl mx-auto px-6">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-slate-400">Question {currentQuestion + 1} of {quiz.questions.length}</span>
          <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">{question.question}</h2>

        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className="w-full text-left p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/50 transition-all"
            >
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-slate-700 mr-3 text-sm font-bold">
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const QUIZZES = [
  {
    id: 'foundations',
    title: 'Foundations Quiz',
    description: 'Test your understanding of PremiumRadar basics',
    questions: [
      {
        id: 'f1',
        question: 'What does "Vertical" mean in PremiumRadar?',
        options: [
          'The industry the target company belongs to',
          'The salesperson\'s professional context and world',
          'A type of signal',
          'A database column',
        ],
        correctAnswer: 1,
        explanation: 'Vertical = the salesperson\'s world, NOT the industry they sell to.',
      },
      {
        id: 'f2',
        question: 'What is SIVA?',
        options: [
          'A chatbot feature',
          'The database engine',
          'The AI operating system kernel - the primary interface',
          'A deployment tool',
        ],
        correctAnswer: 2,
        explanation: 'SIVA is the core AI that IS the interface. Users interact with SIVA, not menus.',
      },
      {
        id: 'f3',
        question: 'What entity type does Banking Employee Banking target?',
        options: [
          'Individuals',
          'Families',
          'Companies',
          'Candidates',
        ],
        correctAnswer: 2,
        explanation: 'Banking EB targets Companies for payroll accounts, not individuals.',
      },
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture Quiz',
    description: 'Test your knowledge of system architecture',
    questions: [
      {
        id: 'a1',
        question: 'What is the SalesContext Engine (SCE)?',
        options: [
          'A database table',
          'The spinal cord that resolves vertical/sub-vertical/region context',
          'A frontend component',
          'An API endpoint',
        ],
        correctAnswer: 1,
        explanation: 'SCE is the canonical input system - every decision flows through it.',
      },
      {
        id: 'a2',
        question: 'How do Intelligence Packs merge?',
        options: [
          'Vertical overwrites everything',
          'Region Pack + Sub-Vertical Pack + Vertical Pack (Region highest priority)',
          'They don\'t merge',
          'Random selection',
        ],
        correctAnswer: 1,
        explanation: 'Region > Sub-Vertical > Vertical. Region adjustments have highest priority.',
      },
      {
        id: 'a3',
        question: 'How many SIVA tools exist?',
        options: ['5', '12', '20', '100'],
        correctAnswer: 1,
        explanation: '12 atomic tools: 4 Foundation, 4 Strict, 4 Delegated.',
      },
    ],
  },
  {
    id: 'technical',
    title: 'Technical Deep Dive',
    description: 'Advanced technical concepts',
    questions: [
      {
        id: 't1',
        question: 'What does QTLE stand for?',
        options: [
          'Query, Transform, Load, Execute',
          'Quality, Timing, Lifecycle, Engagement',
          'Quick Technical Learning Environment',
          'Quantified Total Lead Evaluation',
        ],
        correctAnswer: 1,
        explanation: 'QTLE = Quality + Timing + Lifecycle + Engagement - the four scoring dimensions.',
      },
      {
        id: 't2',
        question: 'What is the "No Hardcode Doctrine"?',
        options: [
          'Write no code ever',
          'All business logic must be configurable through Super Admin UI',
          'Use only soft-coded variables',
          'A coding style guide',
        ],
        correctAnswer: 1,
        explanation: 'Everything configurable via UI. Zero hardcoded vertical/signal/persona logic.',
      },
      {
        id: 't3',
        question: 'What does "Pageless OS" mean?',
        options: [
          'No HTML pages',
          'The workspace has no traditional navigation - SIVA surfaces what\'s needed',
          'Single page application',
          'No pagination',
        ],
        correctAnswer: 1,
        explanation: 'Pageless = SIVA brings actions to users. No menu hunting.',
      },
    ],
  },
  {
    id: 'signals',
    title: 'Signals & Scoring Quiz',
    description: 'Test your knowledge of sales signals and QTLE scoring',
    questions: [
      {
        id: 's1',
        question: 'What is a "signal" in PremiumRadar?',
        options: [
          'A notification to the user',
          'A company event that indicates a sales opportunity',
          'A life event like marriage or birth',
          'An industry news article',
        ],
        correctAnswer: 1,
        explanation: 'Signals are company events (hiring, funding, office opening) that suggest buying intent.',
      },
      {
        id: 's2',
        question: 'What happens to a hiring signal after 60+ days?',
        options: [
          'It gets full weight',
          'It gets 80% weight',
          'It gets 50% weight',
          'It gets 20% weight or is ignored',
        ],
        correctAnswer: 3,
        explanation: 'Signals decay over time. After 60 days, the opportunity may have passed.',
      },
      {
        id: 's3',
        question: 'What does the Q-Score measure?',
        options: [
          'Query speed',
          'Company fit based on signals (0-100)',
          'Queue position',
          'Quality of contact data',
        ],
        correctAnswer: 1,
        explanation: 'Q-Score = Quality. How well does this company match the ideal customer profile?',
      },
      {
        id: 's4',
        question: 'What does the T-Score represent?',
        options: [
          'Technology stack',
          'Timing multiplier based on calendar/signals (0-2x)',
          'Team size',
          'Transaction volume',
        ],
        correctAnswer: 1,
        explanation: 'T-Score = Timing. Is NOW the right time to reach out? Can boost or reduce priority.',
      },
    ],
  },
  {
    id: 'users',
    title: 'User Types Quiz',
    description: 'Test your understanding of the 4 user types',
    questions: [
      {
        id: 'u1',
        question: 'What is an "Individual User" in PremiumRadar?',
        options: [
          'A free trial user',
          'A salesperson whose company has NOT enrolled as a tenant',
          'A user with no data',
          'A test account',
        ],
        correctAnswer: 1,
        explanation: 'Individual users work at companies (like ADCB) but sign up personally - their employer hasn\'t adopted PremiumRadar.',
      },
      {
        id: 'u2',
        question: 'What can a Tenant Admin do that a Tenant User cannot?',
        options: [
          'See their own leads',
          'Use SIVA',
          'Manage users and configure campaigns',
          'Generate outreach messages',
        ],
        correctAnswer: 2,
        explanation: 'Tenant Admins manage the team: add/remove users, configure campaigns, view team analytics.',
      },
      {
        id: 'u3',
        question: 'Who can create new verticals in PremiumRadar?',
        options: [
          'Any user',
          'Tenant Admin',
          'Individual User',
          'Only Super Admin (Founder)',
        ],
        correctAnswer: 3,
        explanation: 'Only Super Admin (you) can create verticals, sub-verticals, and global packs.',
      },
    ],
  },
  {
    id: 'personas',
    title: 'Personas & Multi-Agent Quiz',
    description: 'Test your knowledge of personas and the AI supervision system',
    questions: [
      {
        id: 'p1',
        question: 'Where are personas stored?',
        options: [
          'Per vertical',
          'Per sub-vertical',
          'Per region',
          'Per user',
        ],
        correctAnswer: 1,
        explanation: 'Personas are stored per sub-vertical. EB persona ≠ Corporate Banking persona.',
      },
      {
        id: 'p2',
        question: 'Which AI department handles API cost optimization?',
        options: [
          'CTO AI',
          'CISO AI',
          'CFO AI',
          'CPO AI',
        ],
        correctAnswer: 2,
        explanation: 'CFO AI monitors costs, manages model routing, and enforces budgets.',
      },
      {
        id: 'p3',
        question: 'What does Founder AI (your AI twin) do?',
        options: [
          'Write code',
          'Monitor security',
          'Protect the 12 Unbreakable Laws and break ties',
          'Generate marketing content',
        ],
        correctAnswer: 2,
        explanation: 'Founder AI is the guardian of the vision. It ensures all AI decisions align with the 12 Laws.',
      },
      {
        id: 'p4',
        question: 'What is the purpose of "edge cases" in a persona?',
        options: [
          'Handle browser compatibility',
          'Boost or block certain company types (MNCs, government, etc.)',
          'Fix UI bugs',
          'Manage database edges',
        ],
        correctAnswer: 1,
        explanation: 'Edge cases are rules like "boost MNC companies by 20%" or "block government entities".',
      },
    ],
  },
];

// ============================================================================
// PROGRESS SECTION
// ============================================================================

function ProgressSection({ progress }: { progress: ProgressData }) {
  const topicProgress = Math.round((progress.completedTopics.length / TOTAL_TOPICS) * 100);
  const quizCount = Object.keys(progress.quizScores).length;
  const avgQuizScore = quizCount > 0
    ? Math.round(Object.values(progress.quizScores).reduce((a, b) => a + b, 0) / quizCount)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Your Progress</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Track your learning journey through the Founder Bible.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-emerald-400 mb-2">{topicProgress}%</div>
          <div className="text-slate-400">Topics Complete</div>
          <div className="text-sm text-slate-500">{progress.completedTopics.length}/{TOTAL_TOPICS}</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-cyan-400 mb-2">{quizCount}/{QUIZZES.length}</div>
          <div className="text-slate-400">Quizzes Taken</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
          <div className={`text-4xl font-bold mb-2 ${
            avgQuizScore >= 80 ? 'text-emerald-400' :
            avgQuizScore >= 60 ? 'text-yellow-400' :
            'text-red-400'
          }`}>{avgQuizScore || '-'}%</div>
          <div className="text-slate-400">Avg Quiz Score</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center">
          <div className="text-4xl font-bold text-purple-400 mb-2">
            {progress.lastAccessed
              ? new Date(progress.lastAccessed).toLocaleDateString()
              : '-'
            }
          </div>
          <div className="text-slate-400">Last Active</div>
        </div>
      </div>

      {/* Module Progress */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Module Progress</h2>
        <div className="space-y-4">
          {LEARNING_MODULES.map((module) => {
            const completedCount = module.topics.filter(t => progress.completedTopics.includes(t.id)).length;
            const percentage = Math.round((completedCount / module.topics.length) * 100);

            return (
              <div key={module.id} className="flex items-center gap-4">
                <div className="w-48 text-sm font-medium">{module.title}</div>
                <div className="flex-1 h-4 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm text-slate-400">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiz Scores */}
      {quizCount > 0 && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6">Quiz Scores</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {QUIZZES.map((quiz) => (
              <div key={quiz.id} className={`p-4 rounded-xl border ${
                progress.quizScores[quiz.id] !== undefined
                  ? progress.quizScores[quiz.id] >= 80
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : progress.quizScores[quiz.id] >= 60
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                  : 'bg-slate-800/50 border-slate-700'
              }`}>
                <h3 className="font-medium mb-2">{quiz.title}</h3>
                {progress.quizScores[quiz.id] !== undefined ? (
                  <div className={`text-2xl font-bold ${
                    progress.quizScores[quiz.id] >= 80 ? 'text-emerald-400' :
                    progress.quizScores[quiz.id] >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {progress.quizScores[quiz.id]}%
                  </div>
                ) : (
                  <div className="text-slate-500">Not taken</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
