import { Resend } from 'resend';
import { env } from '../config/env.js';

export interface SendEmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
  attachments?: SendEmailAttachment[];
}

export interface SendEmailResult {
  sent: boolean;
  id?: string;
  reason?: 'NO_API_KEY' | 'FAILED';
  error?: string;
}

// Lazy/singleton client
let resendClient: Resend | null = null;

function getClient(): Resend | null {
  if (!env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

/**
 * Returns true if RESEND_API_KEY is configured in the environment.
 */
export function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.RESEND_API_KEY.trim().length > 0);
}

/**
 * Dispatches an email using Resend.
 * If RESEND_API_KEY is not configured, logs an advisory note and returns sent: false
 * with reason: 'NO_API_KEY' so the notification record stays PENDING as an outbox.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const client = getClient();

  if (!client) {
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    console.info(
      `[Resend] RESEND_API_KEY is not set. Email "${options.subject}" to [${recipients}] remains in PENDING outbox.`
    );
    return {
      sent: false,
      reason: 'NO_API_KEY',
    };
  }

  try {
    const fromAddress = options.from || env.RESEND_FROM_EMAIL;

    const { data, error } = await client.emails.send({
      from: fromAddress,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      attachments: options.attachments,
    });

    if (error) {
      console.error(`[Resend] Failed to send email to ${options.to}:`, error);
      return {
        sent: false,
        reason: 'FAILED',
        error: error.message || 'Unknown Resend error',
      };
    }

    return {
      sent: true,
      id: data?.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Resend] Exception during email dispatch:`, message);
    return {
      sent: false,
      reason: 'FAILED',
      error: message,
    };
  }
}
