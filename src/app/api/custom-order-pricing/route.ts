import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getAdminSession } from '@/lib/auth';

const allowedKinds = new Set(['material', 'size']);

function toIntPrice(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.floor(n));
}

function normDoc(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const data = doc.data() as Record<string, unknown>;
  return {
    id: doc.id,
    kind: typeof data.kind === 'string' ? data.kind : '',
    name: typeof data.name === 'string' ? data.name : '',
    price: Number(data.price) || 0,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : ''
  };
}

export async function GET() {
  const snap = await db.collection('customOrderPricing').get();
  const all = snap.docs.map(normDoc);
  const materials = all
    .filter((x) => x.kind === 'material')
    .map((x) => ({ id: x.id, name: x.name, price: x.price }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const sizes = all
    .filter((x) => x.kind === 'size')
    .map((x) => ({ id: x.id, name: x.name, price: x.price }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ materials, sizes });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const materials = Array.isArray(body?.materials) ? body.materials : [];
  const sizes = Array.isArray(body?.sizes) ? body.sizes : [];
  const deleteIds = Array.isArray(body?.deleteIds) ? body.deleteIds.filter((x: any) => typeof x === 'string') : [];

  const norm = (rows: any[], kind: 'material' | 'size') =>
    rows
      .map((r) => ({
        id: typeof r?.id === 'string' ? r.id : null,
        kind,
        name: typeof r?.name === 'string' ? r.name.trim() : '',
        price: toIntPrice(r?.price) ?? 0
      }))
      .filter((r) => r.name.length > 0);

  const materialRows = norm(materials, 'material');
  const sizeRows = norm(sizes, 'size');

  if (materialRows.length === 0) return NextResponse.json({ error: 'Add at least 1 material.' }, { status: 400 });
  if (sizeRows.length === 0) return NextResponse.json({ error: 'Add at least 1 size.' }, { status: 400 });

  const incoming = [...materialRows, ...sizeRows];
  const seen = new Set<string>();
  for (const row of incoming) {
    const key = `${row.kind}::${row.name.toLowerCase()}`;
    if (seen.has(key)) {
      return NextResponse.json({ error: 'Duplicate name found (same kind). Names must be unique.' }, { status: 409 });
    }
    seen.add(key);
  }

  const existingSnap = await db.collection('customOrderPricing').get();
  const existingRows = existingSnap.docs.map(normDoc);
  for (const row of incoming) {
    const clash = existingRows.find(
      (x) => x.kind === row.kind && x.name.toLowerCase() === row.name.toLowerCase() && (!row.id || x.id !== row.id)
    );
    if (clash) {
      return NextResponse.json({ error: 'Duplicate name found (same kind). Names must be unique.' }, { status: 409 });
    }
  }

  const batch = db.batch();
  for (const id of deleteIds) {
    batch.delete(db.collection('customOrderPricing').doc(id));
  }

  const now = new Date().toISOString();
  for (const row of incoming) {
    if (!allowedKinds.has(row.kind)) continue;
    const ref = row.id ? db.collection('customOrderPricing').doc(row.id) : db.collection('customOrderPricing').doc();
    batch.set(
      ref,
      {
        kind: row.kind,
        name: row.name,
        price: row.price,
        createdAt: row.id ? undefined : now,
        updatedAt: now
      },
      { merge: true }
    );
  }

  await batch.commit();
  return NextResponse.json({ ok: true });
}
