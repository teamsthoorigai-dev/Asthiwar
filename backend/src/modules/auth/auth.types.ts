export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
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
