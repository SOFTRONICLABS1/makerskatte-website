'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Login service is unavailable. Please try again.' }));
        throw new Error(data.error || 'Login failed.');
      }

      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error && err.name === 'AbortError'
        ? 'Sign-in timed out. Please check your connection and try again.'
        : err instanceof Error ? err.message : 'Login failed.');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-card">
        <h1>Admin Login</h1>
        <p>Manage products, pricing, and inventory.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            autoComplete="username"
            aria-label="Email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            type="password"
            autoComplete="current-password"
            aria-label="Password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
          {error ? <div className="form-error" role="alert">{error}</div> : null}
        </form>
      </div>
    </div>
  );
}
