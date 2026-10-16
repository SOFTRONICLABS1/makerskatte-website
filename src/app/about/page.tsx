import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';

export default function AboutPage() {
  return (
    <Layout announcement="🔥 Free shipping across India on orders above ₹999 | Custom corporate orders available | COD accepted">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />
      <div className="page-hero">
        <div className="eyebrow">About MakersKatte</div>
        <h1>
          Our <span>Story</span>
        </h1>
        <p>We craft premium laser engravings for gifts, awards, and custom orders across India.</p>
      </div>
      <section>
        <div className="section-header">
          <div className="section-eyebrow">Craftsmanship</div>
          <h2 className="sec">
            Precision <span>Meets Art</span>
          </h2>
          <p className="section-desc">
            From wood and acrylic to crystal and metal, our studio blends artistry with high‑precision laser technology.
          </p>
        </div>
      </section>
    </Layout>
  );
}
