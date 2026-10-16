import Link from 'next/link';

type Props = {
  name: string;
  href: string;
  imageUrl?: string | null;
  isComingSoon?: boolean;
};

export default function BasicProductCard({ name, href, imageUrl, isComingSoon = false }: Props) {
  const fallback = name.trim().slice(0, 1).toUpperCase() || '•';

  return (
    <Link className="product-card featured-product-card" href={href}>
      <div className={`product-img${imageUrl ? ' has-image' : ''}`}>
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="product-fallback" aria-hidden="true">{fallback}</span>
        )}
      </div>
      <div className="product-info">
        <div className="product-name">{name}</div>
        {isComingSoon ? <div className="coming-soon-label">Coming Soon</div> : null}
      </div>
    </Link>
  );
}
