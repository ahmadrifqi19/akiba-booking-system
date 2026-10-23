import { NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_MAX_AGE,
  createSessionToken,
  isAuthConfigured,
  verifyPin,
  type UserRole,
} from '@/lib/auth/session';

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: 'Autentikasi belum dikonfigurasi di environment server.' },
      { status: 503 }
    );
  }

  let body: { role?: unknown; pin?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Permintaan login tidak valid.' }, { status: 400 });
  }

  const { role, pin } = body;
  if (
    (role !== 'kasir' && role !== 'owner') ||
    typeof pin !== 'string' ||
    pin.length === 0 ||
    pin.length > 256
  ) {
    return NextResponse.json({ error: 'Role atau PIN tidak valid.' }, { status: 400 });
  }

  if (!verifyPin(role as UserRole, pin)) {
    return NextResponse.json({ error: 'PIN atau role tidak cocok.' }, { status: 401 });
  }

  const response = NextResponse.json({ role });
  response.cookies.set(AUTH_COOKIE_NAME, createSessionToken(role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: AUTH_SESSION_MAX_AGE,
  });

  return response;
}
