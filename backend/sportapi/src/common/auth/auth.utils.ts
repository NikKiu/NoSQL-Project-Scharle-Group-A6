import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { RequestUser, USER_ROLES } from './auth.types';

interface TokenPayload {
  userId: string;
  role: RequestUser['role'];
  exp: number;
}

const runtimeTokenSecret = process.env.AUTH_TOKEN_SECRET || 'dev-auth-token-secret-change-me';

function getTokenSecret(): string {
  return runtimeTokenSecret;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function signPayload(encodedPayload: string): string {
  return createHmac('sha256', getTokenSecret()).update(encodedPayload).digest('base64url');
}

function parseBearerToken(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new UnauthorizedException('Missing Authorization header');
  }

  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedException('Authorization header must be in format: Bearer <token>');
  }

  return token.trim();
}

export function issueAuthToken(user: RequestUser, ttlSeconds = 60 * 60 * 24 * 7): string {
  const payload: TokenPayload = {
    userId: user.userId,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifyAuthToken(token: string): TokenPayload {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    throw new UnauthorizedException('Invalid auth token format');
  }

  const expectedSignature = signPayload(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new UnauthorizedException('Invalid auth token signature');
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayload;
  } catch {
    throw new UnauthorizedException('Invalid auth token payload');
  }

  if (!payload?.userId || !payload?.role || !payload?.exp) {
    throw new UnauthorizedException('Auth token payload is incomplete');
  }

  if (!USER_ROLES.includes(payload.role)) {
    throw new UnauthorizedException('Auth token role is invalid');
  }

  if (payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedException('Auth token has expired');
  }

  return payload;
}

export function getRequestUser(req: any): RequestUser {
  const token = parseBearerToken(req.headers?.authorization?.toString());
  const payload = verifyAuthToken(token);
  const role = payload.role;

  if (!payload.userId || !role) {
    throw new BadRequestException('Invalid auth token payload');
  }

  return { userId: payload.userId, role };
}

export function canManageAthletes(role: RequestUser['role']): boolean {
  return role === 'admin' || role === 'trainer';
}

export function canDeleteAthletes(role: RequestUser['role']): boolean {
  return role === 'admin' || role === 'trainer';
}
