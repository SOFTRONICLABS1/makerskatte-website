'use client';

import React, { useState } from 'react';
import AdminHeader from '@/app/admin/products/AdminHeader';

export default function AdminAccountPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus('All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      setStatus('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('New password and confirm password do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to change password.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus('Password changed successfully.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-shell">
      <AdminHeader subtitle="Manage your admin account settings." />

      <div className="admin-grid">
        <form className="admin-form" style={{ maxWidth: 640 }} onSubmit={submit}>
          <h2>Change Password</h2>

          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Updating...' : 'Update Password'}
          </button>

          {status ? <div className="muted-block">{status}</div> : null}
        </form>
      </div>
    </div>
  );
}
