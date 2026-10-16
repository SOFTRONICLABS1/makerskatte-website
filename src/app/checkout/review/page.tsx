import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';
import CheckoutReviewClient from './reviewClient';

export default function CheckoutReviewPage() {
  return (
    <Layout announcement="🧾 Review delivery details and proceed (demo checkout)">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <CheckoutReviewClient />
    </Layout>
  );
}
