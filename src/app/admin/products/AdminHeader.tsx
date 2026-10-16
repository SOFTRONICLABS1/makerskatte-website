'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminHeader({
  title = 'MakersKatte Admin',
  subtitle = 'Manage products and pricing.'
}: {
  title?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
  };

  return (
    <header className="admin-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="admin-actions">
        <Link className={`btn-outline${pathname === '/admin/products' ? ' active' : ''}`} href="/admin/products">
          Products
        </Link>
        <Link className={`btn-outline${pathname === '/admin/products/new' ? ' active' : ''}`} href="/admin/products/new">
          New Product
        </Link>
        <Link
          className={`btn-outline${pathname === '/admin/custom-order-pricing' ? ' active' : ''}`}
          href="/admin/custom-order-pricing"
        >
          Custom Pricing
        </Link>
        <Link className={`btn-outline${pathname === '/admin/custom-orders' ? ' active' : ''}`} href="/admin/custom-orders">
          Custom Orders
        </Link>
        <Link className={`btn-outline${pathname === '/admin/orders' ? ' active' : ''}`} href="/admin/orders">
          Shop Orders
        </Link>
        <Link className={`btn-outline${pathname === '/admin/account' ? ' active' : ''}`} href="/admin/account">
          Account
        </Link>
        <button className="btn-primary" type="button" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
