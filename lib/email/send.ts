/**
 * VS10.4: Email Sending Module
 * Sprint: S1 (VS10)
 *
 * Real email sending using Resend.
 * Supports:
 * - Transactional emails (verification, password reset)
 * - Marketing emails (welcome, onboarding)
 * - Outreach emails (AI-generated sales messages)
 * - Tracking (open, click)
 */

import { Resend } from 'resend';

// ============================================================
// CONFIGURATION
// ============================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'PremiumRadar <noreply@premiumradar.com>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@premiumradar.com';

// Initialize Resend client
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// ============================================================
// TYPES
// ============================================================

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailTrackingEvent {
  type: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained';
  messageId: string;
  recipient: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// In-memory tracking store (use database in production)
const trackingEvents: EmailTrackingEvent[] = [];

// ============================================================
// SEND EMAIL
// ============================================================

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  // Check if Resend is configured
  if (!resend) {
    console.warn('[Email] RESEND_API_KEY not configured - email not sent');
    console.log('[Email] Would have sent:', {
      to: options.to,
      subject: options.subject,
    });

    // In development, log and return success
    if (process.env.NODE_ENV !== 'production') {
      return {
        success: true,
        messageId: `dev_${Date.now()}`,
      };
    }

    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: options.from || FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || REPLY_TO,
      tags: options.tags,
      headers: options.headers,
    });

    if (error) {
      console.error('[Email] Resend error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('[Email] Sent successfully:', {
      messageId: data?.id,
      to: options.to,
      subject: options.subject,
    });

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('[Email] Send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

/**
 * Send welcome email after signup
 */
export async function sendWelcomeEmail(
  to: string,
  name: string,
  vertical: string
): Promise<SendEmailResult> {
  const verticalNames: Record<string, string> = {
    banking: 'Banking',
    insurance: 'Insurance',
    'real-estate': 'Real Estate',
    recruitment: 'Recruitment',
    'saas-sales': 'SaaS Sales',
  };

  return sendEmail({
    to,
    subject: 'Welcome to PremiumRadar - Your AI Sales Intelligence Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome to PremiumRadar</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">AI-Powered Sales Intelligence</p>
          </div>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>Welcome to PremiumRadar! You've joined the future of sales intelligence.</p>
            <p>Your profile has been set up for <strong>${verticalNames[vertical] || vertical}</strong>. SIVA, our AI assistant, is ready to help you discover opportunities and close more deals.</p>
            <h3>What's Next?</h3>
            <ul>
              <li><strong>Complete your profile</strong> - Add your territory and preferences</li>
              <li><strong>Discover companies</strong> - Let SIVA find your next opportunity</li>
              <li><strong>Generate outreach</strong> - AI-crafted messages that convert</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="button">
              Go to Dashboard
            </a>
            <p>Need help? Reply to this email or check our <a href="${process.env.NEXT_PUBLIC_APP_URL}/docs">documentation</a>.</p>
            <p>Best,<br>The PremiumRadar Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PremiumRadar. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    tags: [
      { name: 'type', value: 'welcome' },
      { name: 'vertical', value: vertical },
    ],
  });
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<SendEmailResult> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;

  return sendEmail({
    to,
    subject: 'Verify your PremiumRadar account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>Verify your email</h1>
            <p>Hi ${name || 'there'},</p>
            <p>Thanks for signing up for PremiumRadar. Please verify your email address by clicking the button below:</p>
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with PremiumRadar, you can safely ignore this email.</p>
            <p style="color: #6b7280; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br>${verifyUrl}</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PremiumRadar</p>
          </div>
        </div>
      </body>
      </html>
    `,
    tags: [{ name: 'type', value: 'verification' }],
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<SendEmailResult> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  return sendEmail({
    to,
    subject: 'Reset your PremiumRadar password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .button { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <h1>Reset your password</h1>
            <p>Hi ${name || 'there'},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} PremiumRadar</p>
          </div>
        </div>
      </body>
      </html>
    `,
    tags: [{ name: 'type', value: 'password-reset' }],
  });
}

/**
 * Send AI-generated outreach email
 */
export async function sendOutreachEmail(options: {
  to: string;
  subject: string;
  body: string;
  senderName: string;
  senderEmail: string;
  leadName: string;
  companyName: string;
  trackingId?: string;
}): Promise<SendEmailResult> {
  // Add tracking pixel if tracking is enabled
  const trackingPixel = options.trackingId
    ? `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/email/track?id=${options.trackingId}&event=open" width="1" height="1" style="display:none" />`
    : '';

  return sendEmail({
    to: options.to,
    subject: options.subject,
    from: `${options.senderName} <${options.senderEmail}>`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a;">
        ${options.body.replace(/\n/g, '<br>')}
        ${trackingPixel}
      </body>
      </html>
    `,
    text: options.body,
    tags: [
      { name: 'type', value: 'outreach' },
      { name: 'lead', value: options.leadName },
      { name: 'company', value: options.companyName },
    ],
  });
}

// ============================================================
// TRACKING
// ============================================================

/**
 * Record email tracking event
 */
export function recordTrackingEvent(event: EmailTrackingEvent): void {
  trackingEvents.push(event);
  console.log('[Email Tracking]', event);

  // Keep only last 10000 events
  if (trackingEvents.length > 10000) {
    trackingEvents.shift();
  }
}

/**
 * Get tracking events for a message
 */
export function getTrackingEvents(messageId: string): EmailTrackingEvent[] {
  return trackingEvents.filter((e) => e.messageId === messageId);
}

/**
 * Get all tracking events (for analytics)
 */
export function getAllTrackingEvents(limit: number = 100): EmailTrackingEvent[] {
  return trackingEvents.slice(-limit);
}

// ============================================================
// EXPORT
// ============================================================

export default {
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOutreachEmail,
  recordTrackingEvent,
  getTrackingEvents,
  getAllTrackingEvents,
};
