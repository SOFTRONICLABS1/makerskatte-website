import React from 'react';

type Props = {
  icon: string;
  tag: string;
  name: string;
  highlight: string;
  description: string;
  count: string;
};

export default function MainCategoryCard({ icon, tag, name, highlight, description, count }: Props) {
  return (
    <div className="main-cat">
      <span className="cat-bg-icon">{icon}</span>
      <div className="cat-tag">{tag}</div>
      <div className="cat-name">
        {name} <span>{highlight}</span>
      </div>
      <div className="cat-desc">{description}</div>
      <div className="cat-meta">
        <span className="cat-count-badge">{count}</span>
        <span className="cat-arrow">Explore →</span>
      </div>
    </div>
  );
}
