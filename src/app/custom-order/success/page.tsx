import Layout from '@/components/Layout';
import Breadcrumb from '@/components/Breadcrumb';

export default function CustomOrderSuccessPage({ searchParams }: { searchParams: { orderId?: string; total?: string } }) {
  const orderId = searchParams?.orderId ?? '';
  const total = searchParams?.total ?? '';

  return (
    <Layout announcement="✅ Payment successful (demo)">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Custom Order', to: '/custom-order' }, { label: 'Success' }]} />

      <div className="page-hero">
        <div>
          <div className="eyebrow">Order Placed</div>
          <h1>
            Payment <span>Successful</span>
          </h1>
          <p>Your custom order has been placed. We’ll start processing it soon.</p>
        </div>
        <div />
      </div>

      <section style={{ paddingTop: 30 }}>
        <div className="muted-block" style={{ maxWidth: 900, margin: '0 auto' }}>
          <div>
            <strong>Order ID:</strong> {orderId || '—'}
          </div>
          <div style={{ marginTop: 8 }}>
            <strong>Paid Amount:</strong> {total ? `₹${total}` : '—'}
          </div>
          <div style={{ marginTop: 14 }}>
            <a className="btn-primary" href="/shop">
              Continue Shopping
            </a>{' '}
            <a className="btn-outline" href="/custom-order">
              Create Another Custom Order
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
