import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';
import CustomOrderUploadClient from './uploadClient';
import { getCustomOrderSettings } from '@/lib/customOrderSettings';

export default async function CustomOrderUploadPage() {
  const settings = await getCustomOrderSettings();

  return (
    <Layout announcement="🔥 Upload your photo/design and proceed">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Custom Order', to: '/custom-order' }, { label: 'Upload' }]} />
      {!settings.enabled ? <div className="muted-block">{settings.message}</div> : <CustomOrderUploadClient />}
    </Layout>
  );
}
