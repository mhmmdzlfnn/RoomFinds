'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Dialog } from '@/components/owner/DashboardModals';
import { get } from '@/lib/api';
import { rupiah } from '@/lib/format';
import type { ApiBill } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
export const kunciPopupLogin = 'roomfinds-popup-login';

type Pengingat = { sisa: number; jatuhTempo: string; terlambat: boolean; hari: number };

const hariBeda = (iso: string) => Math.round((new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
const tanggalPanjang = (iso: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

// Muncul sekali setelah penyewa berhasil masuk, hanya jika ada tagihan yang jatuh tempo atau terlambat.
export function PopupLogin() {
  const [pengingat, setPengingat] = useState<Pengingat | null>(null);

  useEffect(() => {
    let bendera = false;
    try { bendera = sessionStorage.getItem(kunciPopupLogin) === '1'; sessionStorage.removeItem(kunciPopupLogin); } catch { /* sesi tidak tersedia */ }
    if (!bendera) return;
    let aktif = true;
    if (useMock) {
      setPengingat({ sisa: 1668750, jatuhTempo: '2026-11-05', terlambat: false, hari: 3 });
      return;
    }
    get<ApiBill[]>('/api/tagihan/saya').then(daftar => {
      if (!aktif) return;
      const buka = daftar.filter(b => b.status !== 'LUNAS' && b.sisa > 0).sort((a, b) => a.jatuhTempo.localeCompare(b.jatuhTempo))[0];
      if (!buka) return;
      const hari = hariBeda(buka.jatuhTempo);
      if (hari > 7) return;
      setPengingat({ sisa: buka.sisa, jatuhTempo: buka.jatuhTempo, terlambat: hari < 0, hari });
    }).catch(() => { /* tanpa pop-up bila tagihan tidak dapat dimuat */ });
    return () => { aktif = false; };
  }, []);

  if (!pengingat) return null;
  const { sisa, jatuhTempo, terlambat, hari } = pengingat;
  return (
    <Dialog judul={terlambat ? 'Tagihan Anda Sudah Terlambat' : 'Pengingat Tagihan'} sub={terlambat ? 'Denda keterlambatan dapat bertambah setiap hari.' : 'Ada tagihan yang segera jatuh tempo.'} onClose={() => setPengingat(null)} lebar={460}>
      <div className="fx-popup-isi">
        <span className={terlambat ? 'merah' : ''}><CalendarClock size={22} aria-hidden="true" /></span>
        <div>
          <b>{rupiah(sisa)}</b>
          <small>Jatuh tempo {tanggalPanjang(jatuhTempo)} · {terlambat ? `terlambat ${Math.abs(hari)} hari` : hari === 0 ? 'hari ini' : `${hari} hari lagi`}</small>
        </div>
      </div>
      <div className="fx-modal-actions fx-modal-actions-plain">
        <button type="button" className="fx-modal-btn fx-modal-btn-outline" onClick={() => setPengingat(null)}>Nanti</button>
        <Link className="fx-modal-btn" href="/user/tagihan" onClick={() => setPengingat(null)}>Lihat Tagihan</Link>
      </div>
    </Dialog>
  );
}
