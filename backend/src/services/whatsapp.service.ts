import { env } from '../config/env.js';

export interface SendWhatsAppOptions {
  to: string;
  message: string;
}

export interface SendWhatsAppResult {
  sent: boolean;
  provider?: 'twilio' | 'ultramsg' | 'custom';
  id?: string;
  reason?: 'NO_CREDENTIALS' | 'FAILED';
  error?: string;
}

/**
 * Normalises phone numbers for WhatsApp API by removing '+' and non-digit characters.
 */
function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * CallMeBot was a third fallback, removed. It is a free personal-alert bot, and
 * its API takes the message and the API key in the query string of a GET — so
 * lead details (name, phone, email, notes) and, for a customer quotation, the
 * PDF link carrying its access token, would sit in URLs a third party logs. The
 * variable is reported rather than silently ignored so nobody believes it works.
 */
if (process.env.CALLMEBOT_API_KEY) {
  console.warn(
    '[WhatsApp] CALLMEBOT_API_KEY is set but CallMeBot is no longer supported. ' +
      'Configure Twilio or an HTTPS gateway (WHATSAPP_API_URL) instead.'
  );
}

/**
 * Dispatches a WhatsApp message in the background directly from the server.
 * Supports:
 *  1. Twilio WhatsApp (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)
 *  2. REST Gateway / UltraMsg (WHATSAPP_API_URL, WHATSAPP_API_TOKEN) — https only
 */
export async function sendWhatsAppMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
  const recipient = cleanPhoneNumber(options.to);
  const message = options.message;

  const twilioSid = env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  const gatewayUrl = process.env.WHATSAPP_API_URL;
  const gatewayToken = process.env.WHATSAPP_API_TOKEN;

  // 1. Twilio Provider
  if (twilioSid && twilioToken) {
    try {
      const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const params = new URLSearchParams({
        From: twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`,
        To: `whatsapp:+${recipient}`,
        Body: message,
      });

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          sent: false,
          provider: 'twilio',
          reason: 'FAILED',
          error: (data as any)?.message || `Twilio error HTTP ${response.status}`,
        };
      }

      return {
        sent: true,
        provider: 'twilio',
        id: (data as any)?.sid,
      };
    } catch (err: unknown) {
      return {
        sent: false,
        provider: 'twilio',
        reason: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 2. Generic REST Gateway (e.g. UltraMsg / Wati)
  if (gatewayUrl && gatewayToken) {
    // The request body carries the gateway token and the customer's details.
    if (!isHttpsUrl(gatewayUrl)) {
      console.error('[WhatsApp] WHATSAPP_API_URL must be an https:// URL. Message not sent.');
      return {
        sent: false,
        provider: 'ultramsg',
        reason: 'FAILED',
        error: 'WHATSAPP_API_URL must use https',
      };
    }

    try {
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: gatewayToken,
          to: recipient,
          body: message,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          sent: false,
          provider: 'ultramsg',
          reason: 'FAILED',
          error: (data as any)?.error || `Gateway error HTTP ${response.status}`,
        };
      }

      return {
        sent: true,
        provider: 'ultramsg',
        id: (data as any)?.id ? String((data as any).id) : undefined,
      };
    } catch (err: unknown) {
      return {
        sent: false,
        provider: 'ultramsg',
        reason: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  function maskPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 6) return '***';
    return digits.substring(0, 3) + '****' + digits.substring(digits.length - 3);
  }

  // 3. No provider credentials configured
  console.info(
    `[WhatsApp] Background message prepared for +${maskPhone(recipient)}. Server gateway keys (TWILIO_ACCOUNT_SID or WHATSAPP_API_URL) not set in environment. Saved as PENDING outbox.`
  );

  return {
    sent: false,
    reason: 'NO_CREDENTIALS',
  };
}
