export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  /**
   * Production only: the account is still on the password published in the
   * source, so its session may change the password and nothing else.
   */
  mustChangePassword?: boolean;
}

export interface SessionResult {
  token: string;
  user: AdminUserDto;
  expiresAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AdminUserDto;
      sessionToken?: string;
    }
  }
}
