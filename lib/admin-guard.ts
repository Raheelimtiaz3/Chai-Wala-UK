import { NextResponse } from 'next/server';
import { getSessionUser, type SessionPayload } from './auth';
import { getUserById } from './db';

export async function requireAdmin(): Promise<
  { ok: true; session: SessionPayload } | { ok: false; response: NextResponse }
> {
  const session = await getSessionUser();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
    };
  }

  const dbUser = getUserById(session.userId);
  if (!dbUser || dbUser.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Administrator access required.' }, { status: 403 }),
    };
  }

  return { ok: true, session };
}
