import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getCustomOrderSettings } from '@/lib/customOrderSettings';

async function getPrice(kind: 'material' | 'size', name: string) {
  const snap = await db
    .collection('customOrderPricing')
    .where('kind', '==', kind)
    .where('name', '==', name)
    .limit(1)
    .get();
  if (snap.empty) return 0;
  const row = snap.docs[0].data() as Record<string, unknown>;
  return Number(row.price) || 0;
}

export async function POST(request: Request) {
  const settings = await getCustomOrderSettings();
  if (!settings.enabled) {
    return NextResponse.json({ error: settings.message }, { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body.name || !body.email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }

  const fileUrls =
    Array.isArray(body.fileUrls) ? body.fileUrls.filter((u: unknown) => typeof u === 'string' && u.trim()) : null;
  const fileName = fileUrls ? JSON.stringify(fileUrls) : body.fileName ?? null;

  const material = typeof body.material === 'string' ? body.material : null;
  const size = typeof body.size === 'string' ? body.size : null;
  const quantity = body.quantity ? Math.max(1, Math.floor(Number(body.quantity))) : null;

  let estimatedTotal: number | null = null;
  if (material && size && quantity) {
    const [materialBase, sizePrice] = await Promise.all([getPrice('material', material), getPrice('size', size)]);
    estimatedTotal = materialBase + sizePrice * quantity;
  }

  const status = typeof body.status === 'string' && body.status.trim() ? body.status.trim() : 'created';
  const paymentStatus =
    typeof body.paymentStatus === 'string' && body.paymentStatus.trim() ? body.paymentStatus.trim() : 'unpaid';
  const paymentMethod =
    typeof body.paymentMethod === 'string' && body.paymentMethod.trim() ? body.paymentMethod.trim() : null;

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.collection('customOrders').doc(id).set({
    id,
    status,
    paymentStatus,
    paymentMethod,
    name: body.name,
    email: body.email,
    phone: body.phone ?? null,
    material,
    size,
    quantity,
    urgency: body.urgency ?? null,
    address: body.address ?? null,
    message: body.message ?? null,
    fileName,
    estimatedTotal,
    createdAt: now,
    updatedAt: now
  });

  return NextResponse.json({ ok: true, orderId: id, estimatedTotal });
}
