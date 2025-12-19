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
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  icon: string;
  category: 'foundation' | 'technical' | 'architecture' | 'intelligence' | 'operations' | 'business' | 'future';
  prerequisites?: string[];
};
type LearningTopic = {
  id: string;
  title: string;
  content: string;
  analogy?: string;
  keyPoints: string[];
  deepDive?: string;
  techRationale?: string;
  futureCompatibility?: string;
  codeExample?: string;
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

// Sprint Progress Types (from Notion API)
type SprintStatus = 'Backlog' | 'In Progress' | 'Done' | 'Blocked';
type SprintData = {
  id: string;
  sprintNumber: number;
  title: string;
  status: SprintStatus;
  repo: string;
  phase: number;
};
type PhaseProgress = {
  phase: number;
  name: string;
  targetARR: string;
  totalSprints: number;
  completedSprints: number;
  inProgressSprints: number;
  percentComplete: number;
  sprints: SprintData[];
};
type SprintProgressData = {
  totalSprints: number;
  completedSprints: number;
  inProgressSprints: number;
  overallPercent: number;
  phases: PhaseProgress[];
  currentPhase: number;
  currentSprint: SprintData | null;
  lastUpdated: string;
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

  // Sprint progress from Notion
  const [sprintProgress, setSprintProgress] = useState<SprintProgressData | null>(null);
  const [sprintProgressLoading, setSprintProgressLoading] = useState(true);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('founder-bible-progress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  // Fetch sprint progress from Notion
  useEffect(() => {
    async function fetchSprintProgress() {
      try {
        const response = await fetch('/api/notion/sprint-progress');
        const data = await response.json();
        if (data.success && data.data) {
          setSprintProgress(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch sprint progress:', error);
      } finally {
        setSprintProgressLoading(false);
      }
    }
    fetchSprintProgress();
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
            {activeSection === 'overview' && <OverviewSection sprintProgress={sprintProgress} loading={sprintProgressLoading} />}
            {activeSection === 'manifesto' && <ManifestoSection />}
            {activeSection === 'category' && <CategorySection />}
            {activeSection === 'philosophy' && <PhilosophySection />}
            {activeSection === 'architecture' && <ArchitectureSection />}
            {activeSection === 'prd' && <PRDSection />}
            {activeSection === 'scale' && <ScaleSection />}
            {activeSection === 'orchestration' && <OrchestrationSection />}
            {activeSection === 'roadmap' && <RoadmapSection sprintProgress={sprintProgress} loading={sprintProgressLoading} />}
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
// 20 comprehensive modules with 100+ topics covering every inch of the product
const TOTAL_TOPICS = 114; // Updated Dec 2025: Added 6 topics for Model Capability Routing (S228-S233)

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

function OverviewSection({
  sprintProgress,
  loading
}: {
  sprintProgress: SprintProgressData | null;
  loading: boolean;
}) {
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

      {/* Live Sprint Progress from Notion */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-bold">Project Progress</h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">LIVE from Notion</span>
          </div>
          {sprintProgress && (
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-400">{sprintProgress.overallPercent}%</p>
              <p className="text-xs text-slate-500">Overall Complete</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            <span className="ml-3 text-slate-400">Loading from Notion...</span>
          </div>
        ) : sprintProgress ? (
          <>
            {/* Overall Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">
                  {sprintProgress.completedSprints} of {sprintProgress.totalSprints} sprints complete
                </span>
                <span className="text-emerald-400">
                  {sprintProgress.inProgressSprints} in progress
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${sprintProgress.overallPercent}%` }}
                />
              </div>
            </div>

            {/* Phase Progress Cards */}
            <div className="grid grid-cols-5 gap-3">
              {sprintProgress.phases.map((phase) => (
                <div
                  key={phase.phase}
                  className={`rounded-xl p-4 ${
                    phase.phase === sprintProgress.currentPhase
                      ? 'bg-emerald-500/20 border border-emerald-500/50'
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${
                      phase.phase === sprintProgress.currentPhase ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      P{phase.phase}
                    </span>
                    <span className="text-xs text-slate-500">{phase.targetARR}</span>
                  </div>
                  <p className="text-sm font-medium text-white mb-2 truncate">{phase.name}</p>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full transition-all duration-500 ${
                        phase.phase === sprintProgress.currentPhase
                          ? 'bg-emerald-500'
                          : phase.percentComplete === 100
                            ? 'bg-cyan-500'
                            : 'bg-slate-500'
                      }`}
                      style={{ width: `${phase.percentComplete}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">{phase.completedSprints}/{phase.totalSprints}</span>
                    <span className={phase.phase === sprintProgress.currentPhase ? 'text-emerald-400' : 'text-slate-400'}>
                      {phase.percentComplete}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Sprint */}
            {sprintProgress.currentSprint && (
              <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      sprintProgress.currentSprint.status === 'In Progress'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {sprintProgress.currentSprint.status === 'In Progress' ? 'IN PROGRESS' : 'NEXT UP'}
                    </span>
                    <span className="text-white font-medium">{sprintProgress.currentSprint.title}</span>
                  </div>
                  <span className="text-xs text-slate-500">{sprintProgress.currentSprint.repo}</span>
                </div>
              </div>
            )}

            {/* Last Updated */}
            <p className="text-xs text-slate-600 mt-4 text-right">
              Last synced: {new Date(sprintProgress.lastUpdated).toLocaleString()}
            </p>
          </>
        ) : (
          <div className="text-center py-8 text-slate-500">
            Unable to load sprint progress. Check Notion connection.
          </div>
        )}
      </div>

      {/* Founder Vision Banner */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-8 mb-8 text-center">
        <p className="text-2xl font-bold text-white mb-2">&quot;SIVA will become the Siri of Sales.&quot;</p>
        <p className="text-slate-400">— Sivakumar, Founder</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          {
            label: 'Sprints Complete',
            value: sprintProgress ? sprintProgress.completedSprints.toString() : '—',
            icon: '✅',
            live: true
          },
          {
            label: 'Total Sprints',
            value: sprintProgress ? sprintProgress.totalSprints.toString() : '85',
            icon: '🔧',
            live: true
          },
          { label: 'SIVA Tools', value: '12', icon: '🤖', live: false },
          { label: 'Database Tables', value: '130+', icon: '🗄️', live: false },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center relative">
            {stat.live && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            )}
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
  const [activeArch, setActiveArch] = useState<'layers' | 'siva' | 'sce' | 'packs' | 'agents'>('layers');

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
          { id: 'layers', label: 'System Layers', icon: '🏛️' },
          { id: 'siva', label: 'SIVA Intelligence', icon: '🧠' },
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
          {activeArch === 'layers' && <SystemLayersDiagram />}
          {activeArch === 'siva' && <SIVAKernelDiagram />}
          {activeArch === 'sce' && <SCEDiagram />}
          {activeArch === 'packs' && <PacksDiagram />}
          {activeArch === 'agents' && <AgentsDiagram />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SystemLayersDiagram() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">PremiumRadar System Layers</h2>
      <p className="text-slate-400 mb-8">
        The definitive architecture showing how SaaS Frontend, UPR OS, and SIVA relate to each other.
        <span className="text-amber-400 ml-2">🔒 Locked Architecture - Dec 2025</span>
      </p>

      {/* Main Architecture Diagram */}
      <div className="bg-slate-950 rounded-xl p-6 font-mono text-xs overflow-x-auto mb-8">
        <pre className="text-emerald-400">{`
┌─────────────────────────────────────────────────────────────────────────────┐
│                     PREMIUMRADAR PRODUCT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │              SaaS Frontend (Next.js) - premiumradar-saas          │     │
│   │                                                                   │     │
│   │   • UI Components (Dashboard, Discovery UI, Super Admin)          │     │
│   │   • SIVA Chat = Just a text box (ZERO intelligence here)          │     │
│   │   • User Authentication                                           │     │
│   │   • Never calls SIVA directly, never calls OpenAI directly        │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                    │                                        │
│                                    │ API Calls (ONLY to UPR-OS)             │
│                                    ▼                                        │
│   ┌───────────────────────────────────────────────────────────────────┐     │
│   │              UPR-OS (Authority + Infrastructure) - upr-os         │     │
│   │                                                                   │     │
│   │   ┌─────────────────────────────────────────────────────────┐     │     │
│   │   │  OS-OWNED SERVICES (Mechanical, Expensive, Async)       │     │     │
│   │   │                                                         │     │     │
│   │   │  • Auth / Tenancy                                       │     │     │
│   │   │  • Config APIs (verticals, territories, providers)      │     │     │
│   │   │  • Discovery Pool + Crawler   ← NOT SIVA (OS owns)      │     │     │
│   │   │  • Enrichment Services        ← NOT SIVA (OS owns)      │     │     │
│   │   │  • Lead Assignment + Distribution                       │     │     │
│   │   │  • PostgreSQL (state, memory, signals)                  │     │     │
│   │   │  • External API Broker (SERP, Apollo, OpenAI keys)      │     │     │
│   │   └─────────────────────────────────────────────────────────┘     │     │
│   │                                │                                  │     │
│   │                                │ Governs & Provides Context       │     │
│   │                                ▼                                  │     │
│   │   ┌─────────────────────────────────────────────────────────┐     │     │
│   │   │     SIVA (Resident Intelligence Service)                │     │     │
│   │   │     Under UPR-OS Authority - Cannot run without OS      │     │     │
│   │   │                                                         │     │     │
│   │   │   • Persona Engine (rules defined by OS, executed here) │     │     │
│   │   │   • Decision Logic                                      │     │     │
│   │   │   • Reasoning Orchestration                             │     │     │
│   │   │   • Uses SIVA Tools (stateless, cheap, fast)            │     │     │
│   │   │                                                         │     │     │
│   │   │   ┌─────────────────────────────────────────────────┐   │     │     │
│   │   │   │  SIVA TOOLS (Stateless, Cheap, Fast, Reasoning) │   │     │     │
│   │   │   │                                                 │   │     │     │
│   │   │   │  ✅ Scoring (QTLE)      ✅ Ranking              │   │     │     │
│   │   │   │  ✅ Classification      ✅ Edge Cases           │   │     │     │
│   │   │   │  ✅ Outreach Drafting   ✅ Summarization        │   │     │     │
│   │   │   │  ✅ Next-Best-Action    ✅ Intent Detection     │   │     │     │
│   │   │   │                                                 │   │     │     │
│   │   │   │  ❌ Discovery (OS service, not tool)            │   │     │     │
│   │   │   │  ❌ Enrichment (OS service, not tool)           │   │     │     │
│   │   │   │  ❌ Database writes (OS owns persistence)       │   │     │     │
│   │   │   └─────────────────────────────────────────────────┘   │     │     │
│   │   └─────────────────────────────────────────────────────────┘     │     │
│   └───────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
        `}</pre>
      </div>

      {/* Key Principles */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6">
          <h3 className="text-emerald-400 font-bold mb-4">✅ Correct Understanding</h3>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>• <strong>SaaS Frontend</strong> = Face (UI only, zero intelligence)</li>
            <li>• <strong>UPR-OS</strong> = Body (infrastructure, authority)</li>
            <li>• <strong>SIVA</strong> = Brain (lives inside OS body)</li>
            <li>• Frontend → OS only (never direct to SIVA)</li>
            <li>• OS brokers ALL external APIs (keys, rate limits, costs)</li>
            <li>• Persona rules defined by OS, executed by SIVA</li>
          </ul>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
          <h3 className="text-red-400 font-bold mb-4">❌ Common Mistakes</h3>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>• Discovery is NOT a SIVA tool (it's OS service)</li>
            <li>• SIVA Chat is NOT SIVA (it's just a UI surface)</li>
            <li>• SIVA never holds API keys (OS brokers everything)</li>
            <li>• SIVA never owns databases (OS owns persistence)</li>
            <li>• SIVA is not standalone (needs OS context to run)</li>
            <li>• Enrichment is NOT a SIVA tool (it's OS service)</li>
          </ul>
        </div>
      </div>

      {/* SIVA Tool Criteria */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-6 mb-8">
        <h3 className="text-cyan-400 font-bold mb-4">🧪 SIVA Tool Gate Check</h3>
        <p className="text-slate-400 mb-4">Before adding anything as a SIVA tool, verify ALL criteria:</p>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">⚡</div>
            <div className="text-sm font-bold text-white">Stateless?</div>
            <div className="text-xs text-slate-400">No DB writes</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">💰</div>
            <div className="text-sm font-bold text-white">Cheap?</div>
            <div className="text-xs text-slate-400">Low API cost</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🚀</div>
            <div className="text-sm font-bold text-white">Fast?</div>
            <div className="text-xs text-slate-400">&lt;500ms P95</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl mb-1">🧠</div>
            <div className="text-sm font-bold text-white">Reasoning?</div>
            <div className="text-xs text-slate-400">Classification/Logic</div>
          </div>
        </div>
        <p className="text-amber-400 text-sm mt-4">
          ⚠️ If any answer is NO, it belongs in OS, not SIVA.
        </p>
      </div>

      {/* Ownership Table */}
      <div className="bg-slate-800/50 rounded-xl p-6">
        <h3 className="font-bold mb-4 text-white">📋 Service Ownership Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="py-2 px-4 text-slate-400">Service</th>
                <th className="py-2 px-4 text-slate-400">Owner</th>
                <th className="py-2 px-4 text-slate-400">Reason</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr className="border-b border-slate-800">
                <td className="py-2 px-4">Discovery Pool</td>
                <td className="py-2 px-4 text-blue-400">OS</td>
                <td className="py-2 px-4">Mechanical, expensive, async</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 px-4">Discovery Crawler</td>
                <td className="py-2 px-4 text-blue-400">OS</td>
                <td className="py-2 px-4">Background job, tenant-level</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 px-4">Enrichment</td>
                <td className="py-2 px-4 text-blue-400">OS</td>
                <td className="py-2 px-4">External API calls, caching</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 px-4">Lead Assignment</td>
                <td className="py-2 px-4 text-blue-400">OS</td>
                <td className="py-2 px-4">State management, collision prevention</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 px-4">Scoring (QTLE)</td>
                <td className="py-2 px-4 text-emerald-400">SIVA</td>
                <td className="py-2 px-4">Stateless, fast, reasoning</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 px-4">Edge Cases</td>
                <td className="py-2 px-4 text-emerald-400">SIVA</td>
                <td className="py-2 px-4">Classification logic</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-2 px-4">Outreach Drafting</td>
                <td className="py-2 px-4 text-emerald-400">SIVA</td>
                <td className="py-2 px-4">Reasoning, personalization</td>
              </tr>
              <tr>
                <td className="py-2 px-4">Next-Best-Action</td>
                <td className="py-2 px-4 text-emerald-400">SIVA</td>
                <td className="py-2 px-4">Decision logic</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SIVAKernelDiagram() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold mb-6">SIVA Intelligence Service</h2>

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
          { name: 'Tools Engine', desc: 'Stateless SIVA tools for scoring, ranking, outreach, classification (NOT discovery/enrichment)', color: 'orange' },
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

function RoadmapSection({
  sprintProgress,
  loading
}: {
  sprintProgress: SprintProgressData | null;
  loading: boolean;
}) {
  // Helper to get live progress for a phase
  const getPhaseProgress = (phaseNum: number) => {
    if (!sprintProgress) return null;
    return sprintProgress.phases.find(p => p.phase === phaseNum);
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Product Roadmap</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          85 sprints (S133-S217) across 5 phases to reach $1B+ platform.
        </p>
        {sprintProgress && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-400">
              Live from Notion — {sprintProgress.completedSprints}/{sprintProgress.totalSprints} complete ({sprintProgress.overallPercent}%)
            </span>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {ROADMAP_PHASES.map((phase, index) => {
          const livePhase = getPhaseProgress(index + 1);
          const isCurrentPhase = sprintProgress ? sprintProgress.currentPhase === index + 1 : phase.current;
          const isComplete = livePhase && livePhase.percentComplete === 100;

          return (
            <div key={phase.name} className="mb-8 relative">
              <div className={`bg-slate-900/50 border rounded-2xl p-8 ${
                isCurrentPhase ? 'border-emerald-500' : isComplete ? 'border-cyan-500' : 'border-slate-800'
              }`}>
                {isCurrentPhase && (
                  <span className="absolute -top-3 left-8 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full">
                    CURRENT PHASE
                  </span>
                )}
                {isComplete && !isCurrentPhase && (
                  <span className="absolute -top-3 left-8 bg-cyan-500 text-white text-xs px-3 py-1 rounded-full">
                    COMPLETE
                  </span>
                )}
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${
                    isCurrentPhase
                      ? 'bg-emerald-500 text-white'
                      : isComplete
                        ? 'bg-cyan-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isComplete ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h2 className="text-2xl font-bold">{phase.name}</h2>
                      <span className="text-sm text-slate-500">({phase.sprints})</span>
                    </div>
                    <p className="text-slate-400 mb-4">{phase.goal}</p>

                    {/* Live Progress Bar */}
                    {livePhase && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">
                            {livePhase.completedSprints}/{livePhase.totalSprints} sprints
                          </span>
                          <span className={isCurrentPhase ? 'text-emerald-400' : 'text-slate-400'}>
                            {livePhase.percentComplete}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isCurrentPhase
                                ? 'bg-emerald-500'
                                : isComplete
                                  ? 'bg-cyan-500'
                                  : 'bg-slate-600'
                            }`}
                            style={{ width: `${livePhase.percentComplete}%` }}
                          />
                        </div>
                      </div>
                    )}

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
                    {livePhase && livePhase.inProgressSprints > 0 && (
                      <p className="text-xs text-yellow-400 mt-2">
                        {livePhase.inProgressSprints} in progress
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Last sync info */}
      {sprintProgress && (
        <p className="text-xs text-slate-600 text-center mt-8">
          Last synced: {new Date(sprintProgress.lastUpdated).toLocaleString()}
        </p>
      )}
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
// LEARN SECTION - COMPREHENSIVE KNOWLEDGE SYSTEM
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [aiAgentOpen, setAiAgentOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All Modules', icon: '📚' },
    { id: 'foundation', label: 'Foundation', icon: '🏛️' },
    { id: 'technical', label: 'Technical', icon: '⚙️' },
    { id: 'architecture', label: 'Architecture', icon: '🏗️' },
    { id: 'intelligence', label: 'AI Intelligence', icon: '🧠' },
    { id: 'operations', label: 'Operations', icon: '🔧' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'future', label: '2030 Vision', icon: '🚀' },
  ];

  const filteredModules = LEARNING_MODULES.filter(m => {
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.topics.some(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalCompleted = LEARNING_MODULES.reduce((acc, m) =>
    acc + m.topics.filter(t => completedTopics.includes(t.id)).length, 0
  );

  const handleAiQuery = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse(null);

    try {
      // Build context from learning modules for the AI
      const moduleContext = LEARNING_MODULES.map(m =>
        `Module: ${m.title}\nTopics: ${m.topics.map(t => t.title).join(', ')}`
      ).join('\n\n');

      const response = await fetch('/api/ai/learn-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: aiQuery,
          context: moduleContext,
        }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const data = await response.json();
      setAiResponse(data.response);
    } catch (error) {
      // Fallback to intelligent local response based on query keywords
      const query = aiQuery.toLowerCase();
      let response = '';

      if (query.includes('rag') || query.includes('retrieval')) {
        response = `**RAG (Retrieval-Augmented Generation) in SIVA OS**

RAG is NOT currently used in this project. Here's why and what we use instead:

**What RAG Is:**
RAG combines a retrieval system (like vector search) with an LLM to ground responses in specific documents.

**Why SIVA Doesn't Use Traditional RAG:**
SIVA uses a more structured approach called "Intelligence Packs" + "Evidence Engine":

1. **Intelligence Packs** - Pre-configured knowledge capsules per vertical/sub-vertical/region that are loaded at query time. More deterministic than RAG.

2. **Evidence Engine** - Every SIVA response must cite its source. Instead of retrieving from a vector DB, we retrieve from structured PostgreSQL + Neo4j.

3. **SalesContext Engine (SCE)** - Provides canonical context without embedding search.

**Where RAG-like Patterns Exist:**
- Knowledge Graph queries (Neo4j) for relationship discovery
- Signal detection from news/social sources
- Contact enrichment from multiple data providers

**Recommended Modules:**
- Module 5: SIVA OS Kernel (Evidence Engine section)
- Module 9: Personas & Intelligence Packs`;
      } else if (query.includes('tool') || query.includes('12 tools') || query.includes('siva tools')) {
        response = `**The 12 SIVA Tools**

SIVA has 12 atomic tools organized in 3 layers:

**Foundation Layer (Deterministic, No LLM):**
1. CompanyQualityTool - Evaluate company fit (0-100)
2. ContactTierTool - Select optimal contact tier
3. TimingScoreTool - Calculate timing multiplier (0-2x)
4. EdgeCasesTool - Check for blockers/warnings

**Strict Layer (Schema-bound):**
5. BankingProductMatch - Match company to banking products
6. OutreachChannel - Select best outreach channel
7. OpeningContextTool - Generate conversation context
8. CompositeScoreTool - Calculate QTLE composite score

**Delegated Layer (LLM-enhanced):**
9. OutreachMessageGen - Generate personalized messages
10. FollowUpStrategy - Plan follow-up sequences
11. ObjectionHandler - Handle sales objections
12. RelationshipTracker - Track relationship progress

**Key Architecture Points:**
- All tools receive SalesContext as input
- Foundation tools: P50 ≤200ms latency
- Delegated tools: P50 ≤1000ms latency
- All tools have strict input/output schemas

**Recommended Module:** Module 6: The 12 SIVA Tools`;
      } else if (query.includes('next') || query.includes('react') || query.includes('frontend') || query.includes('tech stack')) {
        response = `**Frontend Technology Stack**

**Why Next.js 14?**
- Server Components reduce client JS bundle by 40%
- App Router enables better code organization
- Built-in image optimization & middleware
- Vercel deployment is seamless

**State Management: Zustand (Not Redux)**
- 11 specialized stores (auth, siva, signals, companies, etc.)
- No boilerplate, TypeScript-first
- Built-in persistence to localStorage
- Better performance than React Context

**Styling: Tailwind CSS**
- Utility-first, no context switching
- PurgeCSS removes unused (tiny bundle)
- Built-in responsive utilities

**Animations: Framer Motion**
- Declarative: animate={{ x: 100 }}
- AnimatePresence for mount/unmount
- Layout animations built-in

**Why NOT Other Options:**
- Redux: Too much boilerplate
- Remix: Smaller ecosystem
- Styled Components: Runtime CSS-in-JS overhead

**Recommended Module:** Module 7: Frontend Technology Stack`;
      } else if (query.includes('learn') || query.includes('start') || query.includes('begin') || query.includes('today')) {
        response = `**Recommended Learning Path**

Based on the modules available, here's your optimal learning journey:

**If You're New (Start Here):**
1. Module 1: SIVA OS Foundations - Understand the fundamental truth
2. Module 2: The Vertical Model - How SIVA adapts to roles
3. Module 3: User Types & Access - Individual vs Tenant vs Super Admin

**For Technical Deep Dive:**
4. Module 5: SIVA OS Kernel - The reasoning engine
5. Module 6: The 12 SIVA Tools - Atomic capabilities
6. Module 7: Frontend Tech Stack - Next.js, Zustand, Tailwind
7. Module 8: Backend Architecture - UPR OS, APIs, LLM Router

**For Intelligence Understanding:**
8. Module 4: Sales Signals Deep Dive
9. Module 9: Personas & Intelligence Packs
10. Module 10: Multi-Agent AI Orchestration

**For Business Context:**
11. Module 12: Business Model & GTM
12. Module 16: 5-Phase Roadmap to $100M

**For Future Vision:**
13. Module 13: SLM Deep Dive
14. Module 14: Scale Architecture

**Pro Tip:** Complete topics in order and mark them done to track your mastery percentage!`;
      } else if (query.includes('slm') || query.includes('small language') || query.includes('model')) {
        response = `**SLM (Small Language Model) Strategy**

SIVA is building custom Small Language Models for sales-specific tasks.

**Why SLM Instead of Just Using Claude/GPT?**
- 90% cost reduction per query
- 10x faster responses
- Can run on-device for voice hardware
- Training data is our unique moat

**SLM Roadmap:**
- 2026: Data collection (10M+ sales conversations)
- 2027: SLM-1B (basic queries, $0.001/query)
- 2027: SLM-3B (complex queries, handles 70%)
- 2028: SLM-7B (near-Claude quality, 90% of queries)
- 2029: SLM-13B (matches Claude, full reasoning)
- 2030: Open-source release

**Current Architecture:**
- LLM Router intelligently routes to Claude, Gemini, or GPT
- Fallback chains for reliability
- Cost tracking per query

**Recommended Module:** Module 13: SLM Deep Dive`;
      } else if (query.includes('vertical') || query.includes('banking') || query.includes('insurance')) {
        response = `**The Vertical Model**

Vertical = The salesperson's world (NOT the industry they sell to)

**Currently Active:**
- Banking (Employee Banking, Corporate, SME)

**Phase 4 Expansion:**
- Insurance (Life, Health, General)
- Real Estate (Residential, Commercial)
- Recruitment (Tech, Executive, Volume)

**Key Concept: Entity Target**
- Banking → Companies (hiring signals, expansion)
- Insurance → Individuals (life events)
- Real Estate → Families (growth, relocation)

**Pack Hierarchy:**
1. Vertical Pack (base) - Entity target, signal types
2. Sub-Vertical Pack (specific) - Persona, edge cases
3. Region Pack (local) - Compliance, timing rules

Region overrides Sub-Vertical overrides Vertical.

**Recommended Module:** Module 2: The Vertical Model`;
      } else {
        response = `**AI Learning Agent**

I can help you understand any aspect of SIVA OS. Here are some topics I can explain:

**Architecture & Technical:**
- SIVA OS Kernel and reasoning stages
- The 12 SIVA Tools (Foundation, Strict, Delegated layers)
- QTLE Scoring Model (Quality, Timing, Lifecycle, Engagement)
- Frontend stack (Next.js, Zustand, Tailwind)
- Backend (UPR OS, PostgreSQL, Neo4j, LLM Router)

**Intelligence & AI:**
- Intelligence Packs and Personas
- Multi-Agent AI Orchestration (11 departments)
- SLM roadmap and custom model strategy
- Evidence Engine and citations

**Business & Operations:**
- Vertical Model (Banking → Insurance → Real Estate)
- User types (Individual, Tenant, Super Admin)
- Pricing and GTM strategy
- 5-Phase roadmap to $100M

**Try asking:**
- "What is RAG and how is it used?"
- "Explain the 12 SIVA tools"
- "Why did we choose Next.js?"
- "What should I learn first?"
- "How does the SLM strategy work?"

*Type a specific question to get detailed information.*`;
      }

      setAiResponse(response);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Header with AI Agent */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">SIVA OS Knowledge Academy</h1>
        <p className="text-slate-400 max-w-3xl mx-auto mb-6">
          Comprehensive education covering every inch of the product. 20 modules, 100+ topics,
          with deep technical rationale, 2030 compatibility insights, and AI-powered industry updates.
        </p>

        {/* Progress Stats */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-400">{totalCompleted}</p>
            <p className="text-xs text-slate-500">Topics Completed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-cyan-400">{LEARNING_MODULES.length}</p>
            <p className="text-xs text-slate-500">Total Modules</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-400">{Math.round((totalCompleted / TOTAL_TOPICS) * 100)}%</p>
            <p className="text-xs text-slate-500">Mastery Level</p>
          </div>
        </div>
      </div>

      {/* AI Learning Agent Card */}
      <div className="mb-8 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/30 rounded-2xl overflow-hidden">
        <button
          onClick={() => setAiAgentOpen(!aiAgentOpen)}
          className="w-full px-6 py-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-2xl">
              🤖
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg text-white">AI Learning Agent</h3>
              <p className="text-sm text-slate-400">Ask questions, get industry updates, explore concepts with AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
              Powered by Claude
            </span>
            <span className={`text-xl transition-transform ${aiAgentOpen ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </button>

        <AnimatePresence>
          {aiAgentOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 border-t border-purple-500/20">
                <div className="mt-4 grid md:grid-cols-3 gap-4 mb-4">
                  <button
                    onClick={() => { setAiQuery('What are the latest AI Sales trends?'); handleAiQuery(); }}
                    className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-left hover:border-purple-500/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-white">Industry Trends</p>
                    <p className="text-xs text-slate-400">Latest AI Sales developments</p>
                  </button>
                  <button
                    onClick={() => { setAiQuery('Why did we choose Next.js over other frameworks?'); handleAiQuery(); }}
                    className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-left hover:border-purple-500/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-white">Tech Decisions</p>
                    <p className="text-xs text-slate-400">Understand architecture choices</p>
                  </button>
                  <button
                    onClick={() => { setAiQuery('How will SIVA OS evolve by 2030?'); handleAiQuery(); }}
                    className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-left hover:border-purple-500/50 transition-colors"
                  >
                    <p className="text-sm font-medium text-white">2030 Roadmap</p>
                    <p className="text-xs text-slate-400">Future compatibility vision</p>
                  </button>
                </div>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
                    placeholder="Ask about any topic: tech choices, industry context, 2030 compatibility..."
                    className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleAiQuery}
                    disabled={aiLoading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {aiLoading ? 'Thinking...' : 'Ask AI'}
                  </button>
                </div>

                {aiResponse && (
                  <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <div className="prose prose-invert prose-sm max-w-none">
                      {aiResponse.split('\n').map((line, i) => {
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <h4 key={i} className="text-emerald-400 font-bold mt-3 mb-2">{line.replace(/\*\*/g, '')}</h4>;
                        }
                        if (line.startsWith('- ')) {
                          return <p key={i} className="text-slate-300 text-sm ml-4">• {line.slice(2)}</p>;
                        }
                        if (line.startsWith('*') && line.endsWith('*')) {
                          return <p key={i} className="text-slate-500 text-xs italic mt-4">{line.replace(/\*/g, '')}</p>;
                        }
                        return line ? <p key={i} className="text-slate-300 text-sm">{line}</p> : <br key={i} />;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search and Category Filter */}
      <div className="mb-6 space-y-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search modules and topics..."
          className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-4">
        {filteredModules.map((module) => {
          const completedCount = module.topics.filter(t => completedTopics.includes(t.id)).length;
          const isComplete = completedCount === module.topics.length;
          const progressPercent = (completedCount / module.topics.length) * 100;

          return (
            <div key={module.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                    isComplete ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}>
                    {isComplete ? '✓' : module.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{module.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                        module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                        module.difficulty === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {module.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{module.description}</p>
                    {/* Progress bar */}
                    <div className="mt-2 w-48 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
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
                      {module.prerequisites && module.prerequisites.length > 0 && (
                        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-400 text-sm">
                            <strong>Prerequisites:</strong> {module.prerequisites.join(', ')}
                          </p>
                        </div>
                      )}
                      {module.topics.map((topic) => (
                        <TopicCardEnhanced
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

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No modules match your search criteria.</p>
        </div>
      )}
    </div>
  );
}

function TopicCardEnhanced({
  topic,
  isComplete,
  onComplete
}: {
  topic: LearningTopic;
  isComplete: boolean;
  onComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  // Build learning sections for progressive disclosure
  const sections = [
    { id: 'intro', title: '1. Introduction', icon: '📖' },
    { id: 'analogy', title: '2. Understand It', icon: '💡' },
    { id: 'details', title: '3. The Details', icon: '🔍' },
    { id: 'technical', title: '4. Technical Deep Dive', icon: '⚙️' },
    { id: 'quiz', title: '5. Test Yourself', icon: '✅' },
  ];

  // Generate a simple quiz from the content
  const generateQuiz = () => {
    const quizzes = [
      {
        question: `What is the main purpose of "${topic.title}"?`,
        options: [
          topic.keyPoints[0] || 'Understanding the concept',
          'It has no specific purpose',
          'Only for advanced users',
          'Deprecated feature',
        ],
        correct: 0,
      },
    ];
    return quizzes[0];
  };

  const quiz = generateQuiz();

  const handleQuizSubmit = () => {
    setShowQuizResult(true);
    if (quizAnswer === quiz.correct) {
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  };

  return (
    <div className={`mb-6 rounded-2xl border-2 overflow-hidden transition-all ${
      isComplete
        ? 'bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-500/40'
        : 'bg-gradient-to-br from-slate-900 to-slate-800/50 border-slate-700 hover:border-slate-600'
    }`}>
      {/* Topic Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
            isComplete
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300'
          }`}>
            {isComplete ? '✓' : '📚'}
          </div>
          <div>
            <h4 className={`font-bold text-lg ${isComplete ? 'text-emerald-400' : 'text-white'}`}>
              {topic.title}
            </h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-slate-500">
                {topic.keyPoints.length} key concepts
              </span>
              {topic.analogy && (
                <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                  Has Analogy
                </span>
              )}
              {topic.deepDive && (
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                  Deep Dive
                </span>
              )}
              {topic.codeExample && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded text-xs">
                  Code
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isComplete && (
            <span className="text-emerald-400 text-sm font-medium">Completed</span>
          )}
          <motion.span
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-2xl text-slate-400"
          >
            ▼
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="border-t border-slate-700">
              {/* Section Navigator */}
              <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-700/50">
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  {sections.map((section, idx) => (
                    <button
                      key={section.id}
                      onClick={() => setCurrentSection(idx)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        currentSection === idx
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <span>{section.icon}</span>
                      <span>{section.title}</span>
                    </button>
                  ))}
                </div>
                {/* Progress indicator */}
                <div className="flex gap-1 mt-3">
                  {sections.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        idx <= currentSection ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Section Content */}
              <div className="px-6 py-6">
                <AnimatePresence mode="wait">
                  {/* Section 1: Introduction */}
                  {currentSection === 0 && (
                    <motion.div
                      key="intro"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 rounded-xl p-6 border border-emerald-500/20">
                        <h5 className="text-emerald-400 font-bold text-lg mb-3">🎯 What You&apos;ll Learn</h5>
                        <p className="text-slate-200 text-lg leading-relaxed">{topic.content}</p>
                      </div>

                      {/* Visual Key Points */}
                      <div>
                        <h5 className="text-white font-bold mb-4">📌 Key Takeaways</h5>
                        <div className="grid gap-3">
                          {topic.keyPoints.map((point, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
                            >
                              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                                {i + 1}
                              </span>
                              <p className="text-slate-300 leading-relaxed">{point}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setCurrentSection(1)}
                        className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        Continue to Analogy →
                      </button>
                    </motion.div>
                  )}

                  {/* Section 2: Analogy */}
                  {currentSection === 1 && (
                    <motion.div
                      key="analogy"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <span className="text-6xl">💡</span>
                        <h5 className="text-cyan-400 font-bold text-xl mt-4">Think of it this way...</h5>
                      </div>

                      {topic.analogy ? (
                        <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-2xl p-8 border-2 border-cyan-500/30">
                          <div className="text-center">
                            <p className="text-xl text-white leading-relaxed italic">
                              &ldquo;{topic.analogy}&rdquo;
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                          <p className="text-slate-400">
                            This concept is straightforward - let&apos;s dive into the details!
                          </p>
                        </div>
                      )}

                      {/* Visual comparison if applicable */}
                      {topic.analogy && (
                        <div className="grid md:grid-cols-2 gap-4 mt-6">
                          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                            <h6 className="text-slate-400 text-sm mb-2">🏠 Real World</h6>
                            <p className="text-white font-medium">
                              {topic.analogy.split('.')[0]}.
                            </p>
                          </div>
                          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-500/30">
                            <h6 className="text-emerald-400 text-sm mb-2">💻 In SIVA OS</h6>
                            <p className="text-white font-medium">
                              {topic.title} works the same way.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => setCurrentSection(0)}
                          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setCurrentSection(2)}
                          className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-medium transition-colors"
                        >
                          Continue to Details →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Section 3: Details */}
                  {currentSection === 2 && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <h5 className="text-white font-bold text-xl flex items-center gap-2">
                        <span>🔍</span> The Details
                      </h5>

                      {topic.deepDive ? (
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                          <div className="prose prose-invert prose-sm max-w-none">
                            {topic.deepDive.split('\n\n').map((paragraph, i) => {
                              // Check if it's a header-like line
                              if (paragraph.includes('├──') || paragraph.includes('└──') || paragraph.includes('│')) {
                                return (
                                  <pre key={i} className="bg-slate-900/50 p-4 rounded-lg text-emerald-400 text-sm font-mono overflow-x-auto my-4">
                                    {paragraph}
                                  </pre>
                                );
                              }
                              // Check if it's a numbered list
                              if (/^\d+\./.test(paragraph.trim())) {
                                return (
                                  <div key={i} className="bg-slate-700/30 rounded-lg p-4 my-3">
                                    <p className="text-slate-300">{paragraph}</p>
                                  </div>
                                );
                              }
                              // Check if it's a header
                              if (paragraph.toUpperCase() === paragraph && paragraph.length < 50) {
                                return (
                                  <h6 key={i} className="text-emerald-400 font-bold mt-6 mb-2">
                                    {paragraph}
                                  </h6>
                                );
                              }
                              return (
                                <p key={i} className="text-slate-300 mb-4 leading-relaxed">
                                  {paragraph}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-800/50 rounded-xl p-6">
                          <p className="text-slate-300">
                            The key concepts have been covered. Ready to test your understanding?
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => setCurrentSection(1)}
                          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setCurrentSection(3)}
                          className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-medium transition-colors"
                        >
                          Continue to Technical →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Section 4: Technical */}
                  {currentSection === 3 && (
                    <motion.div
                      key="technical"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <h5 className="text-white font-bold text-xl flex items-center gap-2">
                        <span>⚙️</span> Technical Deep Dive
                      </h5>

                      {/* Tech Rationale */}
                      {topic.techRationale && (
                        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-6">
                          <h6 className="text-orange-400 font-bold mb-3">🛠️ Why This Approach?</h6>
                          <div className="text-slate-300 whitespace-pre-line leading-relaxed">
                            {topic.techRationale}
                          </div>
                        </div>
                      )}

                      {/* Code Example */}
                      {topic.codeExample && (
                        <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
                          <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                            <span className="text-slate-400 text-sm font-mono">Code Example</span>
                            <span className="text-xs text-emerald-400">TypeScript</span>
                          </div>
                          <pre className="p-4 text-sm text-emerald-400 font-mono overflow-x-auto">
                            <code>{topic.codeExample}</code>
                          </pre>
                        </div>
                      )}

                      {/* Future Compatibility */}
                      {topic.futureCompatibility && (
                        <div className="bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border border-purple-500/30 rounded-xl p-6">
                          <h6 className="text-purple-400 font-bold mb-3">🚀 2030 Compatibility</h6>
                          <p className="text-slate-300 whitespace-pre-line leading-relaxed">
                            {topic.futureCompatibility}
                          </p>
                        </div>
                      )}

                      {!topic.techRationale && !topic.codeExample && !topic.futureCompatibility && (
                        <div className="bg-slate-800/50 rounded-xl p-6 text-center">
                          <p className="text-slate-400">
                            This is a foundational concept. Technical implementation details are covered in advanced modules.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => setCurrentSection(2)}
                          className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                        >
                          ← Back
                        </button>
                        <button
                          onClick={() => setCurrentSection(4)}
                          className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl font-medium transition-colors"
                        >
                          Take Quiz →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Section 5: Quiz */}
                  {currentSection === 4 && (
                    <motion.div
                      key="quiz"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <span className="text-5xl">🧠</span>
                        <h5 className="text-white font-bold text-xl mt-4">Test Your Understanding</h5>
                        <p className="text-slate-400 mt-2">Answer correctly to mark this topic as complete</p>
                      </div>

                      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                        <p className="text-white font-medium text-lg mb-6">{quiz.question}</p>

                        <div className="space-y-3">
                          {quiz.options.map((option, i) => (
                            <button
                              key={i}
                              onClick={() => !showQuizResult && setQuizAnswer(i)}
                              disabled={showQuizResult}
                              className={`w-full p-4 rounded-xl text-left transition-all ${
                                showQuizResult
                                  ? i === quiz.correct
                                    ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400'
                                    : i === quizAnswer
                                      ? 'bg-red-500/20 border-2 border-red-500 text-red-400'
                                      : 'bg-slate-700/50 border border-slate-600 text-slate-400'
                                  : quizAnswer === i
                                    ? 'bg-cyan-500/20 border-2 border-cyan-500 text-cyan-400'
                                    : 'bg-slate-700/50 border border-slate-600 text-slate-300 hover:border-slate-500'
                              }`}
                            >
                              <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {option}
                            </button>
                          ))}
                        </div>

                        {showQuizResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mt-6 p-4 rounded-xl ${
                              quizAnswer === quiz.correct
                                ? 'bg-emerald-500/20 border border-emerald-500/30'
                                : 'bg-red-500/20 border border-red-500/30'
                            }`}
                          >
                            {quizAnswer === quiz.correct ? (
                              <p className="text-emerald-400 font-medium">
                                ✅ Correct! You&apos;ve mastered this topic.
                              </p>
                            ) : (
                              <p className="text-red-400 font-medium">
                                ❌ Not quite. Review the content and try again!
                              </p>
                            )}
                          </motion.div>
                        )}

                        {!showQuizResult && quizAnswer !== null && (
                          <button
                            onClick={handleQuizSubmit}
                            className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors"
                          >
                            Submit Answer
                          </button>
                        )}

                        {showQuizResult && quizAnswer !== quiz.correct && (
                          <button
                            onClick={() => {
                              setQuizAnswer(null);
                              setShowQuizResult(false);
                              setCurrentSection(0);
                            }}
                            className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                          >
                            Review Content Again
                          </button>
                        )}
                      </div>

                      {!showQuizResult && (
                        <button
                          onClick={() => setCurrentSection(3)}
                          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                        >
                          ← Back to Technical
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LEARNING_MODULES: LearningModule[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // FOUNDATION MODULES (1-4)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'foundations',
    title: 'Module 1: SIVA OS Foundations',
    description: 'The fundamental truth: SIVA is the platform, not a feature',
    icon: '🏛️',
    estimatedTime: '45 min',
    difficulty: 'beginner',
    category: 'foundation',
    topics: [
      {
        id: 'siva-fundamental-truth',
        title: 'The Fundamental Truth',
        content: 'SIVA is NOT a feature of PremiumRadar. PremiumRadar is ONE distribution of SIVA. SIVA is the platform. SIVA is the OS. SIVA is the product. This is the most important concept in the entire system.',
        analogy: 'Think of iOS vs the iPhone. iOS is the operating system that powers the iPhone, iPad, and other devices. Similarly, SIVA OS is the intelligence layer that powers PremiumRadar (web), SIVA Mobile (app), SIVA Voice (device), and SIVA SDK (embedded).',
        keyPoints: [
          'SIVA = Sales Intelligence Virtual Assistant = The Operating System',
          'PremiumRadar = One web distribution of SIVA',
          'Other distributions: SIVA Mobile, SIVA Voice, SIVA SDK, SIVA API',
          'All surfaces render the same intelligence',
          'If it only works on web, it\'s not SIVA - it\'s just a feature',
        ],
        deepDive: `The distinction between SIVA OS and PremiumRadar is critical for understanding the entire architecture.

SIVA OS is the underlying intelligence platform that includes:
- The SIVA Kernel (reasoning engine)
- 12 atomic tools for sales operations
- Intelligence Pack system for vertical customization
- Multi-agent orchestration for quality and governance
- Self-healing and self-evolving capabilities

PremiumRadar is simply a web application that renders SIVA's intelligence. Tomorrow we could build:
- SIVA Mobile: A standalone mobile app
- SIVA Voice: "Hey SIVA" voice-activated device
- SIVA SDK: Embedded into Salesforce, HubSpot
- SIVA WhatsApp: Chat-based interface
- SIVA Browser Extension: Context while browsing LinkedIn

All of these would use the SAME SIVA OS backend. The intelligence is centralized, surfaces are distributed.`,
        techRationale: `Why separate OS from distribution?

1. SCALABILITY: One intelligence engine serves unlimited surfaces
2. CONSISTENCY: Users get same quality whether on web, mobile, or voice
3. MOAT: Competitors can't copy - they'd need to build the entire OS
4. EXTENSIBILITY: Third parties can build on SIVA SDK
5. VALUATION: Platform companies are valued 10x higher than point solutions

This architecture is inspired by:
- Apple's iOS (one OS, multiple devices)
- Amazon's Alexa (voice OS in Echo, cars, appliances)
- Salesforce Platform (one CRM, thousands of apps)`,
        futureCompatibility: `By 2030, SIVA OS will:
- Power 50,000+ salespeople across 10+ verticals
- Support voice-first "Hey SIVA" as primary interface
- Run on dedicated hardware devices
- Be embedded in every major CRM via SDK
- Process 5M+ queries daily with sub-100ms latency

The platform architecture ensures we can scale to these demands without rewriting core intelligence.`,
      },
      {
        id: 'siva-vision',
        title: 'The SIVA Vision',
        content: '"SIVA will become the Siri of Sales." When a salesperson anywhere in the world says "Hey SIVA, who should I call today?", SIVA will understand their context, analyze their pipeline, prioritize contacts, surface relevant context, suggest optimal timing, prepare outreach templates, and book meetings automatically.',
        analogy: 'Just as Siri handles general assistance and Alexa handles smart home, SIVA handles sales intelligence. "Google is for searching the web. Perplexity is for answering questions about the web. SIVA is for answering questions about your sales."',
        keyPoints: [
          'Positioning: The Siri of Sales',
          'Wake word: "Hey SIVA" (coming in Phase 5)',
          'Not a chatbot - a complete sales operating system',
          'Evidence-grounded: every claim has a citation',
          'Self-evolving: improves without human intervention',
        ],
        deepDive: `The 7 things SIVA does when asked "Who should I call today?":

1. UNDERSTAND CONTEXT: Load the salesperson's vertical, sub-vertical, region, and persona
2. ANALYZE PIPELINE: Review all companies in their territory with active signals
3. PRIORITIZE CONTACTS: Apply QTLE scoring and persona rules
4. SURFACE CONTEXT: Prepare talking points based on signals
5. SUGGEST TIMING: Calculate optimal windows based on calendar and patterns
6. PREPARE OUTREACH: Generate personalized email/LinkedIn templates
7. EXECUTE (if authorized): Book meetings, send emails, log activities

This is NOT a search feature. This is an entire workflow executed through conversation.`,
        futureCompatibility: `By 2030, SIVA will:
- Be voice-first (keyboard secondary)
- Proactively alert salespeople to opportunities
- Autonomously handle routine sales tasks
- Learn from every interaction to improve recommendations
- Predict deals before salespeople even ask`,
      },
      {
        id: 'category-creation',
        title: 'AI Sales OS: The Category We\'re Creating',
        content: 'We are not entering an existing market. We are CREATING a new category: AI Sales OS. Category leaders capture 76% of market value. The company that names the category, owns the category.',
        analogy: 'Salesforce didn\'t enter the "database" market - they created "CRM." HubSpot didn\'t enter "marketing software" - they created "Inbound Marketing." We\'re not entering "sales tools" - we\'re creating "AI Sales OS."',
        keyPoints: [
          'Category name: AI Sales OS (not "Sales AI" or "AI CRM")',
          'OS implies: Platform, extensibility, multi-surface, foundational',
          'AI implies: Intelligence, reasoning, proactive, learning',
          'Sales implies: Vertical focus, domain expertise, revenue-critical',
          'Goal: By 2030, "AI Sales OS" = SIVA (like Kleenex = tissue)',
        ],
        deepDive: `Why "AI Sales OS" wins over alternatives:

REJECTED: "Sales AI" - Too generic, everyone claims this
REJECTED: "AI CRM" - Implies we're a CRM with AI, we're not
REJECTED: "Sales Copilot" - Microsoft owns "Copilot" mindshare
REJECTED: "Sales Intelligence Platform" - ZoomInfo/Apollo own this

CHOSEN: "AI Sales OS" - Nobody owns it. Platform positioning. AI-native.

Category Leadership Metrics we track:
- "AI Sales OS" search volume growth
- Analyst reports mentioning our category
- Competitor press releases referencing our category
- Wikipedia/industry glossary inclusion
- % of category searches that lead to SIVA`,
        techRationale: `Category creation is a deliberate strategy, not marketing fluff.

Books to study:
- "Play Bigger" by Al Ramadan
- "Category Creation" by Anthony Kennada
- "Blue Ocean Strategy" by Kim & Mauborgne

Key principle: When you create a category, you're not competing. You're educating the market that this category should exist, and you're the obvious leader.`,
        futureCompatibility: `Category Timeline:
2025: Category creation - SIVA launches, "AI Sales OS" term coined
2026: Category awareness - First analyst report mentions category
2027: Category competition - First competitor claims positioning
2028: Category leadership - Gartner/Forrester recognize us as leader
2029: Category maturity - "AI Sales OS" becomes budget line item
2030: Category dominance - SIVA is synonymous with AI Sales OS`,
      },
      {
        id: 'founder-constraints',
        title: '7 Founder Hard Constraints',
        content: 'These rules can NEVER be violated. Not by any engineer. Not by any investor. Not by any acquisition. They are the DNA of the company.',
        keyPoints: [
          '1. SIVA-First, Not UI-First: Every feature starts with "What should SIVA do?"',
          '2. AI-Native, Not AI-Added: SIVA IS the product, not a bolted-on feature',
          '3. No Hardcoded Intelligence: All logic from Packs/Personas/Rules',
          '4. SIVA Configures SIVA: Super Admin is conversation, not config screens',
          '5. Evidence-Grounded or Silent: Never guess, never hallucinate',
          '6. Multi-Surface by Design: Must work on web, mobile, voice, CRM',
          '7. Self-Evolving System: Improves without human intervention',
        ],
        deepDive: `Detailed explanation of each constraint:

1. SIVA-FIRST, NOT UI-FIRST
Wrong: "Let's add a dashboard with charts"
Right: "What should SIVA tell the user about their pipeline?"

2. AI-NATIVE, NOT AI-ADDED
SIVA is not an "AI feature" bolted onto a SaaS product. SIVA IS the product. Everything else is rendering.

3. NO HARDCODED INTELLIGENCE
Never write: if (signal === 'hiring') { score += 10 }
Always: Load weight from persona.signalWeights['hiring']

4. SIVA CONFIGURES SIVA
Super Admin conversation:
Admin: "Create a persona for Insurance in UAE"
SIVA: "I'll create this. Entity: Individual. Signals: Life events. Tone: Empathetic. Activate?"

5. EVIDENCE-GROUNDED OR SILENT
If SIVA doesn't have evidence: "I don't have that information."
Every claim has a citation. Every recommendation has a source.

6. MULTI-SURFACE BY DESIGN
If a feature only works on web, it's not ready. Think: How does this work on voice?

7. SELF-EVOLVING SYSTEM
SIVA detects drift, adjusts weights, updates personas, proposes improvements. This is the moat.`,
        futureCompatibility: `These constraints ensure SIVA stays ahead of competitors:

By 2030:
- Competitors who hardcoded will be stuck
- Competitors who are UI-first will feel dated
- Competitors without self-evolution will stagnate

Our moat is architectural, not feature-based.`,
      },
    ],
  },
  {
    id: 'vertical-model',
    title: 'Module 2: The Vertical Model',
    description: 'How SIVA adapts to every sales role through verticals, sub-verticals, and regions',
    icon: '🏢',
    estimatedTime: '60 min',
    difficulty: 'beginner',
    category: 'foundation',
    topics: [
      {
        id: 'vertical-definition',
        title: 'What is a Vertical?',
        content: 'Vertical defines the salesperson\'s complete professional context. It\'s NOT the industry they sell TO, it\'s the world they operate IN. Banking salespeople have different signals, scoring, personas, and journeys than Insurance salespeople.',
        analogy: 'Think of verticals like different sports. Basketball and soccer are both sports, but everything is different - the rules, equipment, field size, scoring. Banking and Insurance are different "sports" for salespeople.',
        keyPoints: [
          'Vertical = Salesperson\'s world (Banking, Insurance, Real Estate)',
          'Each vertical has unique: signals, scoring, personas, journeys',
          'Currently active: Banking only',
          'Phase 4: Insurance, Real Estate, Recruitment, SaaS Sales',
          'Vertical determines what SIVA looks for and how it thinks',
        ],
        deepDive: `The Vertical Model Architecture:

VERTICAL (Level 1)
├── Entity Target: What do they sell to?
│   - Banking → Companies
│   - Insurance → Individuals
│   - Real Estate → Families
├── Signal Types: What triggers opportunity?
│   - Banking: Hiring, expansion, funding
│   - Insurance: Life events, policy expiry
│   - Real Estate: Family growth, relocation
├── Scoring Model: How to prioritize?
│   - Different QTLE weights per vertical
├── Journey Stages: What's the sales process?
│   - Banking: Discovery → Proposal → Negotiation
│   - Insurance: Awareness → Need → Quote → Policy
└── Compliance: What can't we say?
    - Banking: Can't promise rates
    - Insurance: Can't diagnose conditions`,
        techRationale: `Why not one-size-fits-all?

Generic AI assistants fail in sales because:
1. They don't understand domain-specific signals
2. They can't prioritize without context
3. They generate generic, unhelpful content
4. They violate compliance rules

SIVA's vertical model solves this by loading domain-specific intelligence.`,
      },
      {
        id: 'sub-vertical-definition',
        title: 'What is a Sub-Vertical?',
        content: 'Sub-Vertical is the specific role within a vertical. Within Banking, there\'s Employee Banking (payroll accounts), Corporate Banking (treasury), and SME Banking (small business). Each has different personas, contacts, and approaches.',
        analogy: 'If Vertical is the sport (basketball), Sub-Vertical is the position (point guard vs center). Same game, different skills, different plays.',
        keyPoints: [
          'Sub-Vertical = Specific role within vertical',
          'Banking sub-verticals: EB, Corporate, SME',
          'Each sub-vertical has its own PERSONA',
          'Persona controls: tone, contacts, edge cases, timing',
          'EB persona ≠ Corporate Banking persona',
        ],
        deepDive: `Sub-Verticals for each Vertical:

BANKING
├── Employee Banking (EB) - Payroll, salary accounts
├── Corporate Banking - Treasury, trade finance
└── SME Banking - Small business accounts

INSURANCE (Phase 4)
├── Life Insurance
├── Health Insurance
└── General Insurance

REAL ESTATE (Phase 4)
├── Residential Sales
├── Commercial Leasing
└── Property Management

RECRUITMENT (Phase 5)
├── Tech Recruitment
├── Executive Search
└── Volume Hiring

Each sub-vertical gets its own persona stored in the database, not hardcoded.`,
        techRationale: `Why persona per sub-vertical, not per vertical?

EB salesperson thinks: "I need HR Directors at growing companies"
Corporate Banking salesperson thinks: "I need CFOs at large enterprises"

Same vertical (Banking), completely different:
- Contact targets
- Signal relevance
- Scoring weights
- Outreach approach
- Compliance rules

Storing persona at sub-vertical level allows maximum customization.`,
      },
      {
        id: 'region-territory',
        title: 'Region & Territory',
        content: 'Region is the salesperson\'s operating territory. UAE has different calendar rules (Ramadan), compliance requirements, and market dynamics than India or US. Territory is even more specific (Dubai South, DIFC).',
        keyPoints: [
          'Region = Country-level context (UAE, India, US)',
          'Territory = City/area level (Dubai, DIFC, Whitefield)',
          'Region affects: timing rules, compliance, tone',
          'UAE-specific: Ramadan sensitivity, Q1 budget season',
          'Region Pack overrides Sub-Vertical Pack',
        ],
        deepDive: `UAE-Specific Rules (Currently Active):

CALENDAR RULES
- Q1 (Jan-Feb): Budget season, timing multiplier ×1.3
- Ramadan: Pause cold outreach, multiplier ×0.3
- Summer (Jul-Aug): Low response rates, ×0.7
- Q4 (Dec): Budget freeze, ×0.6

COMPLIANCE
- Cannot discuss interest rates
- Cannot promise specific returns
- Must reference CBUAE regulations

MARKET DYNAMICS
- Free Zone companies: Boost score ×1.3
- Enterprise brands (Emirates, ADNOC): Reduce score ×0.1
- Government entities: Usually blocked

These rules are stored in Region Pack, not hardcoded.`,
        futureCompatibility: `By 2030, SIVA will support:
- 50+ countries with localized rules
- Multi-language support
- Local regulatory compliance
- Region-specific data residency
- Cultural adaptation in AI responses`,
      },
      {
        id: 'entity-target',
        title: 'Entity Target: Companies vs Individuals',
        content: 'Entity Target defines what the salesperson is selling TO. Banking sells to Companies. Insurance sells to Individuals. Real Estate sells to Families. This fundamentally changes what SIVA looks for.',
        keyPoints: [
          'Banking: Entity = Company (hiring, expansion signals)',
          'Insurance: Entity = Individual (life events, policy expiry)',
          'Real Estate: Entity = Family (growth, relocation)',
          'Entity type determines: data sources, signals, contact model',
          'Cannot mix entity types within a vertical',
        ],
        deepDive: `Entity Target implications:

COMPANIES (Banking, SaaS Sales)
- Data sources: LinkedIn, Crunchbase, news
- Signals: Hiring, funding, expansion, M&A
- Contacts: HR Director, CFO, Procurement
- Enrichment: Company size, revenue, headcount

INDIVIDUALS (Insurance)
- Data sources: Public records, social, referrals
- Signals: Marriage, birth, retirement, job change
- Contacts: The individual themselves
- Enrichment: Age, family size, income indicators

FAMILIES (Real Estate)
- Data sources: Property records, social
- Signals: Baby, school age kids, empty nest
- Contacts: Primary decision maker
- Enrichment: Family composition, location preferences

SIVA's entire intelligence pipeline changes based on entity type.`,
      },
    ],
  },
  {
    id: 'user-types',
    title: 'Module 3: User Types & Access Model',
    description: 'Individual users, Tenant users, Tenant Admins, and Super Admin',
    icon: '👥',
    estimatedTime: '30 min',
    difficulty: 'beginner',
    category: 'foundation',
    topics: [
      {
        id: 'individual-user',
        title: 'Individual Users',
        content: 'Individual users are salespeople whose companies haven\'t enrolled in PremiumRadar. They pay personally ($49-99/mo) and manage their own workspace. They are NOT free tier users - they are paying customers.',
        keyPoints: [
          'Who: Solo salesperson, company not enrolled',
          'Pays: Personal credit card ($49-99/mo)',
          'Admin: Self-managed workspace',
          'Future: May convert company to Tenant',
          'Access: All SIVA features, personal quota',
        ],
        deepDive: `Individual User Journey:

1. SIGNUP: Signs up with personal email
2. CONTEXT SETUP: Selects vertical/sub-vertical/region
3. PACK ASSIGNMENT: SIVA loads appropriate persona
4. FIRST VALUE: Within 60 seconds, sees first recommendations
5. DAILY USAGE: Asks SIVA questions, gets briefings
6. CONVERSION: If impressed, pitches to employer
7. UPGRADE: Company becomes Tenant

Individual users are critical for:
- Proving product-market fit
- Bottom-up sales motion
- Converting companies to Tenant accounts`,
        techRationale: `Why Individual matters:

B2B SaaS typically sells top-down (to companies). But:
- Long sales cycles (months)
- Need executive buy-in
- Hard to prove value

Individual-first approach:
- User tries, user loves, user advocates
- Company converts based on proven value
- Similar to Slack, Notion, Figma playbook`,
      },
      {
        id: 'tenant-user',
        title: 'Tenant Users & Admins',
        content: 'Tenant users are salespeople whose company has enrolled. They share a workspace, have team analytics, and are managed by a Tenant Admin. The Tenant Admin can add/remove users, view team performance, and configure settings.',
        keyPoints: [
          'Tenant User: Company-enrolled salesperson',
          'Tenant Admin: Manages company workspace',
          'Shared workspace + personal history',
          'Team analytics and leaderboards',
          'Billing through company',
        ],
        deepDive: `Tenant Admin Capabilities:

TEAM MANAGEMENT
├── Add/remove users
├── Assign territories
├── Set quotas
└── Manage roles

ANALYTICS
├── "Who on my team needs coaching?"
├── "What's our team conversion rate?"
├── "Which signals are my team ignoring?"
└── "Show me our best performer's workflow"

CONFIGURATION
├── Adjust persona tone
├── Create territories
├── Configure campaigns
├── Set compliance rules

CANNOT DO
├── Create new verticals
├── Modify scoring formulas
├── Access other tenants
├── Override Super Admin settings`,
      },
      {
        id: 'super-admin',
        title: 'Super Admin (Founder Only)',
        content: 'Super Admin is the platform operator - currently Sivakumar only. Super Admin can configure verticals, manage personas, view all tenants, and control the entire SIVA OS. Access is at /superadmin (hidden route).',
        keyPoints: [
          'Who: Platform operator (Founder only)',
          'Powers: Full platform control',
          'Access: /superadmin (protected)',
          'AI Access: Orchestrator SIVA',
          'Responsibility: Platform health, AI governance',
        ],
        deepDive: `Super Admin Powers:

VERTICAL MANAGEMENT
├── Create/edit verticals
├── Configure sub-verticals
├── Set entity targets
└── Define signal types

PERSONA MANAGEMENT
├── Create personas per sub-vertical
├── Define edge cases
├── Set timing rules
├── Configure outreach doctrine

AI ORCHESTRATION
├── View 11 AI department reports
├── Approve/reject AI suggestions
├── Monitor AI quality metrics
└── Trigger pack refreshes

TENANT OVERSIGHT
├── View all tenants
├── Override any setting
├── Manage billing
└── Access audit logs`,
        techRationale: `Why Super Admin is conversation-based (not config screens):

Traditional admin: Forms, dropdowns, save buttons
SIVA admin: "Create a persona for Insurance UAE"

Benefits:
1. Faster iteration
2. AI suggests optimal configurations
3. Self-documenting (conversation is the audit trail)
4. Can handle edge cases naturally

This is Constraint #4: SIVA Configures SIVA`,
      },
    ],
  },
  {
    id: 'signals-deep',
    title: 'Module 4: Sales Signals Deep Dive',
    description: 'What signals are, how they\'re detected, and how they drive SIVA',
    icon: '📡',
    estimatedTime: '60 min',
    difficulty: 'intermediate',
    category: 'foundation',
    topics: [
      {
        id: 'signal-definition',
        title: 'What Are Sales Signals?',
        content: 'Signals are company events that indicate a potential sales opportunity. They are NOT life events, not industry news, not generic data. Every signal must answer: "Does this suggest the company might need our services?"',
        analogy: 'Signals are like smoke detectors. A smoke detector doesn\'t tell you everything about a house - it tells you ONE thing: there might be fire. Similarly, a "hiring-expansion" signal tells you ONE thing: this company might need payroll banking.',
        keyPoints: [
          'Signal = Company event indicating sales opportunity',
          'NOT life events (marriage, birth) for Banking',
          'NOT industry news or market analysis',
          'Must directly correlate to buying intent',
          'Each vertical has different relevant signals',
        ],
        deepDive: `Signal Taxonomy for Banking:

EXPANSION SIGNALS (High confidence)
├── hiring-expansion: Posting 10+ jobs
├── headcount-jump: >20% growth in quarter
├── office-opening: New location announced
└── market-entry: Entering new country

FUNDING SIGNALS (Medium confidence)
├── funding-round: Series A/B/C raised
├── project-award: Major contract won
└── subsidiary-creation: New entity formed

CHANGE SIGNALS (Variable confidence)
├── leadership-change: New CEO/CFO/HR
├── m-and-a: Merger or acquisition
└── restructuring: Reorganization news

Each signal has:
- Detection source (LinkedIn, news, etc.)
- Confidence score
- Freshness timestamp
- Relevance to sub-vertical`,
        techRationale: `Why signals, not just company data?

Traditional sales intel: "Here's a list of companies in Dubai"
Signal-based: "Here are companies ACTIVELY showing buying signals"

The difference:
- Company list: 10,000 companies, most not buying
- Signal-based: 50 companies actively expanding NOW

Signals create urgency and relevance.`,
      },
      {
        id: 'signal-freshness',
        title: 'Signal Freshness & Decay',
        content: 'Signals lose relevance over time. A company that was hiring 6 months ago may have already selected a banking partner. SIVA applies decay functions to older signals.',
        keyPoints: [
          'Fresh: 0-14 days = Full signal weight (100%)',
          'Recent: 15-30 days = 80% weight',
          'Aging: 31-60 days = 50% weight',
          'Stale: 60+ days = 20% weight or ignored',
          'Different signals decay differently',
        ],
        deepDive: `Decay Functions by Signal Type:

FAST DECAY (action needed NOW)
├── Job postings: Stale after 30 days
├── Funding announcements: Stale after 45 days
└── Leadership changes: Stale after 21 days

SLOW DECAY (opportunity persists)
├── Office openings: Relevant for 90 days
├── Market entry: Relevant for 180 days
└── Subsidiary creation: Relevant for 120 days

Decay Formula:
weight = base_weight × decay_multiplier × freshness_score

Example:
- Hiring signal, 20 days old
- Base weight: 0.25
- Decay multiplier: 0.8 (15-30 day bucket)
- Effective weight: 0.25 × 0.8 = 0.20`,
        codeExample: `// Signal freshness calculation
function calculateSignalWeight(signal, persona) {
  const daysSinceDetection = getDaysSince(signal.detected_at);
  const baseWeight = persona.signalWeights[signal.type];
  const decayRule = persona.freshnessRules[signal.type];

  let multiplier = 1.0;
  if (daysSinceDetection > decayRule.staleDays) {
    multiplier = 0.2;
  } else if (daysSinceDetection > decayRule.agingDays) {
    multiplier = 0.5;
  } else if (daysSinceDetection > decayRule.freshDays) {
    multiplier = 0.8;
  }

  return baseWeight * multiplier;
}`,
      },
      {
        id: 'signal-combinations',
        title: 'Signal Combinations & Boosters',
        content: 'Multiple signals on the same company create stronger opportunities. A company that is BOTH hiring AND opened a new office is a better prospect than one doing either alone.',
        keyPoints: [
          'Single signal: Baseline opportunity',
          'Two signals: Boosted score (×1.5)',
          'Three+ signals: Hot prospect (×2.0)',
          'Certain combinations are especially powerful',
          'Some signals block others (contradictions)',
        ],
        deepDive: `Signal Combination Logic:

POWER COMBINATIONS (Massive boost)
├── Hiring + Funding: Growing AND capitalized
├── Office + Market Entry: Physical expansion
└── Leadership + Restructuring: Change agent

NEUTRAL COMBINATIONS (Additive)
├── Multiple job postings: Reinforcing signal
├── News + Social: Cross-validation
└── Different time periods: Sustained growth

BLOCKING COMBINATIONS (Red flags)
├── Hiring + Layoffs: Contradictory (ignore both)
├── Expansion + Bankruptcy: Financial distress
└── Growth + Acquisition (by competitor): May not need us

Combination scoring formula:
if (signals.length >= 3) boost = 2.0
else if (signals.length === 2) boost = 1.5
else boost = 1.0

final_score = base_score × boost`,
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNICAL MODULES (5-8)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'siva-kernel',
    title: 'Module 5: SIVA OS Kernel',
    description: 'The reasoning engine that processes every user request',
    icon: '🧠',
    estimatedTime: '90 min',
    difficulty: 'advanced',
    category: 'technical',
    prerequisites: ['Module 1: SIVA OS Foundations'],
    topics: [
      {
        id: 'kernel-architecture',
        title: 'Kernel Architecture Overview',
        content: 'The SIVA Kernel is the reasoning engine that processes every user request. It has 4 main engines: Context Engine, Persona Engine, Evidence Engine, and Tools Engine, all coordinated by the MCP 12-Phase Orchestration.',
        keyPoints: [
          'Context Engine: Provides situational awareness',
          'Persona Engine: Loads role-specific behavior',
          'Evidence Engine: Ensures no hallucinations',
          'Tools Engine: 12 atomic execution tools',
          'MCP: Model Context Protocol orchestration',
        ],
        deepDive: `SIVA Kernel Components:

┌─────────────────────────────────────────────────┐
│                 SIVA OS KERNEL                   │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │           REASONING ENGINE                │   │
│  │  Perceive → Analyze → Decide → Execute   │   │
│  └──────────────────────────────────────────┘   │
│                      ↑                          │
│  ┌──────────────────────────────────────────┐   │
│  │      MCP 12-PHASE ORCHESTRATION          │   │
│  └──────────────────────────────────────────┘   │
│                      ↑                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────┐ │
│  │EVIDENCE │ │ TOOLS   │ │PERSONA  │ │CONTXT│ │
│  │ ENGINE  │ │ ENGINE  │ │ ENGINE  │ │ENGINE│ │
│  └────┬────┘ └────┬────┘ └────┬────┘ └──┬───┘ │
│       └──────────┬──────────┬──────────┘       │
│                  ↓                              │
│         ┌─────────────────┐                    │
│         │  SALESCONTEXT   │                    │
│         │(Canonical Input)│                    │
│         └─────────────────┘                    │
└─────────────────────────────────────────────────┘`,
        techRationale: `Why this architecture?

1. SEPARATION OF CONCERNS
Each engine has one job. Evidence Engine doesn't know about personas. Tools Engine doesn't know about context. This makes each component testable and upgradeable independently.

2. CANONICAL INPUT
All engines read from SalesContext. This ensures consistency - everyone sees the same user context.

3. ORCHESTRATION LAYER
MCP coordinates the engines. Tomorrow we can swap out one engine without affecting others.

4. EVIDENCE-FIRST
Evidence Engine validates BEFORE output. Hallucinations are caught, not shipped.`,
        futureCompatibility: `By 2030, the kernel will:
- Process 5M+ requests/day
- Support 50+ languages
- Run on edge devices (voice hardware)
- Self-optimize based on usage patterns
- Handle multi-turn complex reasoning`,
      },
      {
        id: 'reasoning-stages',
        title: 'Reasoning Engine Stages',
        content: 'The Reasoning Engine has 4 stages: Perceive (understand intent), Analyze (gather evidence), Decide (rank options), Execute (call tools). Each stage has specific inputs and outputs.',
        keyPoints: [
          'Perceive: Extract intent, entities, constraints',
          'Analyze: Load context, gather evidence, apply persona',
          'Decide: Score options, rank by priority',
          'Execute: Call tools, format output, add citations',
        ],
        deepDive: `Reasoning Flow Example: "Who should I call today?"

STAGE 1: PERCEIVE
Input: User message
Process: NLU parsing
Output: {
  intent: "prioritize_contacts",
  entity: null,  // Not asking about specific company
  timeframe: "today",
  constraints: []
}

STAGE 2: ANALYZE
Input: Parsed intent + SalesContext
Process:
  - Load user's territory
  - Fetch companies with signals
  - Apply persona rules
Output: {
  companies: [...50 companies],
  signals: [...signals per company],
  persona_rules: [...EB rules]
}

STAGE 3: DECIDE
Input: Analysis results
Process:
  - Calculate QTLE score for each
  - Apply edge cases (block/boost)
  - Rank by composite score
Output: {
  ranked: [company1, company2, ...],
  reasoning: ["company1 scored 92 because..."]
}

STAGE 4: EXECUTE
Input: Decision + tools needed
Process:
  - Call CompositeScoreTool
  - Call ContactTierTool
  - Format response
Output: Final SIVA response with citations`,
        codeExample: `// SIVA Response Contract
interface SIVAResponse {
  answer: string;
  reasoning: {
    steps: ReasoningStep[];
    personaApplied: string;
    evidenceUsed: string[];
  };
  citations: {
    text: string;
    source: string;
    freshness: string;
  }[];
  score?: {
    total: number;
    breakdown: { Q, T, L, E };
  };
  suggestedActions?: Action[];
  confidence: number;
  tokensUsed: number;
  latencyMs: number;
}`,
      },
      {
        id: 'salescontext-engine',
        title: 'SalesContext Engine (SCE)',
        content: 'SalesContext is the canonical input contract for ALL SIVA reasoning. Every tool, every score, every recommendation requires SalesContext. Without it, SIVA behaves generically. With it, SIVA behaves as the right persona for the right user.',
        keyPoints: [
          'Canonical input for all SIVA reasoning',
          'Contains: vertical, sub-vertical, region, persona',
          'Contains: user ID, preferences, history',
          'Contains: tenant overrides (if applicable)',
          'Nothing bypasses SCE - it\'s mandatory',
        ],
        deepDive: `SalesContext Schema:

interface SalesContext {
  // SECTION 1: SALESPERSON IDENTITY
  vertical: string;           // "banking"
  subVertical: string;        // "employee_banking"
  region: string;             // "UAE"
  territory?: string;         // "Dubai South"

  // SECTION 2: DERIVED CONFIGURATION
  radarTarget: "companies" | "individuals";
  allowedSignalTypes: string[];
  scoringWeights: QTLEWeights;
  enrichmentSources: string[];

  // SECTION 3: PERSONA
  persona: Persona;

  // SECTION 4: USER CONTEXT
  userId: string;
  userName: string;
  userRole: "individual" | "tenant_member";
  userPreferences: UserPreferences;
  userHistory: UserHistory;

  // SECTION 5: TENANT CONTEXT (if applicable)
  tenantId?: string;
  tenantOverrides?: TenantOverrides;

  // SECTION 6: SESSION CONTEXT
  sessionId: string;
  conversationHistory: Message[];
}`,
        techRationale: `Why SalesContext is critical:

WITHOUT SALESCONTEXT:
User: "Who should I call?"
SIVA: Generic response about prioritization

WITH SALESCONTEXT:
User: "Who should I call?"
SIVA: "Based on your Employee Banking focus in Dubai, here are 5 companies with hiring signals. TechCorp has 15 new positions posted this week..."

The difference is night and day. Context makes SIVA useful.`,
      },
      {
        id: 'evidence-engine',
        title: 'Evidence Engine & Citations',
        content: 'The Evidence Engine ensures SIVA never hallucinates. Every claim must have a source. Every recommendation must have evidence. If there\'s no evidence, SIVA says "I don\'t have that information."',
        keyPoints: [
          'No hallucinations allowed',
          'Every claim has a citation',
          'Citations include: source, date, confidence',
          'If no evidence: "I don\'t know"',
          'Evidence is validated before output',
        ],
        deepDive: `Evidence Requirements:

LEVEL 1: FACTUAL CLAIMS
Claim: "TechCorp has 500 employees"
Required: Source (LinkedIn/Apollo/Crunchbase), Date

LEVEL 2: SIGNAL CLAIMS
Claim: "TechCorp is hiring 15 engineers"
Required: Signal source, Detection date, Confidence score

LEVEL 3: SCORING CLAIMS
Claim: "TechCorp scores 92/100"
Required: Full score breakdown, Factors, Evidence for each

LEVEL 4: RECOMMENDATION CLAIMS
Claim: "You should call Sarah at TechCorp"
Required: Why Sarah (contact tier), Why now (timing), Why TechCorp (score)

Citation Format:
{
  text: "TechCorp posted 15 engineering roles",
  source: "LinkedIn Jobs API",
  date: "2025-12-06",
  confidence: 0.95,
  url: "linkedin.com/company/techcorp/jobs"
}`,
        techRationale: `Why evidence-grounded matters:

TRUST: Users can verify SIVA's claims
ACCURACY: Reduces AI hallucination risk
AUDIT: Every decision is traceable
COMPLIANCE: Required for regulated industries

This is Constraint #5: Evidence-Grounded or Silent`,
      },
    ],
  },
  {
    id: 'siva-tools',
    title: 'Module 6: The 12 SIVA Tools',
    description: 'The atomic tools that power SIVA\'s capabilities',
    icon: '🔧',
    estimatedTime: '90 min',
    difficulty: 'advanced',
    category: 'technical',
    prerequisites: ['Module 5: SIVA OS Kernel'],
    topics: [
      {
        id: 'tool-architecture',
        title: 'Tool Architecture Overview',
        content: 'SIVA has 12 tools organized in 3 layers: Foundation (4 deterministic tools), Strict (4 schema-bound tools), and Delegated (4 LLM-enhanced tools). Each tool has strict input/output contracts and SLAs.',
        keyPoints: [
          'Foundation Layer: Deterministic, no LLM needed',
          'Strict Layer: Schema-bound, predictable outputs',
          'Delegated Layer: LLM-enhanced, creative outputs',
          'All tools have SLAs (latency targets)',
          'All tools receive SalesContext',
        ],
        deepDive: `Tool Organization:

┌───────────────────────────────────────────────┐
│                   SIVA BRAIN                    │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ FOUNDATION LAYER (Deterministic)          │ │
│  │ • CompanyQualityTool    • ContactTierTool │ │
│  │ • TimingScoreTool       • EdgeCasesTool   │ │
│  │ SLA: P50 ≤200ms, P95 ≤500ms               │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ STRICT LAYER (Schema-bound)               │ │
│  │ • BankingProductMatch   • OutreachChannel │ │
│  │ • OpeningContextTool    • CompositeScore  │ │
│  │ SLA: P50 ≤300ms, P95 ≤800ms               │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ DELEGATED LAYER (LLM-enhanced)            │ │
│  │ • OutreachMessageGen    • FollowUpStrategy│ │
│  │ • ObjectionHandler      • RelationshipTrk │ │
│  │ SLA: P50 ≤1000ms, P95 ≤3000ms             │ │
│  └───────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘`,
        techRationale: `Why 3 layers?

FOUNDATION: Speed matters. These tools run on every request. No LLM overhead.

STRICT: Predictability matters. These tools must give consistent outputs for same inputs.

DELEGATED: Creativity matters. These tools generate personalized content.

This layering ensures:
- Fast baseline operations
- Predictable scoring
- Flexible content generation`,
      },
      {
        id: 'foundation-tools',
        title: 'Foundation Layer Tools',
        content: 'The 4 Foundation tools are deterministic and run without LLMs: CompanyQualityTool, ContactTierTool, TimingScoreTool, and EdgeCasesTool.',
        keyPoints: [
          'CompanyQualityTool: Evaluate company fit (0-100)',
          'ContactTierTool: Select optimal contact (STRATEGIC/PRIMARY/SECONDARY)',
          'TimingScoreTool: Calculate timing multiplier (0-2x)',
          'EdgeCasesTool: Check for blockers/warnings',
        ],
        deepDive: `Tool 1: CompanyQualityTool
Purpose: Evaluate company quality for banking fit
SLA: P50 ≤300ms, P95 ≤900ms

Input:
{
  company_name: string;
  domain?: string;
  industry?: string;
  size?: number;
  uae_signals?: { has_ae_domain, has_uae_address };
  salary_indicators?: { salary_level };
  license_type?: 'Free Zone' | 'Mainland';
}

Output:
{
  quality_score: 0-100;
  reasoning: [{ factor, points, explanation }];
  confidence: 0.0-1.0;
  edge_cases_applied: string[];
}

Edge Cases:
- Enterprise Brand Exclusion → score × 0.1
- Government Sector Exclusion → score × 0.05
- Free Zone Bonus → score × 1.3

---

Tool 2: ContactTierTool
Purpose: Select optimal contact tier based on company size
SLA: P50 ≤200ms, P95 ≤600ms

Tier Logic:
<50 employees: Founder/COO → Office Manager
50-500 employees: HR Director → Payroll Manager
>500 employees: Payroll Manager → HR Ops Manager

---

Tool 3: TimingScoreTool
Purpose: Calculate optimal timing multiplier
SLA: P50 ≤120ms, P95 ≤300ms

UAE Calendar:
Q1 (Jan-Feb): ×1.3 (Budget season)
Ramadan: ×0.3 (Pause outreach)
Summer (Jul-Aug): ×0.7 (Low response)
Q4 (Dec): ×0.6 (Budget freeze)

---

Tool 4: EdgeCasesTool
Purpose: Check for blockers and warnings
SLA: P50 ≤50ms, P95 ≤150ms

Decision: BLOCK | WARN | PROCEED`,
        codeExample: `// Example: CompanyQualityTool call
const result = await sivaTools.companyQuality({
  company_name: "TechCorp UAE",
  domain: "techcorp.ae",
  size: 150,
  license_type: "Free Zone",
  salary_indicators: { salary_level: "high" }
}, salesContext);

// Result:
{
  quality_score: 85,
  reasoning: [
    { factor: "Free Zone", points: 15, explanation: "Bonus for Free Zone" },
    { factor: "Company Size", points: 20, explanation: "150 employees - sweet spot" },
    { factor: "High Salary", points: 25, explanation: "Premium banking fit" }
  ],
  confidence: 0.92,
  edge_cases_applied: ["FREE_ZONE_BOOST"]
}`,
      },
      {
        id: 'qtle-scoring',
        title: 'QTLE Scoring Model',
        content: 'QTLE = Quality + Timing + Lifecycle + Engagement. Four scores combine into a Composite Score that determines prospect priority. This is the core of SIVA\'s prioritization logic.',
        keyPoints: [
          'Q-Score: Company fit based on signals (0-100)',
          'T-Score: Timing multiplier based on calendar/signals (0-2x)',
          'L-Score: Where in the sales lifecycle (0-100)',
          'E-Score: Past engagement history (0-100)',
          'Composite = Q × T_multiplier × weighted(L, E)',
        ],
        deepDive: `QTLE Breakdown:

Q-SCORE (Quality)
What: How good is this company for us?
Factors:
- Signal strength (hiring, funding, etc.)
- Company size match
- Industry fit
- Geographic fit
Range: 0-100

T-SCORE (Timing)
What: Is NOW the right time?
Factors:
- Signal freshness
- Calendar context (Q1, Ramadan)
- Day of week/time of day
Range: 0.0-2.0 (multiplier)

L-SCORE (Lifecycle)
What: Where are they in buying journey?
Stages:
- Unknown (0-20)
- Aware (21-40)
- Considering (41-60)
- Evaluating (61-80)
- Ready (81-100)
Range: 0-100

E-SCORE (Engagement)
What: How much have they engaged with us?
Factors:
- Email opens/clicks
- Website visits
- Content downloads
- Meeting attendance
Range: 0-100

COMPOSITE FORMULA:
Composite = Q × T_multiplier × (0.6×L + 0.4×E)

Thresholds:
- HOT: ≥80
- WARM: ≥60
- COLD: ≥40
- DISQUALIFIED: <40`,
        codeExample: `// QTLE Calculation
function calculateQTLE(company, persona, salesContext) {
  const Q = calculateQualityScore(company, persona);
  const T = calculateTimingMultiplier(company.signals, salesContext);
  const L = getLifecycleScore(company, salesContext);
  const E = getEngagementScore(company, salesContext);

  const composite = Q * T * (0.6 * L + 0.4 * E) / 100;

  return {
    q_score: Q,
    t_multiplier: T,
    l_score: L,
    e_score: E,
    composite: composite,
    tier: composite >= 80 ? 'HOT' : composite >= 60 ? 'WARM' : 'COLD'
  };
}`,
      },
      {
        id: 'live-discovery-intelligence',
        title: 'Live Discovery Intelligence (S77)',
        content: 'Live Discovery is SIVA\'s real-time intelligence engine that pulls fresh company data on-demand. Unlike batch systems that rely on stale pre-cached data, Live Discovery queries external sources in real-time, extracts signals using AI, and scores results - all within seconds of a user request.',
        keyPoints: [
          'On-demand: User requests → SIVA searches → Fresh results',
          'No caching dependency: Works even with empty radar DB',
          'AI-powered extraction: Tool 13 parses real news/data',
          'Super Admin configurable: Query templates per vertical/region',
          'Database-driven: No hardcoded queries',
        ],
        deepDive: `LIVE DISCOVERY ARCHITECTURE:

┌─────────────────────────────────────────────────────────┐
│                    USER REQUEST                          │
│  "Show me companies with hiring signals in UAE"         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              STEP 1: LOAD QUERY TEMPLATES               │
│                                                          │
│  Database: discovery_query_templates                     │
│  Priority matching: vertical → sub_vertical → region    │
│                                                          │
│  Example templates loaded:                               │
│  1. "{region} companies hiring expansion"               │
│  2. "{region} new office opening announcement"          │
│  3. "{region} company funding round"                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              STEP 2: SERP API SEARCH                    │
│                                                          │
│  Execute queries against Google via SERP API            │
│  Returns: URLs, titles, snippets from news/web          │
│  Freshness: Last 30 days (configurable)                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              STEP 3: SIVA EXTRACTION (Tool 13)          │
│                                                          │
│  HiringSignalExtractionTool processes each result:      │
│  - Parse company name, signal type                      │
│  - Extract confidence score                              │
│  - Identify signal-specific details                      │
│  - Handle ambiguous or partial matches                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              STEP 4: QTLE SCORING                       │
│                                                          │
│  Each extracted company gets scored:                     │
│  - Q-Score: Based on signal strength                    │
│  - T-Score: Freshness multiplier                         │
│  - Composite calculation                                 │
│  - Tier assignment (HOT/WARM/COLD)                      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              STEP 5: RETURN FRESH RESULTS               │
│                                                          │
│  Response includes:                                      │
│  - Ranked companies with scores                         │
│  - Signal evidence with sources                          │
│  - Freshness indicators (real-time data)                │
└─────────────────────────────────────────────────────────┘

LIVE vs CACHED DISCOVERY:

┌──────────────────┬─────────────────┬──────────────────────┐
│ Aspect           │ Cached (Legacy) │ Live (New)           │
├──────────────────┼─────────────────┼──────────────────────┤
│ Data freshness   │ Up to 24h old   │ Real-time            │
│ Source           │ Pre-run batches │ On-demand queries    │
│ Dependency       │ Needs radar DB  │ Works independently  │
│ Customization    │ Code changes    │ Super Admin UI       │
│ Response time    │ ~200ms          │ ~3-5 seconds         │
│ Empty DB         │ Shows nothing   │ Still finds leads    │
└──────────────────┴─────────────────┴──────────────────────┘`,
        codeExample: `// Live Discovery Request
POST /api/os/discovery
{
  "mode": "live",  // NEW: "live" or "cached"
  "context": {
    "vertical": "banking",
    "subVertical": "employee_banking",
    "region": "UAE"
  },
  "signal_types": ["hiring-expansion", "headcount-jump"],
  "max_results": 10
}

// Response
{
  "success": true,
  "data": {
    "companies": [
      {
        "name": "TechCorp UAE",
        "signals": [
          {
            "type": "hiring-expansion",
            "evidence": "Hiring 50+ engineers per LinkedIn",
            "confidence": 0.89,
            "source_url": "https://...",
            "freshness": "2 hours ago"
          }
        ],
        "scores": { "q": 85, "t": 1.3, "composite": 92 },
        "tier": "HOT"
      }
    ],
    "discovery_mode": "live",
    "queries_executed": 3,
    "results_processed": 25,
    "extraction_time_ms": 2340
  }
}`,
        techRationale: `WHY LIVE DISCOVERY?

1. FRESH DATA WINS DEALS
Batch systems show yesterday's news. Live Discovery shows
what happened THIS MORNING. First mover advantage matters.

2. NO COLD START PROBLEM
New tenants don't need to wait for batch runs. Live Discovery
works immediately - just needs a user request.

3. SUPER ADMIN CONTROL
Product team can tune queries per vertical/region without
code deploys. Add new signal queries in seconds.

4. GRACEFUL FALLBACK
If Live Discovery fails, system falls back to cached data
(if available). User always gets something.

5. COST EFFICIENCY
Only query when user asks. No wasted API calls on companies
no one cares about.`,
        futureCompatibility: `LIVE DISCOVERY ROADMAP:

2025 Q1:
- Multi-source parallel search (SERP + LinkedIn + News)
- Query optimization based on usage analytics

2025 Q2:
- Streaming results (show as they come)
- User-defined custom queries

2025 Q3:
- ML-based query generation
- Cross-region intelligence sharing

2026+:
- Predictive discovery (before user asks)
- Voice-triggered discovery ("SIVA, find me hiring companies")`,
      },
    ],
  },
  {
    id: 'frontend-tech',
    title: 'Module 7: Frontend Technology Stack',
    description: 'Next.js, React, TypeScript, Tailwind, and why each was chosen',
    icon: '🖥️',
    estimatedTime: '60 min',
    difficulty: 'intermediate',
    category: 'technical',
    topics: [
      {
        id: 'nextjs-choice',
        title: 'Why Next.js 14?',
        content: 'Next.js 14 with App Router provides server components, streaming, and optimal performance. It was chosen over alternatives like Remix, Vite+React, or pure React for specific architectural reasons.',
        keyPoints: [
          'Server Components: Reduce client JS bundle',
          'App Router: File-based routing with layouts',
          'Streaming: Progressive page loading',
          'Edge Runtime: Low-latency API routes',
          'Vercel deployment: Seamless scaling',
        ],
        techRationale: `Why Next.js over alternatives?

CONSIDERED: Vite + React
Rejected because: No SSR out of box, more manual setup

CONSIDERED: Remix
Rejected because: Smaller ecosystem, less Vercel integration

CONSIDERED: Pure React (CRA)
Rejected because: No SSR, poor SEO, slower initial load

CHOSEN: Next.js 14
Reasons:
1. Server Components reduce client bundle by 40%
2. App Router enables better code organization
3. Built-in image optimization
4. Middleware for auth/protection
5. Vercel deployment is 1-click

NEXT.JS 14 SPECIFIC FEATURES WE USE:
- Server Actions (form handling)
- Parallel Routes (modal patterns)
- Intercepting Routes (deep links)
- generateMetadata (SEO)
- Route Handlers (API endpoints)`,
        futureCompatibility: `Next.js roadmap aligns with SIVA:
- Server Components = Less JS to devices
- Edge Runtime = Voice device support
- Partial Prerendering = Faster perceived performance

By 2030, Next.js will likely support:
- WebGPU for AI on client
- Better streaming for voice UI
- Native mobile via React Native integration`,
        codeExample: `// Next.js 14 Server Component Example
// app/dashboard/page.tsx

export default async function DashboardPage() {
  // This runs on server - no client JS
  const priorities = await getSIVAPriorities();

  return (
    <main>
      <h1>Your Dashboard</h1>
      {/* Client component for interactivity */}
      <SIVAChat initialPriorities={priorities} />
    </main>
  );
}

// Only SIVAChat ships JS to client
// Data fetching happens on server`,
      },
      {
        id: 'state-management',
        title: 'Zustand for State Management',
        content: 'We use Zustand (not Redux, not Context) for state management. 11 stores handle different domains: auth, onboarding, siva, signals, companies, contacts, etc.',
        keyPoints: [
          '11 specialized stores',
          'No boilerplate like Redux',
          'Better than Context for perf',
          'Supports persistence',
          'TypeScript-first',
        ],
        techRationale: `Why Zustand over alternatives?

CONSIDERED: Redux + Redux Toolkit
Rejected because: Too much boilerplate, overkill for our needs

CONSIDERED: React Context
Rejected because: Re-renders entire tree, poor for frequent updates

CONSIDERED: MobX
Rejected because: Magic proxies, harder to debug

CONSIDERED: Jotai/Recoil
Rejected because: Atomic model too granular for our domains

CHOSEN: Zustand
Reasons:
1. Simple API: 3 lines to create store
2. No providers needed
3. Built-in persistence (localStorage)
4. TypeScript inference
5. Supports middleware (logging, devtools)

OUR 11 STORES:
1. authStore - User authentication state
2. onboardingStore - Onboarding progress
3. sivaStore - SIVA conversation state
4. signalsStore - Signal data cache
5. companiesStore - Company data cache
6. contactsStore - Contact data cache
7. preferencesStore - User preferences
8. uiStore - UI state (modals, panels)
9. notificationsStore - Alerts and toasts
10. analyticsStore - Dashboard metrics
11. superAdminStore - Admin-only state`,
        codeExample: `// Zustand store example
// stores/sivaStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SIVAState {
  messages: Message[];
  isLoading: boolean;
  context: SalesContext | null;
  addMessage: (msg: Message) => void;
  setLoading: (loading: boolean) => void;
}

export const useSIVAStore = create<SIVAState>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      context: null,

      addMessage: (msg) => set((state) => ({
        messages: [...state.messages, msg]
      })),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    { name: 'siva-storage' }
  )
);`,
      },
      {
        id: 'tailwind-framer',
        title: 'Tailwind CSS & Framer Motion',
        content: 'Tailwind provides utility-first CSS for rapid development. Framer Motion handles animations for a premium feel. Together they enable fast iteration without sacrificing quality.',
        keyPoints: [
          'Tailwind: Utility-first CSS',
          'No custom CSS files needed',
          'Framer Motion: Declarative animations',
          'AnimatePresence for exit animations',
          'Production-ready performance',
        ],
        techRationale: `Why Tailwind?

CONSIDERED: CSS Modules
Rejected because: Still need to write CSS, naming overhead

CONSIDERED: Styled Components
Rejected because: Runtime CSS-in-JS, larger bundle

CONSIDERED: Emotion
Rejected because: Same issues as Styled Components

CHOSEN: Tailwind CSS
Reasons:
1. No context switching (stay in JSX)
2. Built-in design system (spacing, colors)
3. PurgeCSS removes unused (tiny bundle)
4. Responsive utilities (sm:, md:, lg:)
5. Dark mode support

Why Framer Motion?

CONSIDERED: CSS Animations
Rejected because: No exit animations, no physics

CONSIDERED: React Spring
Rejected because: More complex API

CHOSEN: Framer Motion
Reasons:
1. Declarative: animate={{ x: 100 }}
2. AnimatePresence for mount/unmount
3. Layout animations built-in
4. Gesture support
5. Server-friendly`,
        codeExample: `// Tailwind + Framer Motion Example
import { motion, AnimatePresence } from 'framer-motion';

function SIVACard({ company, isVisible }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-slate-900 border border-slate-700
                     rounded-xl p-6 hover:border-emerald-500
                     transition-colors"
        >
          <h3 className="text-xl font-bold text-white">
            {company.name}
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            Score: {company.score}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}`,
      },
    ],
  },
  {
    id: 'backend-tech',
    title: 'Module 8: Backend Architecture (UPR OS)',
    description: 'Node.js, PostgreSQL, Neo4j, Cloud Run, and the API layer',
    icon: '⚙️',
    estimatedTime: '90 min',
    difficulty: 'advanced',
    category: 'technical',
    prerequisites: ['Module 5: SIVA OS Kernel'],
    topics: [
      {
        id: 'upr-os-overview',
        title: 'UPR OS Overview',
        content: 'UPR OS is the backend operating system that powers SIVA. It handles all intelligence operations: discovery, enrichment, scoring, ranking, and outreach generation. It runs on Google Cloud Run with auto-scaling.',
        keyPoints: [
          'Node.js + Express backend',
          'PostgreSQL (130+ tables)',
          'Neo4j for knowledge graph',
          'LLM Router for multi-model AI',
          'Deployed on Google Cloud Run',
        ],
        techRationale: `Why this stack?

NODE.JS + EXPRESS
Reasons:
1. Same language as frontend (TypeScript)
2. Excellent async performance
3. Huge package ecosystem
4. Team familiarity

POSTGRESQL
Reasons:
1. ACID compliance
2. Row-level security for multi-tenancy
3. JSONB for flexible schemas
4. Full-text search built-in

NEO4J (Knowledge Graph)
Reasons:
1. Native graph queries
2. Relationship-first data model
3. Fast traversals for "who knows who"
4. SIVA Search powered by graph

CLOUD RUN
Reasons:
1. Auto-scaling to zero
2. Container-based (portable)
3. VPC connector for security
4. Global regions`,
        deepDive: `UPR OS Architecture:

┌─────────────────────────────────────────────┐
│                  UPR OS                       │
├─────────────────────────────────────────────┤
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │           API LAYER (Express)           │ │
│  │  /api/os/discovery  /api/os/score       │ │
│  │  /api/os/enrich     /api/os/rank        │ │
│  │  /api/agent-core/v1/tools/:toolName     │ │
│  └─────────────────────────────────────────┘ │
│                     │                         │
│  ┌─────────────────────────────────────────┐ │
│  │         SERVICE LAYER                   │ │
│  │  DiscoveryService   EnrichmentService   │ │
│  │  ScoringService     RankingService      │ │
│  │  OutreachService    PersonaService      │ │
│  └─────────────────────────────────────────┘ │
│                     │                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │PostgreSQL│ │  Neo4j   │ │  LLM Router  │ │
│  │(130 tabs)│ │ (Graph)  │ │(Claude/Gemini│ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│                                               │
└─────────────────────────────────────────────┘`,
        futureCompatibility: `By 2030, UPR OS will:
- Support 10M+ queries/day
- Run on edge nodes for low latency
- Use SLM (Small Language Models) for cost efficiency
- Serve multiple global regions
- Handle real-time streaming responses`,
      },
      {
        id: 'api-contracts',
        title: 'API Contracts & Routes',
        content: 'UPR OS exposes RESTful APIs for all operations. Core routes handle discovery, enrichment, scoring, ranking, and outreach. SIVA tools have their own endpoint pattern.',
        keyPoints: [
          '/api/os/discovery - Find companies with signals',
          '/api/os/enrich - Get detailed company/contact data',
          '/api/os/score - Calculate QTLE scores',
          '/api/os/rank - Order by priority profile',
          '/api/agent-core/v1/tools/:toolName - Individual tools',
        ],
        deepDive: `API Route Details:

POST /api/os/discovery
Purpose: Find companies matching criteria
Input: { vertical, subVertical, region, filters }
Output: { companies: [...], signals: [...] }

POST /api/os/enrich
Purpose: Get detailed company data
Input: { company_id, fields: ['contacts', 'signals'] }
Output: { company: {...}, contacts: [...], signals: [...] }

POST /api/os/score
Purpose: Calculate QTLE score
Input: { company_id, salesContext }
Output: { q, t, l, e, composite, tier }

POST /api/os/rank
Purpose: Rank companies by priority
Input: { company_ids: [...], profile: 'aggressive' }
Output: { ranked: [...] }

POST /api/agent-core/v1/tools/:toolName
Purpose: Execute individual SIVA tool
Input: { ...tool-specific params, salesContext }
Output: { ...tool-specific response }

All routes require:
- Authorization: Bearer token
- x-sales-context: Serialized SalesContext`,
        codeExample: `// Example API call
const response = await fetch('/api/os/score', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'x-sales-context': JSON.stringify(salesContext),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    company_id: 'comp_123',
    include_breakdown: true,
  }),
});

const { q_score, t_multiplier, composite, tier } = await response.json();`,
      },
      {
        id: 'llm-router',
        title: 'LLM Router & Multi-Model Strategy',
        content: 'The LLM Router intelligently routes requests to different AI models based on complexity, cost, and latency requirements. It supports Claude, Gemini, and will support custom SLMs.',
        keyPoints: [
          'Multi-model support: Claude, Gemini, GPT',
          'Smart routing based on task type',
          'Fallback handling',
          'Cost optimization',
          'Future: Custom SLM for sales',
        ],
        deepDive: `LLM Router Logic:

TASK TYPE → MODEL SELECTION

Simple classification:
→ Gemini Flash (cheap, fast)

Complex reasoning:
→ Claude 3.5 Sonnet (balanced)

Creative generation:
→ Claude 3 Opus (quality)

Code generation:
→ Gemini Ultra / Claude

COST OPTIMIZATION:
- Cache frequent queries
- Batch similar requests
- Use smaller models when possible
- Track cost per query

FALLBACK CHAIN:
Primary: Claude 3.5 Sonnet
Fallback 1: Gemini Pro
Fallback 2: GPT-4
Emergency: Cached response`,
        techRationale: `Why multi-model?

1. NO VENDOR LOCK-IN
If Claude has outage, route to Gemini

2. COST OPTIMIZATION
Simple tasks → cheap models
Complex tasks → premium models

3. SPECIALIZATION
Some models better at certain tasks

4. FUTURE SLM
Custom fine-tuned model for sales
Will be primary for common queries
Fall back to Claude for edge cases`,
        futureCompatibility: `SLM Roadmap (Phase 4-5):

2026: Collect sales conversation corpus
2027: Fine-tune SLM-1B (basics)
2027: Deploy SLM-3B (complex queries)
2028: SLM-7B (multi-turn reasoning)
2029: SLM-13B (near-Claude quality)
2030: Open-source sales SLM

Benefits:
- 90% cost reduction
- 10x faster responses
- On-device for voice hardware
- Custom sales vocabulary`,
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // INTELLIGENCE MODULES (9-12)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'personas-packs',
    title: 'Module 9: Personas & Intelligence Packs',
    description: 'How SIVA\'s behavior is configured per sub-vertical',
    icon: '🎭',
    estimatedTime: '90 min',
    difficulty: 'advanced',
    category: 'intelligence',
    prerequisites: ['Module 2: The Vertical Model'],
    topics: [
      {
        id: 'persona-definition',
        title: 'What is a Persona?',
        content: 'A persona is NOT a prompt template. It\'s a complete behavioral ruleset that controls how SIVA thinks, speaks, and acts for a specific sub-vertical. Each sub-vertical has its own unique persona.',
        keyPoints: [
          'Persona = Complete behavioral configuration',
          'Stored per sub-vertical (NOT per vertical)',
          'Controls: tone, vocabulary, boundaries, compliance',
          'Includes: edge cases, timing rules, contact priority',
          'EB persona ≠ Corporate Banking persona',
        ],
        deepDive: `Persona Components:

interface Persona {
  // IDENTITY
  identity: string;  // "You are an Employee Banking specialist..."
  mission: string;   // "Help users win payroll accounts..."
  tone: "professional" | "friendly" | "aggressive" | "consultative";

  // EDGE CASES
  edgeCases: {
    name: string;           // "Enterprise Brand Exclusion"
    condition: string;      // "company.brand in [Emirates, ADNOC]"
    action: "boost" | "block" | "modify";
    modifier?: number;      // 0.1 (reduce by 90%)
    reason: string;         // "Too big, won't switch banks"
  }[];

  // TIMING RULES
  timingRules: {
    name: string;           // "Ramadan Sensitivity"
    condition: string;      // "calendar.isRamadan"
    bestTime: string;       // "After Iftar"
    worstTime: string;      // "During fasting hours"
  }[];

  // CONTACT PRIORITY
  contactPriority: {
    role: string;           // "HR Director"
    priority: 1;            // 1 = highest
    reason: string;         // "Decision maker for payroll"
  }[];

  // OUTREACH DOCTRINE
  outreachDoctrine: {
    channel: string;        // "email"
    doAlways: string[];     // ["Reference signal", "Keep short"]
    neverDo: string[];      // ["Cold pitch", "Promise rates"]
  }[];

  // ANTI-PATTERNS
  antiPatterns: string[];   // ["Never discuss credit products"]
}`,
        techRationale: `Why persona per sub-vertical?

EB salesperson → "I need HR Directors at growing companies"
Corporate Banking → "I need CFOs at large enterprises"

Same vertical (Banking), completely different:
- Contact targets
- Signal relevance
- Scoring weights
- Outreach approach

Storing at sub-vertical allows maximum customization.
This is the "No Hardcode Doctrine" in practice.`,
      },
      {
        id: 'pack-hierarchy',
        title: 'Intelligence Pack Hierarchy',
        content: 'Intelligence Packs are knowledge capsules that merge hierarchically. Vertical Pack (base) + Sub-Vertical Pack (specific) + Region Pack (local) = Final Pack. Region overrides Sub-Vertical overrides Vertical.',
        keyPoints: [
          'Vertical Pack: Entity target, signal types, base scoring',
          'Sub-Vertical Pack: Persona, decision chains, edge cases',
          'Region Pack: Tone, compliance, timing (Ramadan)',
          'Merge order: VP → SVP → RP (Region highest priority)',
          'All configurable via Super Admin',
        ],
        deepDive: `Pack Hierarchy Visualization:

┌─────────────────────────────────────────────────┐
│                  FINAL PACK                       │
│  (Merged from all three levels)                  │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │          REGION PACK (UAE)                   │ │
│  │  • Ramadan timing rules                      │ │
│  │  • Arabic greeting options                   │ │
│  │  • UAE compliance requirements               │ │
│  │  Priority: HIGHEST (overrides below)         │ │
│  └─────────────────────────────────────────────┘ │
│                      ↓ inherits                   │
│  ┌─────────────────────────────────────────────┐ │
│  │      SUB-VERTICAL PACK (Employee Banking)   │ │
│  │  • EB-specific persona                       │ │
│  │  • Contact priority: HR Director first       │ │
│  │  • Edge cases: Block enterprise brands       │ │
│  │  Priority: MEDIUM                            │ │
│  └─────────────────────────────────────────────┘ │
│                      ↓ inherits                   │
│  ┌─────────────────────────────────────────────┐ │
│  │         VERTICAL PACK (Banking)             │ │
│  │  • Entity target: Companies                  │ │
│  │  • Signal types: hiring, funding, etc.       │ │
│  │  • Base scoring weights                      │ │
│  │  Priority: LOWEST (base layer)               │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└─────────────────────────────────────────────────┘

Merge Algorithm:
finalPack = {
  ...verticalPack,
  ...subVerticalPack,  // Overrides vertical
  ...regionPack,        // Overrides both
}`,
      },
      {
        id: 'self-healing-packs',
        title: 'Self-Healing Packs',
        content: 'Intelligence Packs can detect when they\'re drifting from optimal performance. They propose improvements, which are reviewed by Super Admin. This is SIVA\'s self-evolving capability.',
        keyPoints: [
          'Detects scoring drift (predictions vs outcomes)',
          'Identifies unused edge cases',
          'Suggests new signal types',
          'Proposes persona adjustments',
          'All changes require Super Admin approval',
        ],
        deepDive: `Self-Healing Process:

1. DETECTION
SIVA monitors:
- Conversion rates by signal type
- Edge case hit rates
- Timing rule effectiveness
- Contact tier success rates

2. ANALYSIS
When metrics drift >15% from baseline:
- Identify root cause
- Generate hypothesis
- Propose fix

3. PROPOSAL
SIVA generates pack update proposal:
{
  type: "scoring_weight_adjustment",
  current: { hiring_signal: 0.25 },
  proposed: { hiring_signal: 0.30 },
  reason: "Hiring signals showing 30% higher conversion",
  evidence: [... data points ...]
}

4. APPROVAL
Super Admin reviews:
- Accept → Pack updated
- Reject → Logged for future
- Modify → Adjust and apply

5. DEPLOYMENT
Approved changes:
- Versioned (can rollback)
- A/B tested (10% traffic first)
- Monitored for 7 days
- Full rollout if positive`,
        futureCompatibility: `By 2030, self-healing will:
- Operate with minimal human review
- Predict drift before it happens
- Auto-generate new personas for emerging sub-verticals
- Learn from cross-tenant patterns (anonymized)
- Continuously optimize scoring models`,
      },
    ],
  },
  {
    id: 'multi-agent',
    title: 'Module 10: Multi-Agent AI Orchestration',
    description: 'The 11 AI departments that supervise and govern SIVA',
    icon: '🤖',
    estimatedTime: '60 min',
    difficulty: 'expert',
    category: 'intelligence',
    prerequisites: ['Module 5: SIVA OS Kernel'],
    topics: [
      {
        id: 'ai-company-model',
        title: 'The AI Company Model',
        content: 'Super Admin is NOT a dashboard. It\'s a virtual company where AI agents manage the platform. Think of it as building a 300-person company with AI, where each department has specific responsibilities.',
        keyPoints: [
          '11 AI departments with clear responsibilities',
          'Departments can be upgraded independently',
          'Clear audit trail for decisions',
          'Disagreements escalate to Founder AI',
          'Phase 1: Simplified. Phase 3: Full orchestration',
        ],
        deepDive: `The AI Company Structure:

┌─────────────────────────────────────────────────┐
│            PREMIUMRADAR AI COMPANY               │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │            AI FOUNDER BRAIN                  │ │
│  │    (What should we prioritize?)              │ │
│  └─────────────────────────────────────────────┘ │
│                       │                           │
│     ┌─────────────────┼─────────────────┐        │
│     ↓                 ↓                 ↓        │
│  ┌──────┐         ┌──────┐         ┌──────┐     │
│  │AI CTO│         │AI CRO│         │AI CISO     │
│  │(Tech)│         │(Rev) │         │(Security)  │
│  └──────┘         └──────┘         └──────┘     │
│     │                 │                 │        │
│     ↓                 ↓                 ↓        │
│  ┌──────┐         ┌──────┐         ┌──────┐     │
│  │AI QA │         │AI Sales         │AI Data    │
│  │(Qual)│         │Coach │         │Science     │
│  └──────┘         └──────┘         └──────┘     │
│     │                 │                 │        │
│     ↓                 ↓                 ↓        │
│  ┌──────┐         ┌──────┐         ┌──────┐     │
│  │AI PM │         │AI Mkt│         │AI CS  │    │
│  │(Road)│         │(GTM) │         │(Churn)│    │
│  └──────┘         └──────┘         └──────┘     │
│     │                                            │
│     ↓                                            │
│  ┌──────┐                                        │
│  │AI CFO│                                        │
│  │(Cost)│                                        │
│  └──────┘                                        │
│                                                   │
└─────────────────────────────────────────────────┘`,
      },
      {
        id: 'ai-departments',
        title: 'The 11 AI Departments',
        content: 'Each department has ONE clear responsibility. They monitor, analyze, and propose improvements within their domain. Human oversight approves major changes.',
        keyPoints: [
          'AI Founder: Vision, 12 Laws protection, tie-breaker',
          'AI CTO: Performance, architecture, scalability',
          'AI CFO: API costs, model routing, unit economics',
          'AI CISO: Security, prompt injection, data leakage',
          'AI QA: Quality, hallucination detection, testing',
        ],
        deepDive: `All 11 Departments:

1. AI FOUNDER BRAIN
Mission: Strategic prioritization
Monitors: North star metrics, 12 Laws compliance
Decides: Priority when departments disagree

2. AI CTO
Mission: Technology health
Monitors: P95 latency, error rates, scale readiness
Actions: Propose architecture changes, flag bottlenecks

3. AI CFO
Mission: Unit economics
Monitors: Cost per query, API spend, margins
Actions: Optimize model routing, flag expensive patterns

4. AI CISO
Mission: Security & compliance
Monitors: Prompt injection attempts, data access
Actions: Block threats, audit access patterns

5. AI QA
Mission: Quality assurance
Monitors: Hallucination rate, citation accuracy
Actions: Flag bad outputs, propose pack fixes

6. AI DATA SCIENTIST
Mission: Model health
Monitors: Scoring drift, conversion patterns
Actions: Retrain triggers, feature importance

7. AI CRO
Mission: Revenue optimization
Monitors: Conversion rates, churn signals
Actions: Propose upsell triggers, pricing insights

8. AI SALES COACH
Mission: User performance
Monitors: Individual usage patterns, success rates
Actions: Coaching suggestions, best practice sharing

9. AI PM
Mission: Roadmap alignment
Monitors: Feature usage, user requests
Actions: Priority recommendations, sunset candidates

10. AI MARKETING
Mission: Growth optimization
Monitors: Acquisition costs, content performance
Actions: Landing page suggestions, positioning insights

11. AI CS
Mission: Customer success
Monitors: Friction points, support patterns
Actions: Proactive outreach triggers, churn prediction`,
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // BUSINESS & OPERATIONS MODULES (11-14)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'multi-tenancy',
    title: 'Module 11: Multi-Tenancy Architecture',
    description: 'Data isolation, customization, and tenant management',
    icon: '🏢',
    estimatedTime: '45 min',
    difficulty: 'intermediate',
    category: 'operations',
    topics: [
      {
        id: 'tenant-isolation',
        title: 'Tenant Data Isolation',
        content: 'Every tenant\'s data is completely isolated. ADCB cannot see Emirates NBD\'s leads. Individual users cannot see tenant data. Isolation is enforced at database query level using row-level security.',
        keyPoints: [
          'Row-level security in PostgreSQL',
          'tenant_id filter on every query',
          'Individual users are "tenants of one"',
          'Cross-tenant queries only for Super Admin',
          'Audit logs track all data access',
        ],
        deepDive: `Isolation Implementation:

DATABASE LEVEL:
-- Row-level security policy
CREATE POLICY tenant_isolation ON companies
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Every query automatically filtered
SELECT * FROM companies;  -- Only returns tenant's data

API LEVEL:
// Middleware extracts tenant from token
app.use((req, res, next) => {
  const tenant_id = extractTenantFromToken(req);
  req.tenantId = tenant_id;
  pool.query("SET app.tenant_id = $1", [tenant_id]);
  next();
});

APPLICATION LEVEL:
// All queries include tenant filter
const companies = await prisma.company.findMany({
  where: { tenant_id: req.tenantId }
});`,
      },
    ],
  },
  {
    id: 'business-model',
    title: 'Module 12: Business Model & GTM',
    description: 'Pricing, go-to-market strategy, and growth levers',
    icon: '💰',
    estimatedTime: '45 min',
    difficulty: 'beginner',
    category: 'business',
    topics: [
      {
        id: 'pricing-tiers',
        title: 'Pricing Strategy',
        content: 'Three tiers: Individual ($49-99/mo), Team ($199/seat/mo), Enterprise (custom). All tiers get SIVA - the difference is limits, customization, and support.',
        keyPoints: [
          'Individual: $49/month, limited queries',
          'Team: $199/seat/month, team analytics',
          'Enterprise: Custom, unlimited, SSO',
          'Usage-based: Extra queries billed separately',
          'No free tier (value-first positioning)',
        ],
        deepDive: `Pricing Philosophy:

WHY NO FREE TIER:
1. SIVA costs money to run (API calls)
2. Free users don't convert well
3. Positions us as premium/professional
4. Individual at $49 is accessible enough

INDIVIDUAL TIER ($49/mo)
- 500 SIVA queries/month
- 1 vertical, 1 region
- Email support
- Basic analytics

TEAM TIER ($199/seat/mo)
- 2000 SIVA queries/seat/month
- Team workspace
- Team analytics & leaderboards
- Slack integration
- Priority support

ENTERPRISE TIER (Custom)
- Unlimited queries
- Custom vertical configuration
- SSO/SAML
- API access
- Dedicated support
- SLA guarantee`,
      },
      {
        id: 'gtm-strategy',
        title: 'Go-to-Market Strategy',
        content: 'Phase 1: Banking EB UAE only. Prove PMF with one vertical, one region. Only expand when current segment is profitable. Bottom-up motion: Individual → Team → Enterprise.',
        keyPoints: [
          'Phase 1: Banking EB UAE (10 customers)',
          'Validation: >80% weekly active, >$50K ARR',
          'Expansion: Only after PMF confirmed',
          'Motion: Individual → Team → Enterprise',
          'Never add vertical until previous profitable',
        ],
        deepDive: `GTM Phases:

PHASE 1: PROVE (Current)
Target: Banking EB UAE
Goal: 10 paying customers
Metrics: 80% weekly active, <5% churn
Budget: $0 marketing, founder sales only

PHASE 2: EXPAND SUB-VERTICALS
When: Phase 1 metrics hit
Add: Corporate Banking, SME Banking
Same region (UAE), same vertical (Banking)

PHASE 3: ADD VERTICAL
When: Banking UAE at $500K ARR
Add: Insurance vertical
Requires: New personas, new signals

PHASE 4: GEOGRAPHIC EXPANSION
When: UAE at $3M ARR
Add: India, Saudi Arabia
Requires: Regional packs, local compliance

PHASE 5: PLATFORM PLAY
When: $20M ARR
Add: SIVA SDK, marketplace
Third parties build on SIVA`,
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // FUTURE MODULES (13-16)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'slm-roadmap',
    title: 'Module 13: SLM Deep Dive',
    description: 'Our custom Small Language Model strategy for 2030',
    icon: '🧬',
    estimatedTime: '60 min',
    difficulty: 'expert',
    category: 'future',
    prerequisites: ['Module 8: Backend Architecture'],
    topics: [
      {
        id: 'why-slm',
        title: 'Why Build a Custom SLM?',
        content: 'Generic LLMs (Claude, GPT) are expensive and slow for common queries. A custom Small Language Model trained on sales conversations will be 90% cheaper and 10x faster while maintaining quality for sales-specific tasks.',
        keyPoints: [
          'Cost: 90% reduction vs Claude/GPT',
          'Speed: 10x faster responses',
          'Quality: Matches Claude for sales tasks',
          'Moat: Competitors can\'t copy our training data',
          'Edge: Can run on voice devices',
        ],
        deepDive: `SLM Progression:

2026: DATA COLLECTION
- Collect sales conversation corpus
- Anonymize and clean data
- Build evaluation benchmarks
- Estimated: 10M+ conversations

2027: SLM-1B
- 1 billion parameters
- Basic query understanding
- Simple prioritization
- Cost: $0.001/query (vs $0.01 Claude)

2027: SLM-3B
- 3 billion parameters
- Complex query handling
- Multi-turn conversations
- Can handle 70% of queries

2028: SLM-7B
- 7 billion parameters
- Near-Claude quality
- Handles 90% of queries
- Fallback to Claude for edge cases

2029: SLM-13B
- 13 billion parameters
- Matches Claude quality
- Full reasoning capabilities
- On-device variants possible

2030: OPEN SOURCE
- Release sales SLM to community
- Create ecosystem lock-in
- Establish SIVA as standard`,
        futureCompatibility: `SLM enables 2030 vision:

1. VOICE HARDWARE
SLM-3B can run on-device for "Hey SIVA"
No cloud latency for common queries

2. COST AT SCALE
5M queries/day × $0.001 = $5K/day
vs Claude: 5M × $0.01 = $50K/day
Savings: $16M/year

3. DATA MOAT
Training data is our unique asset
Competitors can't replicate without users`,
      },
    ],
  },
  {
    id: 'scale-architecture',
    title: 'Module 14: Scale Architecture',
    description: 'How SIVA handles 1M+ users across global regions',
    icon: '🌐',
    estimatedTime: '60 min',
    difficulty: 'expert',
    category: 'future',
    topics: [
      {
        id: 'distributed-intelligence',
        title: 'Distributed Intelligence',
        content: 'At scale, SIVA runs as a distributed system across multiple regions. Each region has its own data residency, model deployment, and latency optimization. The global coordinator ensures consistency.',
        keyPoints: [
          'Multi-region deployment (UAE, EU, US, APAC)',
          'Data residency per region',
          'Local model deployments',
          'Global coordinator for cross-region',
          'Edge caching for common queries',
        ],
        deepDive: `Scale Architecture:

┌─────────────────────────────────────────────────┐
│              GLOBAL COORDINATOR                   │
│  (Model versions, pack sync, routing)            │
└─────────────────────────────────────────────────┘
         │           │           │           │
         ↓           ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
    │  UAE   │  │   EU   │  │   US   │  │  APAC  │
    │ Region │  │ Region │  │ Region │  │ Region │
    ├────────┤  ├────────┤  ├────────┤  ├────────┤
    │• Data  │  │• Data  │  │• Data  │  │• Data  │
    │• Model │  │• Model │  │• Model │  │• Model │
    │• Cache │  │• Cache │  │• Cache │  │• Cache │
    └────────┘  └────────┘  └────────┘  └────────┘

Each region:
- Own PostgreSQL + Neo4j
- Own SLM deployment
- Own CDN edge cache
- Compliant with local laws

Cross-region:
- Pack sync (eventual consistency)
- Model version coordination
- Tenant migration support`,
        futureCompatibility: `By 2030:
- 50+ regional deployments
- Sub-100ms latency globally
- Automatic region selection
- Cross-region disaster recovery
- Edge computing for voice devices`,
      },
    ],
  },
  {
    id: 'security-compliance',
    title: 'Module 15: Security & Compliance',
    description: 'SOC2, GDPR, and security architecture',
    icon: '🔐',
    estimatedTime: '45 min',
    difficulty: 'advanced',
    category: 'operations',
    topics: [
      {
        id: 'security-layers',
        title: 'Security Architecture',
        content: 'Security is implemented at multiple layers: network, application, data, and AI. Each layer has specific controls and monitoring.',
        keyPoints: [
          'Network: VPC, WAF, DDoS protection',
          'Application: Auth0, RBAC, rate limiting',
          'Data: Encryption at rest/transit, RLS',
          'AI: Prompt injection detection, output filtering',
          'Audit: Comprehensive logging, anomaly detection',
        ],
        deepDive: `Security Layers:

NETWORK LAYER
├── Google Cloud VPC
├── Cloud Armor WAF
├── DDoS protection
└── Private VPC connector

APPLICATION LAYER
├── Auth0 authentication
├── JWT token validation
├── Role-based access control
├── Rate limiting per tier
└── Session management

DATA LAYER
├── AES-256 encryption at rest
├── TLS 1.3 in transit
├── Row-level security
├── PII masking in logs
└── Data retention policies

AI LAYER
├── Prompt injection detection
├── Output content filtering
├── Hallucination flagging
├── Bias monitoring
└── Model version control`,
      },
      {
        id: 'compliance-roadmap',
        title: 'Compliance Roadmap',
        content: 'Phase 3 targets SOC2 Type II and GDPR compliance. Enterprise customers require these certifications. The architecture is already designed for compliance.',
        keyPoints: [
          'SOC2 Type II: Phase 3 target',
          'GDPR: Data subject rights, consent',
          'CBUAE: Banking regulations (UAE)',
          'ISO 27001: Future consideration',
          'HIPAA: If we add healthcare vertical',
        ],
      },
    ],
  },
  {
    id: 'roadmap-vision',
    title: 'Module 16: 5-Phase Roadmap to $100M',
    description: 'The complete journey from S133 to S217',
    icon: '🗺️',
    estimatedTime: '45 min',
    difficulty: 'beginner',
    category: 'future',
    topics: [
      {
        id: 'phase-overview',
        title: '5-Phase Overview',
        content: 'The roadmap covers 85 sprints (S133-S217) across 5 phases, taking SIVA from $100K to $100M+ ARR. Each phase has clear goals, metrics, and expansion triggers.',
        keyPoints: [
          'Phase 1 (S133-S152): Launch Ready - $100K ARR',
          'Phase 2 (S153-S167): Intelligence Engine - $500K ARR',
          'Phase 3 (S168-S182): Enterprise Ready - $3M ARR',
          'Phase 4 (S183-S202): Scale & Expand - $20M ARR',
          'Phase 5 (S203-S217): Dominance - $100M+ ARR',
        ],
        deepDive: `Phase Details:

PHASE 1: LAUNCH READY (20 sprints)
S133-S152 | Target: $100K ARR
• Ship MVP to first paying customers
• Banking EB UAE only
• Core SIVA tools working
• Basic dashboard and onboarding

PHASE 2: INTELLIGENCE ENGINE (15 sprints)
S153-S167 | Target: $500K ARR
• SIVA becomes indispensable
• Proactive alerts and briefings
• Knowledge graph v1
• Citations and memory

PHASE 3: ENTERPRISE READY (15 sprints)
S168-S182 | Target: $3M ARR
• SOC2 Type II
• SIVA SDK v1
• Mobile app
• Enterprise SSO

PHASE 4: SCALE & EXPAND (20 sprints)
S183-S202 | Target: $20M ARR
• Insurance vertical
• Real Estate vertical
• SLM v1 training
• HubSpot/Pipedrive integrations

PHASE 5: DOMINANCE (15 sprints)
S203-S217 | Target: $100M+ ARR
• 5 verticals
• SIVA Voice device
• Open-source SLM
• Global regions
• Platform ecosystem`,
      },
    ],
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // MODEL CAPABILITY ROUTING MODULE (S228-S233)
  // Added: December 2025 - Production Go-Live
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'model-routing',
    title: 'Module 16: Model Capability Routing',
    description: 'How SIVA routes to models without knowing model names - enforcing PRD v1.2 Laws 1 (Authority), 2 (Persona is Policy), 4 (Explainability), 5 (Replay)',
    icon: '🔀',
    estimatedTime: '45 min',
    difficulty: 'advanced',
    category: 'architecture',
    topics: [
      {
        id: 'capability-abstraction',
        title: 'The Capability Abstraction',
        content: 'SIVA never sees model names. SIVA only requests capabilities like "summarize_fast" or "reason_deep". The OS Model Router selects the best model based on cost, latency, and quality constraints. This is the key insight that makes AI commoditized.',
        analogy: 'Think of a power grid. Your devices don\'t know or care which power plant generated the electricity. They just request "power" and the grid delivers it from the best available source. Similarly, SIVA requests "reasoning capability" and the OS delivers it from the best available model.',
        keyPoints: [
          'SIVA never sees model names (gpt-4o, claude-3, etc.)',
          '6 core capabilities: summarize_fast, reason_deep, classify_cheap, extract_structured, draft_safe, chat_low_risk',
          'Each capability has: latency_class, risk_class, replay_tolerance',
          'Model Router selects model based on: 50% stability, 30% cost, 20% latency',
          'When a new model launches, OS gets the upgrade for free',
        ],
        deepDive: `The Capability Registry (os_model_capabilities) defines what SIVA can request:

CAPABILITY          | LATENCY | RISK   | REPLAY
--------------------|---------|--------|--------
summarize_fast      | low     | low    | relaxed
reason_deep         | high    | medium | strict
classify_cheap      | low     | low    | relaxed
extract_structured  | medium  | low    | strict
draft_safe          | medium  | low    | strict
chat_low_risk       | low     | low    | relaxed

Each model declares which capabilities it supports:
- gpt-4o: all 6 capabilities
- gpt-4o-mini: summarize_fast, classify_cheap, chat_low_risk (cost-optimized)
- claude-3-5-sonnet: reason_deep, extract_structured, draft_safe (quality-optimized)

The genius: SIVA just says "I need reason_deep" and the OS picks the best model.`,
        techRationale: `PRD v1.2 Law 1: "Authority precedes intelligence" - OS decides what SIVA can do.

Why capability abstraction enforces Law 1:
1. MODEL INDEPENDENCE: When GPT-5 launches, we flip a config. SIVA doesn't change.
2. COST OPTIMIZATION: Cheap tasks use cheap models. Expensive tasks use premium models.
3. VENDOR INDEPENDENCE: Switch from OpenAI to Anthropic without touching SIVA code.
4. FUTURE-PROOFING: When we train our own SLM, it just becomes another model option.
5. TESTING: Mock any capability without mocking specific model APIs.

SIVA requests capability → OS picks model. Authority flows down.`,
        futureCompatibility: `By 2030:
- 50+ models in the registry
- Automatic A/B testing of model performance
- SLA-based routing (this persona requires 99.9% uptime)
- Cost forecasting per persona per month
- Self-healing: degraded model auto-excluded`,
      },
      {
        id: 'persona-capability-policy',
        title: 'Persona Capability Policy',
        content: 'Each persona has an allowed_capabilities whitelist and forbidden_capabilities blacklist. If SIVA requests a capability not in the whitelist, it gets 403 DENIED. If it\'s in the blacklist, denial wins even if also in whitelist. This is how we control what each persona can do.',
        analogy: 'Think of building access cards. Your keycard only opens certain doors (whitelist). Some doors are marked "NO ENTRY" regardless of your card level (blacklist). The security system doesn\'t negotiate - it denies or allows instantly.',
        keyPoints: [
          'allowed_capabilities: Array of capabilities this persona can use',
          'forbidden_capabilities: Array of capabilities this persona can NEVER use (blacklist wins)',
          'Authorization happens BEFORE routing (deny fast, never invoke SIVA on denial)',
          'Every denial is logged to os_capability_denials for audit',
          'Budget constraints: max_cost_per_call, max_latency_ms',
        ],
        deepDive: `The authorize_capability() function enforces policy:

1. Check if capability_key exists in registry → 403 CAPABILITY_NOT_FOUND
2. Check if capability_key in forbidden_capabilities → 403 IN_FORBIDDEN
3. Check if capability_key in allowed_capabilities → continue
4. Else → 403 NOT_IN_ALLOWED

CRITICAL: Authorization is checked BEFORE model routing.
If denied, SIVA is NEVER invoked. No tokens consumed. No cost.

Example persona policy:
{
  "persona_id": "employee-banking-uae",
  "allowed_capabilities": ["summarize_fast", "classify_cheap", "draft_safe"],
  "forbidden_capabilities": ["reason_deep"],  // Too expensive for this tier
  "max_cost_per_call": 0.01,
  "max_latency_ms": 2000
}`,
        techRationale: `PRD v1.2 Law 2: "Persona is policy, not personality" - Persona defines capability boundaries.

Why persona-based policy enforces Law 2:
1. COST CONTROL: Free tier can't access expensive reasoning
2. COMPLIANCE: Some verticals can't use certain models (data residency)
3. PERFORMANCE: High-volume personas get fast-only capabilities
4. SECURITY: Admin personas get all, user personas get subset
5. A/B TESTING: Roll out new capability to subset of personas first

Persona = policy. Capabilities = boundaries. Authorization before intelligence.`,
      },
      {
        id: 'deterministic-routing',
        title: 'Deterministic Routing',
        content: 'Given the same inputs (capability, persona, envelope), the Model Router ALWAYS selects the same model. This is critical for reproducibility, debugging, and audit trails. No randomness. No "best effort". Same inputs → same model, every single time.',
        analogy: 'Think of a vending machine with fixed prices and stock. If you insert $1.50 and press B7, you always get the same snack. The machine doesn\'t randomly decide. Same input → same output.',
        keyPoints: [
          'Fixed weights: 50% stability_score, 30% cost_weight, 20% latency_weight',
          'All eligible models scored, highest score wins',
          'Ties broken by model_id (deterministic)',
          'Tested: 10 identical requests → same model 10 times',
          'NO randomness, NO load balancing, NO "variety"',
        ],
        deepDive: `Routing Score Formula:

score = (stability_score * 0.5) +
        (100 - cost_rank * 10) * 0.3 +
        (100 - latency_rank * 10) * 0.2

Where:
- stability_score: 0-100 from model config
- cost_rank: 1=cheapest, 2=second cheapest, etc.
- latency_rank: 1=fastest, 2=second fastest, etc.

Example:
gpt-4o-mini: (95 * 0.5) + (90 * 0.3) + (90 * 0.2) = 47.5 + 27 + 18 = 92.5
claude-3-5-haiku: (90 * 0.5) + (80 * 0.3) + (85 * 0.2) = 45 + 24 + 17 = 86

Winner: gpt-4o-mini with score 92.5

This is deterministic. Run it 1000 times, same result.`,
        techRationale: `PRD v1.2 Law 4: "Every output must be explainable or escalated" - No black boxes.
PRD v1.2 Law 5: "If it cannot be replayed, it did not happen" - Determinism required.

Why determinism enforces Laws 4 & 5:
1. DEBUGGING: "Why did SIVA pick this model?" → Run query, see score breakdown
2. AUDIT: Regulators can verify any decision is reproducible
3. TESTING: Automated tests can assert expected model selection
4. REPLAY: Historical interactions can be exactly replayed
5. TRUST: No "AI magic" - everything is explainable

Same inputs → same model. Every time. No exceptions.`,
      },
      {
        id: 'replay-safety',
        title: 'Replay Safety & Deviation Detection',
        content: 'Every routing decision is logged with interaction_id. On replay, the system checks if the original model is still available and eligible. If yes → exact replay. If no → deviation is FLAGGED, not hidden. No silent substitutions ever.',
        analogy: 'Think of a pharmacy filling a prescription. If you come back for a refill, they check: same medication available? same dosage? If the original is discontinued, they don\'t silently substitute - they flag it for pharmacist review.',
        keyPoints: [
          'os_routing_decisions: Append-only log of every decision',
          'interaction_id: Unique ID for replay lookup',
          'resolve_model_for_replay(): Checks if original model still valid',
          'replay_deviation: Boolean flag when model differs',
          'deviation_reason: MODEL_INACTIVE, MODEL_INELIGIBLE, CAPABILITY_CHANGED',
        ],
        deepDive: `The v_routing_decision_audit view shows replay status:

SELECT interaction_id, capability_key, model_slug, replay_status
FROM v_routing_decision_audit;

interaction_id                        | capability     | model        | replay_status
--------------------------------------|----------------|--------------|---------------
a2640925-7eab-48e3-9fc5-8ad5ce7440e3 | summarize_fast | gpt-4o-mini  | REPLAYABLE
089629e5-1bdf-4671-b67c-9e483b159e82 | reason_deep    | claude-3-5   | MODEL_INELIGIBLE

Possible replay_status values:
- REPLAYABLE: Original model still works
- MODEL_INACTIVE: Model was deactivated
- MODEL_INELIGIBLE: Model marked ineligible (maintenance)
- MODEL_DELETED: Model removed from registry
- CAPABILITY_CHANGED: Model no longer supports this capability`,
        techRationale: `PRD v1.2 Law 5: "If it cannot be replayed, it did not happen" - Deterministic replay.

Why replay safety enforces Law 5:
1. COMPLIANCE: Auditors can verify "what happened on March 15th at 2pm"
2. DEBUGGING: Reproduce exact conditions of a problematic interaction
3. REGRESSION: Compare behavior before/after model changes
4. LEGAL: Prove that decisions were made correctly
5. TRUST: No hidden changes, no silent substitutions

Deviation is FLAGGED, never hidden. Replay is law.`,
      },
      {
        id: 'budget-gating',
        title: 'Budget Gating',
        content: 'Persona policies include max_cost_per_call and max_latency_ms. Models exceeding these budgets are EXCLUDED from routing, not just deprioritized. If no model satisfies the budget, routing fails with NO_ELIGIBLE_MODEL rather than silently downgrading.',
        analogy: 'Think of a corporate travel policy. If your limit is $500/night, the booking system won\'t show you $800 hotels at all - they\'re filtered out, not just sorted lower.',
        keyPoints: [
          'max_cost_per_call: Maximum $ per API call for this persona',
          'max_latency_ms: Maximum response time allowed',
          'Models exceeding budget are EXCLUDED, not deprioritized',
          'If no models fit budget → NO_ELIGIBLE_MODEL error (hard failure)',
          'No silent downgrades - user must know constraints can\'t be met',
        ],
        deepDive: `Budget enforcement in Model Router:

1. Load persona policy (max_cost_per_call, max_latency_ms)
2. For each model supporting capability:
   - Calculate cost_per_call from input/output token rates
   - If cost > max_cost_per_call → EXCLUDE
   - If avg_latency_ms > max_latency_ms → EXCLUDE
3. If zero models remain → Return NO_ELIGIBLE_MODEL
4. Score and rank remaining models

Example:
Persona: max_cost_per_call = $0.001
Models:
- gpt-4o-mini: $0.000375/call → ELIGIBLE
- gpt-4o: $0.00625/call → EXCLUDED
- claude-3-opus: $0.045/call → EXCLUDED

Result: Only gpt-4o-mini considered. If it\'s down, routing fails.`,
        techRationale: `Why hard failure over silent downgrade?

1. PREDICTABILITY: Users know their cost/latency constraints are enforced
2. ALERTING: Operations team sees budget failures, can adjust
3. NO SURPRISES: Never hit with unexpected bills
4. SLA COMPLIANCE: Can guarantee max latency to enterprise customers
5. TRANSPARENCY: Every constraint visible in logs`,
      },
      {
        id: 'model-radar-ui',
        title: 'Model Radar UI',
        content: 'Super Admin includes a Model Radar dashboard showing all models, their capabilities, eligibility status, and routing decisions. Admins can toggle eligibility but CANNOT override routing decisions. The UI observes, it never controls.',
        analogy: 'Think of air traffic control radar. Controllers can see all planes and their status. They can close runways (toggle eligibility). But they can\'t manually force a plane to land on a specific runway - the autopilot (Model Router) decides based on conditions.',
        keyPoints: [
          'Capability Registry Grid: Shows all 6 capabilities with metadata',
          'Model Table: Shows all models with supported/blocked capabilities',
          'Eligibility Toggle: Admin can mark model ineligible (maintenance)',
          'Routing Decision Viewer: Read-only log with filters',
          'NO force_model, NO default_model override - UI observes only',
        ],
        deepDive: `Model Radar Security:

ALLOWED operations:
✅ View capability registry (read-only)
✅ View model list with capabilities (read-only)
✅ Toggle is_eligible (resource control)
✅ View routing decisions (read-only)
✅ Filter by capability, persona, deviation status

BLOCKED operations:
❌ force_model URL param → Ignored
❌ POST to routing-decisions → 405 Method Not Allowed
❌ model_id in authorize-capability body → Ignored
❌ default_model override → 405 Method Not Allowed

The UI is a window, not a door.`,
        techRationale: `PRD v1.2 Law 3: "SIVA never mutates the world" - SIVA interprets, OS acts.
PRD v1.2 Law 4: "Every output must be explainable" - Algorithm decides, not admin.

Why read-only UI enforces Laws 3 & 4:
1. CONSISTENCY: One routing algorithm, no exceptions
2. AUDIT: All decisions explainable by algorithm
3. SECURITY: Can\'t game the system via admin
4. COST CONTROL: Can\'t route expensive tasks to cheap model manually
5. TRUST: "Why this model?" has one answer, always

The UI is a window, not a door. Observe, never control.`,
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
