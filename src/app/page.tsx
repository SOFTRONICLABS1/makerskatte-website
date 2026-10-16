import Layout from '@/components/Layout';
import BasicProductCard from '@/components/BasicProductCard';
import HeroVisual from '@/components/HeroVisual';
import MaterialLinks from '@/components/MaterialLinks';
import ProcessStep from '@/components/ProcessStep';
import SectionHeader from '@/components/SectionHeader';
import { getFeaturedProducts } from '@/lib/products';

const processSteps = [
  { icon: '🎨', title: 'Choose Design', body: 'Pick from our templates or share your own artwork/logo.' },
  { icon: '✏️', title: 'Personalize', body: 'Add names, dates, quotes.' },
  { icon: '⚡', title: 'We Engrave', body: 'Our precision CO₂ lasers craft your item to perfection in 24-48hrs.' },
  { icon: '📦', title: 'Fast Delivery', body: 'Shipped across all Indian states with safe packaging & tracking.' }
];

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <Layout announcement="🔥 Free shipping across India on orders above ₹999 | Custom corporate orders available | COD accepted">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">Ideas • Materials • Precision</div>
          <h1><span>Laser</span><br />Engraving</h1>
          <p className="hero-sub">Personalized gifts, home decor, signage,<br className="desktop-break" /> corporate awards and more.</p>
          <div className="hero-actions">
            <a href="/shop" className="btn-primary">Shop Now</a>
            <a href="/custom-order" className="btn-outline">Custom Order →</a>
          </div>
          <MaterialLinks />
        </div>

        <HeroVisual />
      </section>

      <section>
        <SectionHeader
          eyebrow="Bestsellers"
          title="Featured"
          highlight="Products"
          description="Loved by thousands across India — our most gifted pieces."
        />
        <div className="products-grid featured-products-grid">
          {featuredProducts.map((product) => (
            <BasicProductCard
              key={product.id}
              name={product.name}
              href={`/product/${product.slug}`}
              imageUrl={product.imageUrl}
              isComingSoon={product.isComingSoon}
            />
          ))}
        </div>
      </section>

      <section className="process">
        <SectionHeader
          eyebrow="How It Works"
          title="Simple"
          highlight="4-Step"
          description="Order custom pieces from the comfort of your home."
        />
        <div className="process-steps">
          {processSteps.map((step) => (
            <ProcessStep key={step.title} icon={step.icon} title={step.title} body={step.body} />
          ))}
        </div>
      </section>

      <div className="custom-banner">
        <div className="banner-text">
          <h2>
            Need a <span>Bulk Order?</span>
          </h2>
          <p>Corporate gifting, wedding favours, event merchandise — we handle 50 to 50,000 pieces.</p>
        </div>
        <a href="/custom-order" className="btn-primary">
          Get a Quote →
        </a>
      </div>

    </Layout>
  );
}
