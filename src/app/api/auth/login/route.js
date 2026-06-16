import { NextResponse } from 'next/server';
import { signToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth';

export async function POST(req) {
  const { username, password } = await req.json();

  if (
    !username || !password ||
    username !== process.env.AUTH_USERNAME ||
    password !== process.env.AUTH_PASSWORD
  ) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signToken(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return res;
}
