import React from 'react';

type Props = {
  icon: string;
  title: string;
  body: string;
};

export default function ProcessStep({ icon, title, body }: Props) {
  return (
    <div className="step">
      <div className="step-num">
        <span className="step-icon">{icon}</span>
      </div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
