import React from 'react';

type Props = {
  stars: string;
  quote: string;
  initials: string;
  name: string;
  location: string;
};

export default function TestimonialCard({ stars, quote, initials, name, location }: Props) {
  return (
    <div className="testimonial">
      <div className="stars">{stars}</div>
      <p>{quote}</p>
      <div className="reviewer">
        <div className="reviewer-avatar">{initials}</div>
        <div>
          <div className="reviewer-name">{name}</div>
          <div className="reviewer-loc">{location}</div>
        </div>
      </div>
    </div>
  );
}
