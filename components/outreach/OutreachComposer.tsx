'use client';

/**
 * Outreach Composer Component
 *
 * Wizard-style outreach message builder with AI assistance.
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChannelSelector } from './ChannelSelector';
import type {
  OutreachChannel,
  BankingPersona,
  OutreachTemplate,
  ToneStyle,
  ComposerState,
} from '@/lib/outreach/types';
import {
  BANKING_TEMPLATES,
  getMatchingTemplates,
  fillTemplate,
  getRecommendedTone,
  analyzeTone,
} from '@/lib/outreach';
import type { CompanyProfile, BankingCompanyProfile, Signal } from '@/lib/scoring/types';

interface OutreachComposerProps {
  company: CompanyProfile | BankingCompanyProfile;
  signals: Signal[];
  onSend?: (message: { channel: OutreachChannel; subject?: string; body: string }) => void;
  onCancel?: () => void;
}

const personas: { id: BankingPersona; label: string; icon: string }[] = [
  { id: 'cto', label: 'CTO', icon: '👨‍💻' },
  { id: 'cio', label: 'CIO', icon: '📊' },
  { id: 'cdo', label: 'CDO', icon: '📈' },
  { id: 'head-of-digital', label: 'Head of Digital', icon: '🌐' },
  { id: 'head-of-innovation', label: 'Head of Innovation', icon: '💡' },
  { id: 'procurement', label: 'Procurement', icon: '📋' },
  { id: 'vp-technology', label: 'VP Technology', icon: '🎯' },
];

const toneOptions: { id: ToneStyle; label: string; description: string }[] = [
  { id: 'formal', label: 'Formal', description: 'Traditional business communication' },
  { id: 'professional', label: 'Professional', description: 'Balanced and polished' },
  { id: 'conversational', label: 'Conversational', description: 'Friendly but business-focused' },
  { id: 'friendly', label: 'Friendly', description: 'Casual and approachable' },
];

const steps = ['channel', 'persona', 'template', 'customize', 'review'] as const;

export function OutreachComposer({ company, signals, onSend, onCancel }: OutreachComposerProps) {
  const [state, setState] = useState<ComposerState>({
    step: 'channel',
    channel: null,
    persona: null,
    template: null,
    customizations: {
      body: '',
      tone: 'professional',
    },
    variables: {
      company_name: company.name,
      sender_name: 'Your Name', // Would come from user profile
    },
  });

  const currentStepIndex = steps.indexOf(state.step);

  const matchingTemplates = useMemo(() => {
    if (!state.channel) return [];
    const signalTypes = signals.map((s) => s.id);
    return getMatchingTemplates(signalTypes, state.channel, state.persona || undefined);
  }, [state.channel, state.persona, signals]);

  const filledTemplate = useMemo(() => {
    if (!state.template) return null;
    return fillTemplate(state.template, state.variables);
  }, [state.template, state.variables]);

  const toneAnalysis = useMemo(() => {
    if (!state.customizations.body) return null;
    return analyzeTone(state.customizations.body);
  }, [state.customizations.body]);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setState((s) => ({ ...s, step: steps[nextIndex] }));
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setState((s) => ({ ...s, step: steps[prevIndex] }));
    }
  };

  const handleSelectChannel = (channel: OutreachChannel) => {
    setState((s) => ({ ...s, channel }));
  };

  const handleSelectPersona = (persona: BankingPersona) => {
    const recommendedTone = getRecommendedTone(persona);
    setState((s) => ({
      ...s,
      persona,
      customizations: { ...s.customizations, tone: recommendedTone },
    }));
  };

  const handleSelectTemplate = (template: OutreachTemplate) => {
    const filled = fillTemplate(template, state.variables);
    setState((s) => ({
      ...s,
      template,
      customizations: {
        ...s.customizations,
        subject: filled.subject,
        body: filled.body,
      },
    }));
  };

  const handleSend = () => {
    if (state.channel && state.customizations.body) {
      onSend?.({
        channel: state.channel,
        subject: state.customizations.subject,
        body: state.customizations.body,
      });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compose Outreach</h2>
            <p className="text-sm text-gray-500 mt-1">
              Reaching out to {company.name}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mt-4">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${
                    idx <= currentStepIndex
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }
                `}
              >
                {idx + 1}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-12 h-1 mx-1 ${
                    idx < currentStepIndex
                      ? 'bg-blue-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          {/* Step 1: Channel Selection */}
          {state.step === 'channel' && (
            <motion.div
              key="channel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Select Channel</h3>
              <ChannelSelector selected={state.channel} onSelect={handleSelectChannel} />
            </motion.div>
          )}

          {/* Step 2: Persona Selection */}
          {state.step === 'persona' && (
            <motion.div
              key="persona"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Who are you reaching out to?</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {personas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPersona(p.id)}
                    className={`
                      p-4 rounded-lg border-2 text-center transition-all
                      ${
                        state.persona === p.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="text-2xl mb-2">{p.icon}</div>
                    <div className="font-medium text-sm">{p.label}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Template Selection */}
          {state.step === 'template' && (
            <motion.div
              key="template"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>
              {matchingTemplates.length > 0 ? (
                <div className="space-y-3">
                  {matchingTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t)}
                      className={`
                        w-full p-4 rounded-lg border-2 text-left transition-all
                        ${
                          state.template?.id === t.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="font-medium">{t.name}</div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {t.body.substring(0, 100)}...
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No templates match your selection.</p>
                  <button
                    onClick={handleBack}
                    className="mt-2 text-blue-600 hover:underline"
                  >
                    Go back and try different options
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: Customize */}
          {state.step === 'customize' && (
            <motion.div
              key="customize"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Customize Message</h3>

              {/* Tone Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tone
                </label>
                <div className="flex gap-2">
                  {toneOptions.map((t) => (
                    <button
                      key={t.id}
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          customizations: { ...s.customizations, tone: t.id },
                        }))
                      }
                      className={`
                        px-3 py-1.5 rounded-full text-sm transition-all
                        ${
                          state.customizations.tone === t.id
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }
                      `}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject (for email) */}
              {state.channel === 'email' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={state.customizations.subject || ''}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        customizations: { ...s.customizations, subject: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  />
                </div>
              )}

              {/* Body */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  value={state.customizations.body}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      customizations: { ...s.customizations, body: e.target.value },
                    }))
                  }
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
                />
              </div>

              {/* Tone Analysis */}
              {toneAnalysis && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tone Analysis
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Formality</div>
                      <div className="font-medium">{toneAnalysis.formality}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Friendliness</div>
                      <div className="font-medium">{toneAnalysis.friendliness}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Urgency</div>
                      <div className="font-medium">{toneAnalysis.urgency}%</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Professional</div>
                      <div className="font-medium">{toneAnalysis.professionalism}%</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 5: Review */}
          {state.step === 'review' && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-semibold mb-4">Review & Send</h3>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <span className="text-gray-500">Channel:</span>
                  <span className="font-medium capitalize">{state.channel}</span>
                  <span className="text-gray-500">To:</span>
                  <span className="font-medium">{company.name}</span>
                </div>

                {state.customizations.subject && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-1">Subject:</div>
                    <div className="font-medium">{state.customizations.subject}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-500 mb-1">Message:</div>
                  <div className="whitespace-pre-wrap text-sm bg-white dark:bg-gray-800 p-4 rounded border">
                    {state.customizations.body}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStepIndex === 0}
          className={`
            px-4 py-2 rounded-lg font-medium
            ${
              currentStepIndex === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          Back
        </button>

        {state.step === 'review' ? (
          <button
            onClick={handleSend}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
          >
            Send Message
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={
              (state.step === 'channel' && !state.channel) ||
              (state.step === 'persona' && !state.persona) ||
              (state.step === 'template' && !state.template)
            }
            className={`
              px-6 py-2 rounded-lg font-medium
              ${
                (state.step === 'channel' && !state.channel) ||
                (state.step === 'persona' && !state.persona) ||
                (state.step === 'template' && !state.template)
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }
            `}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}

export default OutreachComposer;
