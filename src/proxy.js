import { NextResponse } from 'next/server';
import { verifyToken, SESSION_COOKIE } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export async function proxy(req) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token || !(await verifyToken(token))) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    if (pathname !== '/') loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
