import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';
import CustomOrderStep1Client from './CustomOrderStep1Client';
import { getCustomOrderSettings } from '@/lib/customOrderSettings';
import InstagramMessageButton from '@/components/InstagramMessageButton';

export const dynamic = 'force-dynamic';

export default async function CustomOrderPage() {
  const settings = await getCustomOrderSettings();

  return (
    <Layout announcement="🔥 Bulk orders get up to 40% off | Free design consultation | WhatsApp: +91 8095047273">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Custom Order' }]} />

      {!settings.enabled ? (
        <div className="page-hero" style={{ paddingBottom: '1rem' }}>
          <div>
            <div className="eyebrow">Custom Order</div>
            <h1>
              Currently <span>Unavailable</span>
            </h1>
            <p>{settings.message}</p>
            <InstagramMessageButton username={settings.instagramUsername} />
          </div>
        </div>
      ) : (
        <>
          <div className="page-hero">
            <div>
              <div className="eyebrow">100% Custom Made</div>
              <h1>
                Your Design,
                <br />
                <span>Your Vision</span>
              </h1>
              <p>
                Choose material & size, upload your design/photo, then review all details before submitting your request.
              </p>
              <InstagramMessageButton username={settings.instagramUsername} />
            </div>
            <div className="hero-steps">
              <div className="h-step">
                <div className="h-step-num">1</div>
                <div className="h-step-info">
                  <h4>Choose Material & Size</h4>
                  <p>Pick what you want engraved on</p>
                </div>
              </div>
              <div className="h-step">
                <div className="h-step-num">2</div>
                <div className="h-step-info">
                  <h4>Upload Photo / Design</h4>
                  <p>Upload and add instructions</p>
                </div>
              </div>
              <div className="h-step">
                <div className="h-step-num">3</div>
                <div className="h-step-info">
                  <h4>Review & Submit</h4>
                  <p>Confirm details and submit</p>
                </div>
              </div>
              <div className="h-step">
                <div className="h-step-num">4</div>
                <div className="h-step-info">
                  <h4>Delivered in 48–72hrs</h4>
                  <p>Pan-India shipping with live tracking</p>
                </div>
              </div>
            </div>
          </div>

          <CustomOrderStep1Client />
        </>
      )}
    </Layout>
  );
}
