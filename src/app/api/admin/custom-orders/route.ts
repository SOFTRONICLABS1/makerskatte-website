import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getAdminSession } from '@/lib/auth';

function mapCustomOrder(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const raw = doc.data() as Record<string, unknown>;
  return {
    id: doc.id,
    status: typeof raw.status === 'string' ? raw.status : 'created',
    paymentStatus: typeof raw.paymentStatus === 'string' ? raw.paymentStatus : 'unpaid',
    paymentMethod: typeof raw.paymentMethod === 'string' ? raw.paymentMethod : null,
    name: typeof raw.name === 'string' ? raw.name : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    phone: typeof raw.phone === 'string' ? raw.phone : null,
    material: typeof raw.material === 'string' ? raw.material : null,
    size: typeof raw.size === 'string' ? raw.size : null,
    quantity: raw.quantity === null || raw.quantity === undefined ? null : Number(raw.quantity),
    address: typeof raw.address === 'string' ? raw.address : null,
    message: typeof raw.message === 'string' ? raw.message : null,
    fileName: typeof raw.fileName === 'string' ? raw.fileName : null,
    estimatedTotal: raw.estimatedTotal === null || raw.estimatedTotal === undefined ? null : Number(raw.estimatedTotal),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null
  };
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await db.collection('customOrders').get();
  const orders = snap.docs.map(mapCustomOrder).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(orders);
}
