import { z } from 'zod';
import { ADMIN_ROLES } from '../../middleware/auth.js';

/**
 * Admin accounts could only be created by the seed script.
 *
 * `admin_users` supports several accounts and carries a role column, but nothing
 * in the product could add, retire or re-role one — so in practice every operator
 * shared the single seeded login, and the audit trail recorded one name for
 * everything anyone did. Roles are only meaningful once accounts can be handed
 * out individually.
 */
export const roleField = z.enum(ADMIN_ROLES);

export const createAdminUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  // The same floor the change-password route enforces, so an account cannot be
  // created weaker than it is allowed to become.
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  role: roleField.default('admin'),
});

export const updateAdminUserSchema = z
  .object({
    fullName: z.string().min(2).optional(),
    role: roleField.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nothing to update',
  });

export type CreateAdminUserDto = z.infer<typeof createAdminUserSchema>;
export type UpdateAdminUserDto = z.infer<typeof updateAdminUserSchema>;
