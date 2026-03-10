export type UserRole = 'admin' | 'trainer' | 'athlete';

export interface RequestUser {
  userId: string;
  role: UserRole;
}

export const USER_ROLES: UserRole[] = ['admin', 'trainer', 'athlete'];
