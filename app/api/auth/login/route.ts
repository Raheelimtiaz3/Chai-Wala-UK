import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import type { UserRole } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const userRow = db
      .prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ?')
      .get(email) as Record<string, unknown> | undefined;

    if (!userRow || !bcrypt.compareSync(password, String(userRow.password_hash))) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const user = {
      userId: Number(userRow.id),
      email: String(userRow.email),
      name: String(userRow.name),
      role: String(userRow.role) as UserRole,
    };

    await setSessionCookie(user);

    return NextResponse.json({
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Sign-in failed.' }, { status: 500 });
  }
}
