'use client';

/**
 * Output Object Renderer - Sprint S26/S27
 * Renders AI-generated output objects in the result surface
 */

import { motion } from 'framer-motion';
import {
  Pin,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Trophy,
  Send,
  Database,
  Lightbulb,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { OutputObject, useSIVAStore } from '@/lib/stores/siva-store';
import { useIndustryStore, getIndustryConfig } from '@/lib/stores/industry-store';

interface OutputObjectRendererProps {
  object: OutputObject;
}

export function OutputObjectRenderer({ object }: OutputObjectRendererProps) {
  const { togglePinObject, toggleExpandObject, removeOutputObject } = useSIVAStore();
  const { detectedIndustry } = useIndustryStore();
  const industryConfig = getIndustryConfig(detectedIndustry);

  const getIcon = () => {
    switch (object.type) {
      case 'discovery':
        return <Search className="w-5 h-5" />;
      case 'ranking':
        return <Trophy className="w-5 h-5" />;
      case 'outreach':
        return <Send className="w-5 h-5" />;
      case 'insight':
        return <Lightbulb className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getGradient = () => {
    switch (object.type) {
      case 'discovery':
        return 'from-blue-500 to-cyan-500';
      case 'ranking':
        return 'from-amber-500 to-orange-500';
      case 'outreach':
        return 'from-green-500 to-emerald-500';
      case 'insight':
        return 'from-purple-500 to-pink-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const renderContent = () => {
    switch (object.type) {
      case 'discovery':
        return <DiscoveryContent data={object.data} />;
      case 'ranking':
        return <RankingContent data={object.data} />;
      case 'outreach':
        return <OutreachContent data={object.data} />;
      case 'insight':
        return <InsightContent data={object.data} />;
      default:
        return <GenericContent data={object.data} />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className={`bg-slate-800/60 backdrop-blur-sm rounded-2xl border overflow-hidden ${
        object.pinned ? 'border-yellow-500/30' : 'border-white/10'
      }`}
      style={{
        boxShadow: object.pinned
          ? '0 0 20px rgba(234, 179, 8, 0.1)'
          : '0 4px 20px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient()} flex items-center justify-center text-white`}>
            {getIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-white">{object.title}</h3>
            <p className="text-xs text-gray-500">
              {new Date(object.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Pin */}
          <button
            onClick={() => togglePinObject(object.id)}
            className={`p-2 rounded-lg transition-all ${
              object.pinned
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Expand/Collapse */}
          <button
            onClick={() => toggleExpandObject(object.id)}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            {object.expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {/* Remove */}
          <button
            onClick={() => removeOutputObject(object.id)}
            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={false}
        animate={{
          height: object.expanded ? 'auto' : 0,
          opacity: object.expanded ? 1 : 0,
        }}
        className="overflow-hidden"
      >
        <div className="p-4">{renderContent()}</div>
      </motion.div>
    </motion.div>
  );
}

// Discovery Content
function DiscoveryContent({ data }: { data: Record<string, unknown> }) {
  const companies = data.companies as Array<{
    name: string;
    industry: string;
    score: number;
    signal: string;
  }>;

  return (
    <div className="space-y-3">
      {companies?.map((company, i) => (
        <motion.div
          key={company.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
              {company.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-white">{company.name}</p>
              <p className="text-xs text-gray-500">{company.industry}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-sm text-gray-400">{company.signal}</span>
            </div>
            <p className="text-lg font-bold text-white">{company.score}</p>
          </div>
        </motion.div>
      ))}
      <p className="text-xs text-gray-500 text-center">
        {data.totalResults as number} companies found
      </p>
    </div>
  );
}

// Ranking Content
function RankingContent({ data }: { data: Record<string, unknown> }) {
  const rankings = data.rankings as Array<{
    rank: number;
    name: string;
    Q: number;
    T: number;
    L: number;
    E: number;
    total: number;
  }>;

  return (
    <div className="space-y-3">
      {rankings?.map((item, i) => (
        <motion.div
          key={item.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-3 bg-white/5 rounded-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  item.rank === 1
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : item.rank === 2
                    ? 'bg-gray-400/20 text-gray-300'
                    : 'bg-orange-500/20 text-orange-400'
                }`}
              >
                #{item.rank}
              </div>
              <span className="font-medium text-white">{item.name}</span>
            </div>
            <span className="text-2xl font-bold text-white">{item.total}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['Q', 'T', 'L', 'E'].map((letter) => (
              <div key={letter} className="text-center">
                <div className="text-xs text-gray-500 mb-1">{letter}</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      letter === 'Q'
                        ? 'bg-blue-500'
                        : letter === 'T'
                        ? 'bg-purple-500'
                        : letter === 'L'
                        ? 'bg-green-500'
                        : 'bg-orange-500'
                    }`}
                    style={{ width: `${item[letter as keyof typeof item]}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {item[letter as keyof typeof item]}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Outreach Content
function OutreachContent({ data }: { data: Record<string, unknown> }) {
  const { company, channel, subject, body, signals } = data as {
    company: string;
    channel: string;
    subject: string;
    body: string;
    signals: string[];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">
          {channel}
        </span>
        <span className="text-gray-400 text-sm">for</span>
        <span className="font-medium text-white">{company}</span>
      </div>

      {subject && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Subject</p>
          <p className="text-white font-medium">{subject}</p>
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500 mb-1">Message</p>
        <div className="p-3 bg-white/5 rounded-lg text-sm text-gray-300 whitespace-pre-wrap">
          {body}
        </div>
      </div>

      {signals && signals.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Based on:</span>
          {signals.map((signal) => (
            <span
              key={signal}
              className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs"
            >
              {signal}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-all">
          Send Now
        </button>
        <button className="flex-1 py-2 rounded-lg bg-white/5 text-gray-400 text-sm font-medium hover:bg-white/10 transition-all">
          Edit
        </button>
      </div>
    </div>
  );
}

// Insight Content
function InsightContent({ data }: { data: Record<string, unknown> }) {
  const { company, firmographic, decisionMakers, techStack } = data as {
    company: string;
    firmographic: { employees: string; revenue: string; founded: number };
    decisionMakers: string[];
    techStack: string[];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-purple-400" />
        <span className="font-medium text-white">{company}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <p className="text-lg font-bold text-white">{firmographic?.employees}</p>
          <p className="text-xs text-gray-500">Employees</p>
        </div>
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <p className="text-lg font-bold text-white">{firmographic?.revenue}</p>
          <p className="text-xs text-gray-500">Revenue</p>
        </div>
        <div className="p-3 bg-white/5 rounded-lg text-center">
          <p className="text-lg font-bold text-white">{firmographic?.founded}</p>
          <p className="text-xs text-gray-500">Founded</p>
        </div>
      </div>

      {decisionMakers && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Decision Makers</p>
          <div className="space-y-1">
            {decisionMakers.map((dm) => (
              <p key={dm} className="text-sm text-gray-300">
                {dm}
              </p>
            ))}
          </div>
        </div>
      )}

      {techStack && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Tech Stack</p>
          <div className="flex flex-wrap gap-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Generic Content
function GenericContent({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="text-xs text-gray-400 overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default OutputObjectRenderer;
