import React from 'react';

type Props = {
  icon: string;
  name: string;
  count: string;
};

export default function SubCategoryCard({ icon, name, count }: Props) {
  return (
    <div className="sub-cat">
      <span className="sc-icon">{icon}</span>
      <div className="sc-name">{name}</div>
      <div className="sc-count">{count}</div>
    </div>
  );
}
