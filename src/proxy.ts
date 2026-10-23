import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth/session';

export function proxy(request: NextRequest) {
  const role = verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const pathname = request.nextUrl.pathname;

  if (!role) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/analytics') && role !== 'owner') {
    return NextResponse.redirect(new URL('/kasir', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/kasir/:path*', '/analytics/:path*'],
};
