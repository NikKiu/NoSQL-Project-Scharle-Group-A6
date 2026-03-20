import { BadRequestException } from '@nestjs/common';

export function parseDate(value: any, fieldName: string): Date {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid ${fieldName}`);
  }
  return date;
}

export function parseOptionalDate(value: any, fieldName: string): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return parseDate(value, fieldName);
}

export function parseOptionalNumber(value: any, fieldName: string): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new BadRequestException(`${fieldName} must be a valid number`);
  }
  return num;
}

export function parseLimit(value: any, defaultLimit = 100, maxLimit = 1000): number {
  if (value === undefined || value === null || value === '') return defaultLimit;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException('limit must be a positive number');
  }
  return Math.min(Math.floor(parsed), maxLimit);
}

export function ensureString(value: any, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new BadRequestException(`${fieldName} is required`);
  }
  return value.trim();
}

export function ensureStringArray(value: any, fieldName: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new BadRequestException(`${fieldName} must be a non-empty array`);
  }

  const items = value.map((v) => {
    if (typeof v !== 'string' || !v.trim()) {
      throw new BadRequestException(`${fieldName} must only contain non-empty strings`);
    }
    return v.trim();
  });

  return Array.from(new Set(items));
}
