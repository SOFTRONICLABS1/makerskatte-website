import React from 'react';

type Props = {
  icon: string;
  name: string;
  count: string;
  label?: string;
};

export default function OccasionCard({ icon, name, count, label }: Props) {
  return (
    <div className="occ-card">
      {label ? <span className="occ-label">{label}</span> : null}
      <span className="occ-icon">{icon}</span>
      <div className="occ-name">{name}</div>
      <div className="occ-count">{count}</div>
    </div>
  );
}
