import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

type ReqItem = { productId: string; quantity: number };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const items = (body?.items ?? []) as ReqItem[];
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
  }

  const status = typeof body?.status === 'string' && body.status.trim() ? body.status.trim() : 'created';
  const paymentStatus = typeof body?.paymentStatus === 'string' && body.paymentStatus.trim() ? body.paymentStatus.trim() : 'unpaid';
  const paymentMethod = typeof body?.paymentMethod === 'string' && body.paymentMethod.trim() ? body.paymentMethod.trim() : null;
  const customerName = typeof body?.customerName === 'string' && body.customerName.trim() ? body.customerName.trim() : null;
  const email = typeof body?.email === 'string' && body.email.trim() ? body.email.trim() : null;
  const phone = typeof body?.phone === 'string' && body.phone.trim() ? body.phone.trim() : null;
  const address = typeof body?.address === 'string' && body.address.trim() ? body.address.trim() : null;
  const message = typeof body?.message === 'string' && body.message.trim() ? body.message.trim() : null;

  const normalized = items
    .filter((it) => it && typeof it.productId === 'string')
    .map((it) => ({ productId: it.productId, quantity: Math.max(1, Math.floor(Number(it.quantity))) }))
    .filter((it) => it.productId.length > 0);

  if (normalized.length === 0) {
    return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 });
  }

  try {
    const result = await db.runTransaction(async (tx) => {
      const refs = normalized.map((it) => db.collection('products').doc(it.productId));
      const snaps = await Promise.all(refs.map((ref) => tx.get(ref)));
      const products = new Map<string, { id: string; name: string; slug: string; imageUrl: string | null; price: number; stock: number; isActive: boolean; isComingSoon: boolean }>();

      snaps.forEach((snap) => {
        if (!snap.exists) return;
        const raw = (snap.data() ?? {}) as Record<string, unknown>;
        products.set(snap.id, {
          id: snap.id,
          name: typeof raw.name === 'string' ? raw.name : 'Product',
          slug: typeof raw.slug === 'string' ? raw.slug : '',
          imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : null,
          price: Number(raw.price) || 0,
          stock: Math.max(0, Math.floor(Number(raw.stock) || 0)),
          isActive: typeof raw.isActive === 'boolean' ? raw.isActive : true,
          isComingSoon: raw.isComingSoon === true
        });
      });

      for (const item of normalized) {
        const product = products.get(item.productId);
        if (!product || product.isActive === false) {
          throw new Error('A product in your cart is no longer available.');
        }
        if (product.isComingSoon) {
          throw new Error(`${product.name} is coming soon and cannot be ordered yet.`);
        }
      }

      for (const item of normalized) {
        const product = products.get(item.productId)!;
        if (product.stock < item.quantity) {
          throw new Error(`${product.name}: not enough stock.`);
        }
        const nextStock = product.stock - item.quantity;
        tx.update(db.collection('products').doc(item.productId), {
          stock: nextStock,
          updatedAt: new Date().toISOString()
        });
      }

      const total = normalized.reduce((sum, item) => {
        const p = products.get(item.productId)!;
        return sum + p.price * item.quantity;
      }, 0);

      const now = new Date().toISOString();
      const orderId = randomUUID();
      const orderItems = normalized.map((item) => {
        const p = products.get(item.productId)!;
        return {
          id: randomUUID(),
          orderId,
          productId: p.id,
          quantity: item.quantity,
          priceAtPurchase: p.price,
          product: {
            id: p.id,
            name: p.name,
            slug: p.slug,
            imageUrl: p.imageUrl
          }
        };
      });

      tx.set(db.collection('orders').doc(orderId), {
        id: orderId,
        status,
        paymentStatus,
        paymentMethod,
        customerName,
        email,
        phone,
        address,
        message,
        total,
        createdAt: now,
        updatedAt: now,
        items: orderItems
      });

      return { id: orderId };
    });

    return NextResponse.json({ ok: true, orderId: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to place order.';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
