import type { Peran } from '@/types';

export type ProfilDemo = { nama: string; email: string; peran: Peran };
export const kunciProfilDemo = 'roomfinds-demo-profil';

export const akunDemo: ProfilDemo[] = [
  { nama: 'Zulfan', email: 'zulfan@email.com', peran: 'USER' },
  { nama: 'Fariz', email: 'fariz@email.com', peran: 'PEMILIK' },
  { nama: 'Dynoadmin', email: 'dynoadmin@roomfinds.id', peran: 'SUPERADMIN' },
];

export function bacaProfilDemo(): ProfilDemo | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(kunciProfilDemo) ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const profil = value as Partial<ProfilDemo>;
    return typeof profil.nama === 'string' && typeof profil.email === 'string' &&
      (profil.peran === 'USER' || profil.peran === 'PEMILIK' || profil.peran === 'SUPERADMIN')
      ? profil as ProfilDemo : null;
  } catch {
    return null;
  }
}

export function tujuanBooking(search: string): string {
  const next = new URLSearchParams(search).get('next');
  if (!next) return '';
  try {
    const url = new URL(next, window.location.origin);
    if (url.origin !== window.location.origin || url.pathname !== '/user/booking/baru') return '';
    const kamar = url.searchParams.get('kamar') ?? '';
    const paket = url.searchParams.get('paket') ?? '0';
    if (!/^[1-9]\d*$/.test(kamar) || !/^\d+$/.test(paket)) return '';
    return `/user/booking/baru?${new URLSearchParams({ kamar, paket })}`;
  } catch {
    return '';
  }
}

export const berandaPeran = (peran?: string) => peran === 'PEMILIK' ? '/pemilik' : peran === 'SUPERADMIN' ? '/admin' : '/user/booking';
