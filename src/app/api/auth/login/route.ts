import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/firebaseAdmin';
import { createAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid login request' }, { status: 400 });
  }
  const credentials = body as { email?: unknown; password?: unknown } | null;
  const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
  const password = typeof credentials?.password === 'string' ? credentials.password : '';
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const snap = await Promise.race([
      db.collection('adminUsers').where('email', '==', email).limit(1).get(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Authentication database timeout')), 10000);
      })
    ]);
    clearTimeout(timeout);
    if (snap.empty) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const doc = snap.docs[0];
    const data = doc.data() as { passwordHash?: string };
    const passwordHash = typeof data.passwordHash === 'string' ? data.passwordHash : '';
    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createAdminSession(doc.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: 'The sign-in service is temporarily unavailable. Please try again shortly.' },
      { status: 503 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
