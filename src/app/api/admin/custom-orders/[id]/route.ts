import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getAdminSession } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const status = typeof body.status === 'string' ? body.status.trim() : '';
  if (!status) return NextResponse.json({ error: 'Status is required.' }, { status: 400 });

  const ref = db.collection('customOrders').doc(params.id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await ref.set({ status, updatedAt: new Date().toISOString() }, { merge: true });
  const updated = await ref.get();
  return NextResponse.json({ ok: true, order: { id: updated.id, ...(updated.data() ?? {}) } });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await db.collection('customOrders').doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
