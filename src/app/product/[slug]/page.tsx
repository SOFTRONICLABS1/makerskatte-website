import Breadcrumb from '@/components/Breadcrumb';
import Layout from '@/components/Layout';
import RelatedProductCard from '@/components/RelatedProductCard';
import { formatPrice } from '@/lib/format';
import { getProductBySlug, getRelatedProducts } from '@/lib/products';
import { notFound } from 'next/navigation';
import ProductGallery from './ProductGallery';
import ProductPurchase from './ProductPurchase';
import MaterialIcon from '@/components/MaterialIcon';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const imageUrls: string[] = [];
  if (typeof product.imageUrls === 'string' && product.imageUrls.trim()) {
    try {
      const parsed = JSON.parse(product.imageUrls);
      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (typeof item === 'string' && item.trim()) imageUrls.push(item);
        });
      }
    } catch {
      // ignore malformed JSON
    }
  }
  if (product.imageUrl && !imageUrls.includes(product.imageUrl)) {
    imageUrls.unshift(product.imageUrl);
  }

  const related = await getRelatedProducts(product.category, product.id);

  return (
    <Layout announcement="🔥 Free shipping above ₹999 | Use code DIWALI20 for 20% off | COD Available">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Shop', to: '/shop' },
          { label: product.category ?? 'Products', to: '/categories' },
          { label: product.name }
        ]}
      />

      <div className="pd-layout">
        <ProductGallery name={product.name} badge={product.badge} imageUrls={imageUrls} />

        <div className="pd-info">
          <div className="pd-eyebrow">{product.category ?? 'Engraved Gift'} · Personalised</div>
          <h1 className="pd-title">{product.name}</h1>
          <div className="pd-rating">
            <span className="stars">★★★★★</span>
            <span className="rev-link">{product.reviews ?? 0} Reviews</span>
            <span className="sold-count">1,240+ sold</span>
          </div>
          {!product.isComingSoon ? <div className="pd-eyebrow" style={{ marginTop: 8 }}>
            Stock: <span style={{ color: 'var(--gold-light)' }}>{product.stock}</span>
          </div> : null}

          <div className="pd-price">
            <div className="main-price">{formatPrice(product.price)}</div>
            {product.originalPrice ? <div className="old-price">{formatPrice(product.originalPrice)}</div> : null}
            {product.originalPrice ? <div className="discount">Special Offer</div> : null}
            <div className="tax-note">Incl. GST</div>
          </div>

          <div className="option-section">
            <div className="option-label">Material</div>
            <div className="wood-options">
              <div className="wood-btn active">
                <MaterialIcon name={product.material ?? product.category ?? 'Wood'} />
                <span className="wood-label">{product.material ?? 'Premium Material'}</span>
              </div>
            </div>
          </div>

          {!product.isComingSoon ? <div className="personalize-box">
            <h4>Personalise Your Order</h4>
            <input type="text" placeholder="Enter name" />
            <textarea placeholder="Write a short message (max 120 chars)"></textarea>
            <div className="char-count">0 / 120</div>
          </div> : null}

          <ProductPurchase productId={product.id} stock={product.stock} isComingSoon={product.isComingSoon} />

          {!product.isComingSoon ? <div className="trust-badges">
            <div className="trust-item">
              <span>✅</span> Free Design Preview
            </div>
            <div className="trust-item">
              <span>🚚</span> 48Hr Dispatch
            </div>
            <div className="trust-item">
              <span>🛡️</span> Quality Checked
            </div>
          </div> : null}

          {!product.isComingSoon ? <div className="delivery-info">
            <div className="delivery-icon">📦</div>
            <div className="delivery-text">
              <h5>Get it by Friday, 5 April</h5>
              <p>Order within 08 hrs 24 mins for fastest delivery to Bengaluru.</p>
            </div>
          </div> : null}
        </div>
      </div>

      <div className="pd-tabs">
        <div className="tab-nav">
          <button className="tab-btn active">Description</button>
          <button className="tab-btn">Specifications</button>
          <button className="tab-btn">Reviews</button>
        </div>

        <div className="tab-content active">
          <p>{product.description ?? 'Premium laser engraving crafted to perfection.'}</p>
        </div>
      </div>

      <div className="related">
        <h3>
          Related <span>Products</span>
        </h3>
        <div className="rel-grid">
          {related.map((item) => (
            <RelatedProductCard
              key={item.id}
              name={item.name}
              price={item.price}
              href={`/product/${item.slug}`}
              productId={item.id}
              imageUrl={item.imageUrl}
              stock={item.stock}
              isComingSoon={item.isComingSoon}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
