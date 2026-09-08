export type NotificationChannel = 'EMAIL' | 'WHATSAPP' | 'SMS';
export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';
export type NotificationTemplate = 'ESTIMATE_QUOTATION' | 'NEW_LEAD_ALERT' | 'FOLLOW_UP';

export interface EmailDispatchOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WhatsAppDispatchOptions {
  to: string;
  message: string;
  templateName?: string;
  mediaUrl?: string;
}

export interface NotificationResult {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  template: NotificationTemplate;
  status: NotificationStatus;
  sentAt?: Date | null;
  errorMessage?: string | null;
}
