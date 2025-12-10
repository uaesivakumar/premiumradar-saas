'use client';

/**
 * Company Profile Page - S139: Company Profiles
 *
 * Full company profile with:
 * - Company header (logo, name, QTLE score)
 * - Signal history timeline
 * - Key contacts list
 * - Activity timeline
 * - Quick actions (outreach, SIVA analysis)
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MessageSquare,
  Bot,
  Share2,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { CompanyHeader, type CompanyHeaderProps } from '@/components/company/CompanyHeader';
import { SignalHistory, type SignalItem } from '@/components/company/SignalHistory';
import { ContactList, type Contact } from '@/components/company/ContactList';
import { CompanyActivity, type Activity } from '@/components/company/CompanyActivity';

// Tab configuration
type TabId = 'overview' | 'signals' | 'contacts' | 'activity';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'signals', label: 'Signals' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'activity', label: 'Activity' },
];

// Mock data for development - replace with API call
function getMockCompanyData(id: string): {
  company: CompanyHeaderProps['company'];
  score: CompanyHeaderProps['score'];
  signals: SignalItem[];
  contacts: Contact[];
  activities: Activity[];
} {
  return {
    company: {
      id,
      name: 'Emirates Group',
      logo: undefined,
      industry: 'Aviation & Travel',
      description:
        'Emirates Group is a global travel and tourism conglomerate based in Dubai, UAE. It is one of the largest airline holding companies worldwide.',
      website: 'https://www.emirates.com',
      linkedin: 'https://linkedin.com/company/emirates',
      size: 'enterprise',
      headcount: 105000,
      headcountGrowth: 8,
      region: 'UAE',
      city: 'Dubai',
      bankingTier: 'tier1',
      freshness: 'fresh',
    },
    score: {
      total: 87,
      quality: 92,
      timing: 85,
      likelihood: 82,
      engagement: 78,
    },
    signals: [
      {
        id: 's1',
        type: 'hiring-expansion',
        title: 'Major Hiring Initiative',
        description:
          'Emirates announced plans to hire 5,000 new cabin crew members and 1,000 ground staff across global locations.',
        category: 'quality',
        impact: 'positive',
        source: 'Gulf News',
        sourceUrl: 'https://gulfnews.com/emirates-hiring',
        confidence: 95,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        scoreContribution: 12,
      },
      {
        id: 's2',
        type: 'office-opening',
        title: 'New Regional Office',
        description:
          'Emirates opened a new regional headquarters in Singapore to support Asia-Pacific expansion.',
        category: 'timing',
        impact: 'positive',
        source: 'Reuters',
        sourceUrl: 'https://reuters.com/emirates-singapore',
        confidence: 90,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        scoreContribution: 8,
      },
      {
        id: 's3',
        type: 'funding-round',
        title: 'Fleet Expansion Investment',
        description: 'Emirates secured $2.5B financing for 15 new A380 aircraft delivery.',
        category: 'likelihood',
        impact: 'positive',
        source: 'Bloomberg',
        confidence: 88,
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        scoreContribution: 10,
      },
      {
        id: 's4',
        type: 'market-entry',
        title: 'New Route Launch',
        description: 'Emirates launched direct flights to 3 new destinations in South America.',
        category: 'engagement',
        impact: 'positive',
        source: 'Aviation Week',
        confidence: 85,
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        scoreContribution: 6,
      },
    ],
    contacts: [
      {
        id: 'c1',
        name: 'Ahmed Al Maktoum',
        title: 'Chief Financial Officer',
        department: 'Finance',
        email: 'ahmed.maktoum@emirates.com',
        linkedin: 'https://linkedin.com/in/ahmed-maktoum',
        role: 'decision-maker',
        relevanceScore: 95,
        isStarred: true,
      },
      {
        id: 'c2',
        name: 'Sarah Chen',
        title: 'Head of Corporate Banking Relations',
        department: 'Treasury',
        email: 'sarah.chen@emirates.com',
        phone: '+971 4 555 1234',
        linkedin: 'https://linkedin.com/in/sarah-chen',
        role: 'champion',
        relevanceScore: 88,
        lastInteraction: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'c3',
        name: 'Mohammed Hassan',
        title: 'VP Human Resources',
        department: 'HR',
        email: 'm.hassan@emirates.com',
        linkedin: 'https://linkedin.com/in/m-hassan',
        role: 'influencer',
        relevanceScore: 75,
      },
      {
        id: 'c4',
        name: 'Lisa Thompson',
        title: 'Payroll Manager',
        department: 'HR Operations',
        email: 'l.thompson@emirates.com',
        role: 'end-user',
        relevanceScore: 62,
      },
    ],
    activities: [
      {
        id: 'a1',
        type: 'view',
        title: 'Profile viewed',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        user: { name: 'You' },
      },
      {
        id: 'a2',
        type: 'signal_detected',
        title: 'New hiring signal detected',
        description: 'Emirates announced major hiring initiative for 6,000 new employees.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { signalType: 'hiring-expansion' },
      },
      {
        id: 'a3',
        type: 'score_change',
        title: 'QTLE Score increased',
        description: 'Score improved due to new hiring signals.',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { oldScore: 75, newScore: 87 },
      },
      {
        id: 'a4',
        type: 'siva_recommendation',
        title: 'SIVA recommended outreach',
        description:
          'Based on recent hiring signals, SIVA recommends initiating employee banking pitch.',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'a5',
        type: 'outreach_email',
        title: 'Email sent to Sarah Chen',
        description: 'Initial outreach regarding corporate banking services.',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: { name: 'John Smith' },
        metadata: { contactName: 'Sarah Chen' },
      },
      {
        id: 'a6',
        type: 'note',
        title: 'Added internal note',
        description: 'Sarah mentioned interest in payroll services during last meeting.',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        user: { name: 'John Smith' },
      },
    ],
  };
}

export default function CompanyProfilePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string || '';

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReturnType<typeof getMockCompanyData> | null>(null);

  // Fetch company data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/companies/${companyId}`);
        // const result = await response.json();

        // Using mock data for now
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay
        const mockData = getMockCompanyData(companyId);
        setData(mockData);
      } catch (err) {
        console.error('[CompanyProfile] Error:', err);
        setError('Failed to load company data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const handleStartOutreach = (contact: Contact) => {
    // TODO: Navigate to outreach composer with contact pre-filled
    console.log('[Outreach] Starting for:', contact.name);
    router.push(`/dashboard/outreach?companyId=${companyId}&contactId=${contact.id}`);
  };

  const handleSivaAnalysis = () => {
    // TODO: Trigger SIVA analysis
    console.log('[SIVA] Requesting analysis for:', companyId);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-gray-500">Loading company profile...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-gray-900 font-medium mb-2">Failed to load company</p>
        <p className="text-gray-500 mb-4">{error || 'Company not found'}</p>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Discovery</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSivaAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            <Bot className="w-4 h-4" />
            Ask SIVA
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <MessageSquare className="w-4 h-4" />
            Start Outreach
          </button>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Company Header */}
      <CompanyHeader
        company={data.company}
        score={data.score}
        lastUpdated={new Date().toISOString()}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Signals & Contacts Summary */}
            <div className="space-y-6">
              <SignalHistory signals={data.signals.slice(0, 3)} maxVisible={3} />
              <ContactList
                contacts={data.contacts.slice(0, 3)}
                onStartOutreach={handleStartOutreach}
              />
            </div>

            {/* Right Column - Activity */}
            <div>
              <CompanyActivity activities={data.activities} maxVisible={5} />
            </div>
          </div>
        )}

        {activeTab === 'signals' && <SignalHistory signals={data.signals} maxVisible={20} />}

        {activeTab === 'contacts' && (
          <ContactList contacts={data.contacts} onStartOutreach={handleStartOutreach} />
        )}

        {activeTab === 'activity' && (
          <CompanyActivity activities={data.activities} maxVisible={50} />
        )}
      </motion.div>
    </div>
  );
}
