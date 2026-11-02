'use client';

import { useState, type ReactNode } from 'react';
import { post } from '@/lib/api';

export function LogoutButton({ className, children }: { className: string; children: ReactNode }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function logout() {
    setError('');
    setBusy(true);
    try {
      if (process.env.NEXT_PUBLIC_USE_MOCK !== 'true') await post<void>('auth/logout');
      else localStorage.removeItem('roomfinds-demo-profil');
      window.location.assign('/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal keluar. Coba lagi.');
      setBusy(false);
    }
  }

  return <>
    <button type="button" className={className} onClick={logout} disabled={busy}>
      {busy ? 'Keluar…' : children}
    </button>
    {error && <small className="logout-error" role="alert">{error}</small>}
  </>;
}
