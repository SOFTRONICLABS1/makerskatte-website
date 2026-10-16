import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/firebaseAdmin';
import { getAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';
  const confirmPassword = typeof body?.confirmPassword === 'string' ? body.confirmPassword : '';

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'New password and confirm password do not match.' }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: 'New password must be different from current password.' }, { status: 400 });
  }

  const ref = db.collection('adminUsers').doc(session.adminId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: 'Admin account not found.' }, { status: 404 });
  }

  const data = snap.data() as { passwordHash?: string };
  const passwordHash = typeof data.passwordHash === 'string' ? data.passwordHash : '';
  const isValid = await bcrypt.compare(currentPassword, passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
  }

  const nextHash = await bcrypt.hash(newPassword, 10);
  await ref.set(
    {
      passwordHash: nextHash,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
