import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose/jwt/verify';

const protectedPrefixes = ['/requests', '/lookups', '/users', '/criteria', '/measure-lookups', '/nav'];

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.trim().length < 32) {
    throw new Error('JWT_SECRET is missing or too short (min 32 characters).');
  }
  return new TextEncoder().encode(raw);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  if (!needsAuth) return NextResponse.next();

  const token = request.cookies.get('realestate_inspect_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/requests/:path*', '/lookups/:path*', '/users/:path*', '/criteria/:path*', '/measure-lookups/:path*', '/nav/:path*']
};
