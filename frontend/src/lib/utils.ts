import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat(
    'en',
    options ?? {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  ).format(date);
}

export function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function initials(name?: string | null) {
  if (!name) return 'TS';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value);
}

export function friendlyLabel(value: string) {
  return value
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function positiveInteger(value: string | null, fallback = 1) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function errorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response
  ) {
    const data = error.response.data;
    if (
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
    ) {
      return data.message;
    }
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
