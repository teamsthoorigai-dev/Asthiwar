import { env } from '../config/env.js';

export interface SendWhatsAppOptions {
  to: string;
  message: string;
}

export interface SendWhatsAppResult {
  sent: boolean;
  provider?: 'twilio' | 'ultramsg' | 'callmebot' | 'custom';
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

/**
 * Dispatches a WhatsApp message in the background directly from the server.
 * Supports:
 *  1. Twilio WhatsApp (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM)
 *  2. REST Gateway / UltraMsg (WHATSAPP_API_URL, WHATSAPP_API_TOKEN)
 *  3. CallMeBot Free WhatsApp Bot (CALLMEBOT_API_KEY)
 */
export async function sendWhatsAppMessage(options: SendWhatsAppOptions): Promise<SendWhatsAppResult> {
  const recipient = cleanPhoneNumber(options.to);
  const message = options.message;

  const twilioSid = env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  const gatewayUrl = process.env.WHATSAPP_API_URL;
  const gatewayToken = process.env.WHATSAPP_API_TOKEN;

  const callMeBotKey = process.env.CALLMEBOT_API_KEY;

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

  // 3. CallMeBot (Free personal alert bot)
  if (callMeBotKey) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${recipient}&text=${encodeURIComponent(
        message
      )}&apikey=${callMeBotKey}`;
      const response = await fetch(url);
      const text = await response.text();

      if (!response.ok || text.includes('ERROR')) {
        return {
          sent: false,
          provider: 'callmebot',
          reason: 'FAILED',
          error: text || `CallMeBot error HTTP ${response.status}`,
        };
      }

      return {
        sent: true,
        provider: 'callmebot',
      };
    } catch (err: unknown) {
      return {
        sent: false,
        provider: 'callmebot',
        reason: 'FAILED',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 4. No provider credentials configured
  console.info(
    `[WhatsApp] Background message prepared for +${recipient}. Server gateway keys (TWILIO_ACCOUNT_SID, WHATSAPP_API_URL, or CALLMEBOT_API_KEY) not set in environment. Saved as PENDING outbox.`
  );

  return {
    sent: false,
    reason: 'NO_CREDENTIALS',
  };
}
