import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

export type UserRole = 'kasir' | 'owner';

export const AUTH_COOKIE_NAME = 'akiba_auth_session';
export const AUTH_SESSION_MAX_AGE = 60 * 60 * 8;

type SessionPayload = {
  role: UserRole;
  expiresAt: number;
};

export function isAuthConfigured() {
  return Boolean(
    process.env.KASIR_PIN &&
    process.env.OWNER_PIN &&
    process.env.AUTH_SESSION_SECRET &&
    process.env.AUTH_SESSION_SECRET.length >= 32
  );
}

export function verifyPin(role: UserRole, pin: string) {
  const expectedPin = role === 'kasir' ? process.env.KASIR_PIN : process.env.OWNER_PIN;
  if (!expectedPin) return false;

  const submittedHash = createHmac('sha256', 'akiba-pin-comparison').update(pin).digest();
  const expectedHash = createHmac('sha256', 'akiba-pin-comparison').update(expectedPin).digest();
  return timingSafeEqual(submittedHash, expectedHash);
}

export function createSessionToken(role: UserRole) {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SESSION_SECRET harus berisi minimal 32 karakter.');
  }

  const payload: SessionPayload = {
    role,
    expiresAt: Math.floor(Date.now() / 1000) + AUTH_SESSION_MAX_AGE,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encodedPayload).digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token?: string): UserRole | null {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!token || !secret || secret.length < 32) return null;

  const separator = token.lastIndexOf('.');
  if (separator < 1) return null;

  const encodedPayload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest();
  const providedSignature = Buffer.from(signature, 'base64url');

  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload;
  } catch {
    return null;
  }

  if (
    (payload.role !== 'kasir' && payload.role !== 'owner') ||
    !Number.isFinite(payload.expiresAt) ||
    payload.expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return payload.role;
}
