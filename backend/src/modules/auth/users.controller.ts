import { Request, Response, NextFunction } from 'express';
import { AuthError } from './auth.service.js';
import { listAdminUsers, createAdminUser, updateAdminUser } from './users.service.js';
import { CreateAdminUserDto, UpdateAdminUserDto } from './users.schema.js';
import { logAuditEvent } from '../../services/audit.service.js';

function relayAuthError(error: unknown, res: Response, next: NextFunction): void {
  if (error instanceof AuthError) {
    res.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }
  next(error);
}

export async function listAdminUsersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, data: await listAdminUsers() });
  } catch (error) {
    next(error);
  }
}

export async function createAdminUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = req.body as CreateAdminUserDto;
    const created = await createAdminUser(dto);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'CREATE_ADMIN_USER',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: req.user?.email || req.user?.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 201,
      // The password is deliberately absent — a new credential must not be
      // copied into a table the console can read back.
      metadata: { createdUserId: created.id, email: created.email, role: created.role },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.status(201).json({
      success: true,
      message: `Account created for ${created.email}`,
      data: created,
    });
  } catch (error) {
    relayAuthError(error, res, next);
  }
}

export async function updateAdminUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const userId = req.params.id as string;
    const dto = req.body as UpdateAdminUserDto;
    const updated = await updateAdminUser(userId, dto, req.user.id);

    logAuditEvent({
      eventType: 'ADMIN_MUTATION',
      action: 'UPDATE_ADMIN_USER',
      severity: 'HIGH',
      actorType: 'ADMIN',
      actorId: req.user.email || req.user.id,
      endpoint: req.originalUrl,
      httpMethod: req.method,
      statusCode: 200,
      metadata: { targetUserId: userId, changes: dto },
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.json({
      success: true,
      message: `Account ${updated.email} updated`,
      data: updated,
    });
  } catch (error) {
    relayAuthError(error, res, next);
  }
}
