import type { FeedbackInput } from './contracts.js';

export interface FeedbackErrors { gameId?: string; email?: string; description?: string; body?: string }
export type FeedbackValidation = { valid: true; value: FeedbackInput } | { valid: false; errors: FeedbackErrors };

function validEmail(email: string): boolean {
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts as [string, string];
  if (!/^[A-Za-z0-9._+-]+$/.test(local) || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  const labels = domain.split('.');
  return labels.length >= 2
    && labels.every(label => /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label))
    && /^[A-Za-z]{2,}$/.test(labels.at(-1)!);
}

export function validateFeedback(value: unknown): FeedbackValidation {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return { valid: false, errors: { body: 'Feedback must be a JSON object.' } };
  const input = value as Record<string, unknown>;
  const errors: FeedbackErrors = {};
  if (Object.keys(input).some(key => !['gameId', 'email', 'description'].includes(key)))
    errors.body = 'Feedback contains unsupported fields.';
  if (!Object.hasOwn(input, 'gameId') || typeof input.gameId !== 'number' || !Number.isSafeInteger(input.gameId) || input.gameId <= 0)
    errors.gameId = 'Choose a game.';
  const email = typeof input.email === 'string' ? input.email.trim() : '';
  if (!Object.hasOwn(input, 'email') || typeof input.email !== 'string' || !validEmail(email))
    errors.email = 'Enter a valid email address.';
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (!Object.hasOwn(input, 'description') || typeof input.description !== 'string' || Array.from(description).length < 20)
    errors.description = 'Description must contain at least 20 characters.';
  if (Object.keys(errors).length) return { valid: false, errors };
  return { valid: true, value: { gameId: input.gameId as number, email, description } };
}
