import { AdminUser } from '@asthiwar/database';

declare global {
  namespace Express {
    interface Request {
      user?: AdminUser;
      sessionToken?: string;
      cookies?: Record<string, string>;
    }
  }
}

export {};
