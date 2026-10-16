import Link from 'next/link';
import MaterialIcon from './MaterialIcon';

const materials = ['Wood', 'Acrylic', 'Glass', 'Metal', 'Leather'];

export default function MaterialLinks() {
  return <div className="material-links" aria-label="Shop by category">
    {materials.map((name) => <Link key={name} href={`/shop?category=${encodeURIComponent(name)}`}>
      <MaterialIcon name={name} />
      <span>{name}</span>
    </Link>)}
  </div>;
}
