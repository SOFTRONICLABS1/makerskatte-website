import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';
import CheckoutPaymentClient from './paymentClient';

export default function CheckoutPaymentPage() {
  return (
    <Layout announcement="💳 Select payment method (demo) and place order">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Cart', to: '/cart' },
          { label: 'Checkout', to: '/checkout/review' },
          { label: 'Payment' }
        ]}
      />
      <CheckoutPaymentClient />
    </Layout>
  );
}
