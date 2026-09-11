import { db, adminUsers, adminSessions, eq, asc } from '@asthiwar/database';
import bcrypt from 'bcrypt';
import { AuthError } from './auth.service.js';
import { CreateAdminUserDto, UpdateAdminUserDto } from './users.schema.js';

/** Never select password_hash. Nothing outside login has any business reading it. */
const USER_COLUMNS = {
  id: adminUsers.id,
  email: adminUsers.email,
  fullName: adminUsers.fullName,
  role: adminUsers.role,
  isActive: adminUsers.isActive,
  createdAt: adminUsers.createdAt,
  updatedAt: adminUsers.updatedAt,
} as const;

export async function listAdminUsers() {
  return db.select(USER_COLUMNS).from(adminUsers).orderBy(asc(adminUsers.createdAt));
}

export async function createAdminUser(dto: CreateAdminUserDto) {
  const email = dto.email.toLowerCase().trim();

  const existing = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email),
  });

  if (existing) {
    throw new AuthError(`An account already exists for ${email}`, 409, 'USER_ALREADY_EXISTS');
  }

  // Cost 12, matching login and the change-password path.
  const passwordHash = await bcrypt.hash(dto.password, 12);

  const [created] = await db
    .insert(adminUsers)
    .values({
      email,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: dto.role,
      isActive: true,
    })
    .returning(USER_COLUMNS);

  return created;
}

export async function updateAdminUser(
  userId: string,
  dto: UpdateAdminUserDto,
  actingUserId: string
) {
  const existing = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.id, userId),
  });

  if (!existing) {
    throw new AuthError('User not found', 404, 'USER_NOT_FOUND');
  }

  // An administrator cannot disable or demote themselves.
  //
  // Not paternalism: this console has no recovery path — no password reset, no
  // second channel — so an operator who removes their own access has locked the
  // whole product until someone edits the database by hand. If they are the only
  // super_admin, that is everyone, permanently.
  if (userId === actingUserId) {
    if (dto.isActive === false) {
      throw new AuthError(
        'You cannot disable your own account.',
        400,
        'CANNOT_DISABLE_SELF'
      );
    }
    if (dto.role !== undefined && dto.role !== existing.role) {
      throw new AuthError(
        'You cannot change your own role. Ask another administrator to do it.',
        400,
        'CANNOT_CHANGE_OWN_ROLE'
      );
    }
  }

  // The last active super_admin has to stay one, for the same reason.
  const losingSuperAdmin =
    existing.role === 'super_admin' &&
    ((dto.role !== undefined && dto.role !== 'super_admin') || dto.isActive === false);

  if (losingSuperAdmin) {
    const remaining = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(eq(adminUsers.role, 'super_admin'));

    const otherActiveSuperAdmins = remaining.filter((row) => row.id !== userId);
    if (otherActiveSuperAdmins.length === 0) {
      throw new AuthError(
        'This is the only super admin account. Promote another account first.',
        400,
        'LAST_SUPER_ADMIN'
      );
    }
  }

  const [updated] = await db
    .update(adminUsers)
    .set({
      ...(dto.fullName !== undefined && { fullName: dto.fullName.trim() }),
      ...(dto.role !== undefined && { role: dto.role }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, userId))
    .returning(USER_COLUMNS);

  // Disabling an account has to end its sessions. verifySession already refuses a
  // disabled user, so this is belt and braces — but leaving live tokens behind for
  // an account somebody just revoked is not a state worth keeping.
  if (dto.isActive === false) {
    await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
  }

  return updated;
}
