import React from 'react';
import Link from 'next/link';

type Props = {
  to?: string;
};

export default function Logo({ to = '/' }: Props) {
  return (
    <Link className="logo" href={to}>
      <img className="logo-img" src="/logo.png" alt="MakersKatte" />
      <span className="logo-text">
        <span className="logo-main">MakersKatte</span>
        <span className="logo-sub">Made in India</span>
      </span>
    </Link>
  );
}
