import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '@/lib/db';
import { getJwtSecret } from '@/lib/env';

const COOKIE_NAME = 'realestate_inspect_session';

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: string;
};

type SessionToken = { sub: string };

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

/**
 * Verify a username/password pair. Returns the session user or null. Never
 * reveals whether the username or the password was wrong.
 */
export async function authenticate(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() }
  });
  if (!user || !user.isActive) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;
  return toSessionUser(user);
}

function toSessionUser(user: {
  id: string;
  name: string;
  username: string;
  role: string;
}): SessionUser {
  return { id: user.id, name: user.name, username: user.username, role: user.role };
}

export async function createSession(user: Pick<SessionUser, 'id'>) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Read the current session. The token carries only the user id; role and
 * active status are always looked up fresh from the database, so deactivating
 * a user or changing their role takes effect immediately.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let userId: string;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const sub = (payload as Partial<SessionToken>).sub;
    if (typeof sub !== 'string' || !sub) return null;
    userId = sub;
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) return null;
  return toSessionUser(user);
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

/** Pages/actions that only a super admin may reach. */
export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== 'SUPER_ADMIN') redirect('/requests');
  return user;
}

export { COOKIE_NAME };
