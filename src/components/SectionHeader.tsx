import React from 'react';

type Props = {
  eyebrow: string;
  title: string;
  highlight?: string;
  description?: string;
};

export default function SectionHeader({ eyebrow, title, highlight, description }: Props) {
  return (
    <div className="section-header">
      <div className="section-eyebrow">{eyebrow}</div>
      <h2>
        {title} {highlight ? <span>{highlight}</span> : null}
      </h2>
      {description ? <p className="section-desc">{description}</p> : null}
    </div>
  );
}
