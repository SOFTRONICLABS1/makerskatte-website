import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';
import CustomOrderPaymentClient from './paymentClient';
import { getCustomOrderSettings } from '@/lib/customOrderSettings';

export default async function CustomOrderPaymentPage() {
  const settings = await getCustomOrderSettings();

  return (
    <Layout announcement="🔥 Select payment method (demo) and place order">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Custom Order', to: '/custom-order' },
          { label: 'Upload', to: '/custom-order/upload' },
          { label: 'Review', to: '/custom-order/review' },
          { label: 'Payment' }
        ]}
      />
      {!settings.enabled ? <div className="muted-block">{settings.message}</div> : <CustomOrderPaymentClient />}
    </Layout>
  );
}
