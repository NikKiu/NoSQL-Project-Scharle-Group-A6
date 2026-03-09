import { BadRequestException } from '@nestjs/common';
import { RequestUser, USER_ROLES } from './auth.types';

export function getRequestUser(req: any): RequestUser {
  const userId = (req.headers?.['x-user-id'] || '').toString().trim();
  const role = (req.headers?.['x-role'] || '').toString().trim();

  if (!userId || !role) {
    throw new BadRequestException('Missing headers: x-user-id and x-role are required');
  }

  if (!USER_ROLES.includes(role as any)) {
    throw new BadRequestException('Invalid x-role. Allowed values: admin, trainer, athlete');
  }

  return { userId, role: role as RequestUser['role'] };
}

export function canManageAthletes(role: RequestUser['role']): boolean {
  return role === 'admin' || role === 'trainer';
}

export function canDeleteAthletes(role: RequestUser['role']): boolean {
  return role === 'admin' || role === 'trainer';
}
