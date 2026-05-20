import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { AdminSession } from '@/types/admin';

const COOKIE_NAME = 'zs_admin_token';
const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);
const TTL_SECONDS = 4 * 60 * 60; // 4 hours

export async function signAdminToken(payload: Omit<AdminSession, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AdminSession;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export interface CookieOptions {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict';
  maxAge: number;
  path: string;
}

export function buildAdminCookie(token: string): CookieOptions {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TTL_SECONDS,
    path: '/',
  };
}

export { COOKIE_NAME };
