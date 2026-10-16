import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getAdminSession } from '@/lib/auth';

function mapOrder(doc: FirebaseFirestore.QueryDocumentSnapshot) {
  const raw = doc.data() as Record<string, unknown>;
  return {
    id: doc.id,
    status: typeof raw.status === 'string' ? raw.status : 'created',
    paymentStatus: typeof raw.paymentStatus === 'string' ? raw.paymentStatus : 'unpaid',
    paymentMethod: typeof raw.paymentMethod === 'string' ? raw.paymentMethod : null,
    customerName: typeof raw.customerName === 'string' ? raw.customerName : null,
    email: typeof raw.email === 'string' ? raw.email : null,
    phone: typeof raw.phone === 'string' ? raw.phone : null,
    address: typeof raw.address === 'string' ? raw.address : null,
    message: typeof raw.message === 'string' ? raw.message : null,
    total: Number(raw.total) || 0,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    items: Array.isArray(raw.items)
      ? raw.items.map((it: any) => ({
          id: typeof it?.id === 'string' ? it.id : '',
          quantity: Number(it?.quantity) || 0,
          priceAtPurchase: Number(it?.priceAtPurchase) || 0,
          product: {
            id: typeof it?.product?.id === 'string' ? it.product.id : typeof it?.productId === 'string' ? it.productId : '',
            name: typeof it?.product?.name === 'string' ? it.product.name : 'Product',
            slug: typeof it?.product?.slug === 'string' ? it.product.slug : '',
            imageUrl: typeof it?.product?.imageUrl === 'string' ? it.product.imageUrl : null
          }
        }))
      : []
  };
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snap = await db.collection('orders').get();
  const orders = snap.docs.map(mapOrder).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(orders);
}
