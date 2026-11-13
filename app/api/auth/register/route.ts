import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { validateEmail } from '@/lib/uk-validation';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }
    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const hash = bcrypt.hashSync(password, 10);
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, role, created_at)
         VALUES (?, ?, ?, 'customer', ?)`
      )
      .run(name, email, hash, now);

    const userId = Number(result.lastInsertRowid);

    await setSessionCookie({
      userId,
      email,
      name,
      role: 'customer',
    });

    return NextResponse.json(
      {
        user: {
          id: userId,
          name,
          email,
          role: 'customer',
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to create account.' }, { status: 500 });
  }
}
