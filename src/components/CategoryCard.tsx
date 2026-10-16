import React from 'react';
import Link from 'next/link';

type Props = {
  icon: React.ReactNode;
  name: string;
  count: string;
  href?: string;
};

export default function CategoryCard({ icon, name, count, href }: Props) {
  const content = (
    <>
      <span className="cat-icon">{icon}</span>
      <div className="cat-name">{name}</div>
      <div className="cat-count">{count}</div>
    </>
  );

  if (href) {
    return (
      <Link className="cat-card" href={href} aria-label={`Browse category ${name}`}>
        {content}
      </Link>
    );
  }

  return <div className="cat-card">{content}</div>;
}
