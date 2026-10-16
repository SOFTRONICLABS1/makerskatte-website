import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';
import CustomOrderReviewClient from './reviewClient';
import { getCustomOrderSettings } from '@/lib/customOrderSettings';

export default async function CustomOrderReviewPage() {
  const settings = await getCustomOrderSettings();

  return (
    <Layout announcement="🔥 Review your custom order before submitting">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Custom Order', to: '/custom-order' },
          { label: 'Upload', to: '/custom-order/upload' },
          { label: 'Review' }
        ]}
      />
      {!settings.enabled ? <div className="muted-block">{settings.message}</div> : <CustomOrderReviewClient />}
    </Layout>
  );
}
