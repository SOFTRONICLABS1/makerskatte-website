import React from 'react';

type Props = {
  icon: string;
  title: string;
  description: string;
};

export default function PromoCard({ icon, title, description }: Props) {
  return (
    <div className="promo-card">
      <div className="promo-icon">{icon}</div>
      <div>
        <div className="promo-title">{title}</div>
        <div className="promo-desc">{description}</div>
      </div>
    </div>
  );
}
