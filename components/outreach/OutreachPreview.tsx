/**
 * Outreach Preview Component
 *
 * Preview how the outreach message will appear to recipient.
 */

'use client';

import {
  useOutreachWorkflowStore,
  getChannelInfo,
  analyzeTone,
} from '@/lib/outreach';

interface OutreachPreviewProps {
  onEdit: () => void;
  onSchedule: () => void;
  onSendNow: () => void;
}

export function OutreachPreview({ onEdit, onSchedule, onSendNow }: OutreachPreviewProps) {
  const { workflow } = useOutreachWorkflowStore();
  const draft = workflow.draft;

  if (!draft) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No message to preview</p>
      </div>
    );
  }

  const channelInfo = getChannelInfo(draft.channel);
  const toneAnalysis = analyzeTone(draft.body);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Message Preview</h3>
          <p className="text-sm text-gray-500">
            Review how your message will appear
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-lg text-sm ${getChannelBg(draft.channel)}`}>
            {channelInfo.icon} {channelInfo.label}
          </span>
        </div>
      </div>

      {/* Preview Container */}
      <div className="p-6">
        {draft.channel === 'email' ? (
          <EmailPreview
            subject={draft.subject || 'No subject'}
            body={draft.body}
            recipientEmail={draft.recipient.email || 'recipient@example.com'}
          />
        ) : draft.channel === 'linkedin' ? (
          <LinkedInPreview body={draft.body} />
        ) : (
          <GenericPreview body={draft.body} channel={draft.channel} />
        )}
      </div>

      {/* Tone Analysis */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Tone Analysis</h4>
        <div className="grid grid-cols-4 gap-4">
          <ToneMetric label="Formality" value={toneAnalysis.formality / 100} />
          <ToneMetric label="Friendliness" value={toneAnalysis.friendliness / 100} />
          <ToneMetric label="Urgency" value={toneAnalysis.urgency / 100} />
          <ToneMetric label="Professionalism" value={toneAnalysis.professionalism / 100} />
        </div>
      </div>

      {/* Message Stats */}
      <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-6 text-sm text-gray-500">
        <span>{draft.body.length} characters</span>
        <span>{draft.body.split(/\s+/).length} words</span>
        <span>~{Math.ceil(draft.body.length / 200)} min read</span>
        <span className="capitalize">Tone: {draft.tone}</span>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          ← Edit Message
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={onSchedule}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            📅 Schedule
          </button>
          <button
            onClick={onSendNow}
            className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            Send Now →
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailPreview({
  subject,
  body,
  recipientEmail,
}: {
  subject: string;
  body: string;
  recipientEmail: string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Email Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500">To:</span>
          <span className="text-gray-900">{recipientEmail}</span>
        </div>
        <div className="flex items-center gap-3 text-sm mt-1">
          <span className="text-gray-500">Subject:</span>
          <span className="font-medium text-gray-900">{subject}</span>
        </div>
      </div>

      {/* Email Body */}
      <div className="p-4 bg-white">
        <div className="whitespace-pre-wrap text-gray-700 font-sans text-sm leading-relaxed">
          {body}
        </div>
      </div>
    </div>
  );
}

function LinkedInPreview({ body }: { body: string }) {
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        {/* LinkedIn Header */}
        <div className="bg-[#0A66C2] px-4 py-2 flex items-center gap-2">
          <span className="text-white text-lg font-bold">in</span>
          <span className="text-white text-sm">InMail</span>
        </div>

        {/* Message */}
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div>
              <div className="font-medium text-gray-900">You</div>
              <div className="text-xs text-gray-500">PremiumRadar</div>
            </div>
          </div>
          <div className="text-gray-700 text-sm whitespace-pre-wrap">{body}</div>
        </div>
      </div>
      {body.length > 300 && (
        <p className="text-center text-xs text-yellow-600 mt-2">
          ⚠️ Message exceeds LinkedIn InMail character limit
        </p>
      )}
    </div>
  );
}

function WhatsAppPreview({ body }: { body: string }) {
  return (
    <div className="max-w-sm mx-auto">
      <div className="bg-[#E5DDD5] rounded-xl p-4">
        {/* Message Bubble */}
        <div className="bg-[#DCF8C6] rounded-lg p-3 max-w-[80%] ml-auto shadow-sm">
          <div className="text-gray-800 text-sm whitespace-pre-wrap">{body}</div>
          <div className="text-right text-xs text-gray-500 mt-1">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
          </div>
        </div>
      </div>
    </div>
  );
}

function GenericPreview({ body, channel }: { body: string; channel: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-xs text-gray-500 uppercase mb-2">{channel} Message</div>
      <div className="text-gray-700 whitespace-pre-wrap">{body}</div>
    </div>
  );
}

function ToneMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-semibold text-gray-900">{Math.round(value * 100)}%</div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

function getChannelBg(channel: string): string {
  const bgs: Record<string, string> = {
    email: 'bg-blue-100 text-blue-700',
    linkedin: 'bg-indigo-100 text-indigo-700',
    whatsapp: 'bg-green-100 text-green-700',
    sms: 'bg-purple-100 text-purple-700',
    phone: 'bg-orange-100 text-orange-700',
  };
  return bgs[channel] || 'bg-gray-100 text-gray-700';
}
