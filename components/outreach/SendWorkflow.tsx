/**
 * Send Workflow Component
 *
 * Complete workflow for composing, previewing, scheduling, and sending outreach.
 */

'use client';

import { useState } from 'react';
import {
  useOutreachWorkflowStore,
  getStageInfo,
  getWorkflowProgress,
  formatScheduledTime,
  getDeliveryStatusInfo,
  getChannelInfo,
  type OutreachRecipient,
  type OutreachChannel,
} from '@/lib/outreach';
import { OutreachPreview } from './OutreachPreview';

interface SendWorkflowProps {
  recipient: OutreachRecipient;
  onComplete?: () => void;
  onCancel?: () => void;
}

export function SendWorkflow({ recipient, onComplete, onCancel }: SendWorkflowProps) {
  const {
    workflow,
    goToPreview,
    goToSchedule,
    goBack,
    setStage,
    scheduleMessage,
    sendNow,
    sendScheduled,
    resetWorkflow,
  } = useOutreachWorkflowStore();

  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduleReason, setScheduleReason] = useState('');

  const stageInfo = getStageInfo(workflow.currentStage);
  const progress = getWorkflowProgress(workflow.currentStage);

  const handlePreview = () => {
    if (workflow.draft) {
      goToPreview(workflow.draft.id);
    }
  };

  const handleSchedule = () => {
    if (scheduleDate && scheduleTime) {
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`);
      scheduleMessage(scheduledFor, Intl.DateTimeFormat().resolvedOptions().timeZone, scheduleReason);
      setStage('confirm');
    }
  };

  const handleSendNow = async () => {
    await sendNow();
  };

  const handleSendScheduled = async () => {
    await sendScheduled();
  };

  const handleReset = () => {
    resetWorkflow();
    onCancel?.();
  };

  const handleDone = () => {
    resetWorkflow();
    onComplete?.();
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {stageInfo.icon} {stageInfo.label}
          </h2>
          <span className="text-sm text-gray-500">{progress}% complete</span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage Description */}
        <p className="text-sm text-gray-500 mt-2">{stageInfo.description}</p>
      </div>

      {/* Stage Content */}
      {workflow.currentStage === 'compose' && (
        <SimpleComposeStep
          recipient={recipient}
          onPreview={handlePreview}
          onCancel={onCancel}
        />
      )}

      {workflow.currentStage === 'preview' && (
        <OutreachPreview
          onEdit={() => setStage('compose')}
          onSchedule={() => setStage('schedule')}
          onSendNow={() => setStage('confirm')}
        />
      )}

      {workflow.currentStage === 'schedule' && (
        <ScheduleView
          scheduleDate={scheduleDate}
          scheduleTime={scheduleTime}
          scheduleReason={scheduleReason}
          onDateChange={setScheduleDate}
          onTimeChange={setScheduleTime}
          onReasonChange={setScheduleReason}
          onBack={() => setStage('preview')}
          onSchedule={handleSchedule}
        />
      )}

      {workflow.currentStage === 'confirm' && (
        <ConfirmView
          onBack={goBack}
          onSend={workflow.schedule ? handleSendScheduled : handleSendNow}
        />
      )}

      {workflow.currentStage === 'sending' && <SendingView />}

      {workflow.currentStage === 'sent' && (
        <SentView onDone={handleDone} onNewOutreach={handleReset} />
      )}

      {workflow.currentStage === 'failed' && (
        <FailedView
          error={workflow.sendResult?.error}
          onRetry={handleSendNow}
          onCancel={handleReset}
        />
      )}
    </div>
  );
}

function ScheduleView({
  scheduleDate,
  scheduleTime,
  scheduleReason,
  onDateChange,
  onTimeChange,
  onReasonChange,
  onBack,
  onSchedule,
}: {
  scheduleDate: string;
  scheduleTime: string;
  scheduleReason: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onReasonChange: (reason: string) => void;
  onBack: () => void;
  onSchedule: () => void;
}) {
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Schedule Send</h3>
        <p className="text-sm text-gray-500">Choose the best time to send your message</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Recommended Times */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Recommended Times
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Tomorrow 9 AM', desc: 'Start of business day' },
              { label: 'Tomorrow 2 PM', desc: 'After lunch' },
              { label: 'Next Monday 10 AM', desc: 'Fresh week' },
            ].map((slot, i) => (
              <button
                key={i}
                className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="font-medium text-gray-900 text-sm">{slot.label}</div>
                <div className="text-xs text-gray-500">{slot.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date/Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => onDateChange(e.target.value)}
              min={minDate}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => onTimeChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Reason (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for scheduling (optional)
          </label>
          <input
            type="text"
            value={scheduleReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="e.g., Optimal time for recipient's timezone"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2 text-sm text-gray-600">
          ← Back
        </button>
        <button
          onClick={onSchedule}
          disabled={!scheduleDate}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
        >
          Schedule Message
        </button>
      </div>
    </div>
  );
}

function ConfirmView({
  onBack,
  onSend,
}: {
  onBack: () => void;
  onSend: () => void;
}) {
  const { workflow } = useOutreachWorkflowStore();

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Confirm Send</h3>
        <p className="text-sm text-gray-500">Review and confirm before sending</p>
      </div>

      <div className="p-6">
        <div className="p-4 bg-blue-50 rounded-lg mb-6">
          <p className="text-blue-800">
            {workflow.schedule ? (
              <>
                Your message will be sent on{' '}
                <strong>{formatScheduledTime(workflow.schedule)}</strong>
              </>
            ) : (
              'Your message will be sent immediately.'
            )}
          </p>
        </div>

        {/* Summary */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Recipient:</span>
            <span className="text-gray-900">{workflow.draft?.recipient.domain}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Channel:</span>
            <span className="text-gray-900 capitalize">{workflow.draft?.channel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Message Length:</span>
            <span className="text-gray-900">{workflow.draft?.body.length} characters</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2 text-sm text-gray-600">
          ← Back
        </button>
        <button
          onClick={onSend}
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
        >
          ✓ Confirm & Send
        </button>
      </div>
    </div>
  );
}

function SendingView() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="animate-spin text-4xl mb-4">📤</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Sending Message...</h3>
      <p className="text-gray-500">Please wait while we deliver your message.</p>
    </div>
  );
}

function SentView({
  onDone,
  onNewOutreach,
}: {
  onDone: () => void;
  onNewOutreach: () => void;
}) {
  const { workflow } = useOutreachWorkflowStore();
  const statusInfo = getDeliveryStatusInfo(workflow.sendResult?.deliveryStatus);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-12 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
        <p className="text-gray-500 mb-6">
          Your outreach message has been successfully delivered.
        </p>

        {workflow.sendResult && (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm">
            <span>{statusInfo.icon}</span>
            <span className="text-gray-600">Status: {statusInfo.label}</span>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-4">
        <button
          onClick={onNewOutreach}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Send Another
        </button>
        <button
          onClick={onDone}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function FailedView({
  error,
  onRetry,
  onCancel,
}: {
  error?: string;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
      <div className="p-12 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Send Failed</h3>
        <p className="text-gray-500 mb-4">We couldn't deliver your message.</p>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg inline-block">
            {error}
          </p>
        )}
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-4">
        <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600">
          Cancel
        </button>
        <button
          onClick={onRetry}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function SimpleComposeStep({
  recipient,
  onPreview,
  onCancel,
}: {
  recipient: OutreachRecipient;
  onPreview: () => void;
  onCancel?: () => void;
}) {
  const { workflow, updateDraft, startNewOutreach } = useOutreachWorkflowStore();
  const draft = workflow.draft || startNewOutreach(recipient);

  const availableChannels: OutreachChannel[] = [];
  if (recipient.email) availableChannels.push('email');
  if (recipient.linkedIn) availableChannels.push('linkedin');
  if (recipient.phone) availableChannels.push('phone');

  // Default to first available channel if none set
  if (availableChannels.length > 0 && !availableChannels.includes(draft.channel)) {
    updateDraft(draft.id, { channel: availableChannels[0] });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Compose Message</h3>
        <p className="text-sm text-gray-500">Reaching out to {recipient.domain}</p>
      </div>

      {/* Channel Selection */}
      <div className="px-6 py-4 border-b border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
        <div className="flex gap-2">
          {availableChannels.map((channel) => {
            const info = getChannelInfo(channel);
            return (
              <button
                key={channel}
                onClick={() => updateDraft(draft.id, { channel })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  draft.channel === channel
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{info.icon}</span>
                {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject for email */}
      {draft.channel === 'email' && (
        <div className="px-6 py-4 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input
            type="text"
            value={draft.subject || ''}
            onChange={(e) => updateDraft(draft.id, { subject: e.target.value })}
            placeholder="Email subject..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Message Body */}
      <div className="px-6 py-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
        <textarea
          value={draft.body}
          onChange={(e) => updateDraft(draft.id, { body: e.target.value })}
          placeholder="Write your message..."
          rows={8}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="text-xs text-gray-400 mt-1">{draft.body.length} characters</div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600">
            Cancel
          </button>
        )}
        <button
          onClick={onPreview}
          disabled={draft.body.length < 10}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          Preview →
        </button>
      </div>
    </div>
  );
}
