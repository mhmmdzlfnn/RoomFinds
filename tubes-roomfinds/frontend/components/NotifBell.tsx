'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { bacaStatusBaca, daftarNotifikasi, muatNotifikasi, simpanStatusBaca, tandaiNotifikasiDibaca, waktuRelatif, type Notifikasi } from '@/lib/notifikasi';
import type { Peran } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export function NotifBell({ peran }: { peran: Peran }) {
  const [daftar, setDaftar] = useState<Notifikasi[]>(() => daftarNotifikasi(peran, useMock));
  const [baca, setBaca] = useState<string[]>([]);
  const [buka, setBuka] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);
  const tombol = useRef<HTMLButtonElement>(null);

  useEffect(() => { setBaca(bacaStatusBaca(peran)); }, [peran]);
  useEffect(() => {
    if (useMock) { setDaftar(daftarNotifikasi(peran, true)); return; }
    let aktif = true;
    const muat = () => { muatNotifikasi().then(data => { if (aktif) setDaftar(data); }).catch(() => { /* tanpa notifikasi bila gagal dimuat */ }); };
    muat();
    const berkala = setInterval(muat, 60000);
    return () => { aktif = false; clearInterval(berkala); };
  }, [peran]);
  useEffect(() => {
    if (!buka) return;
    const klikLuar = (event: MouseEvent) => { if (wadah.current && !wadah.current.contains(event.target as Node)) setBuka(false); };
    const tombolEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') { setBuka(false); tombol.current?.focus(); } };
    document.addEventListener('mousedown', klikLuar);
    document.addEventListener('keydown', tombolEsc);
    return () => { document.removeEventListener('mousedown', klikLuar); document.removeEventListener('keydown', tombolEsc); };
  }, [buka]);

  const sudahDibaca = (item: Notifikasi) => baca.includes(item.id) || (!useMock && item.dibaca === true);
  const belumBaca = daftar.filter(item => !sudahDibaca(item));
  const tandai = (ids: string[]) => {
    const baru = Array.from(new Set([...baca, ...ids]));
    setBaca(baru);
    if (useMock) simpanStatusBaca(peran, baru);
    else tandaiNotifikasiDibaca(ids).catch(() => { /* status baca tetap tersimpan di tampilan ini */ });
  };

  return (
    <div className="fx-notif" ref={wadah}>
      <button ref={tombol} type="button" className="topbar-bell-btn" aria-label={belumBaca.length ? `Notifikasi, ${belumBaca.length} belum dibaca` : 'Notifikasi'} aria-haspopup="dialog" aria-expanded={buka} onClick={() => setBuka(nilai => !nilai)}>
        {peran === 'USER' ? <img src="/figma/shell/bell.svg" width="13" height="17" alt="" /> : <Bell size={18} aria-hidden="true" />}
        {belumBaca.length > 0 && <span className="fx-notif-dot" aria-hidden="true">{belumBaca.length}</span>}
      </button>
      {buka && (
        <div className="fx-notif-panel" role="dialog" aria-label="Daftar notifikasi">
          <div className="fx-notif-head">
            <h2>Notifikasi</h2>
            <button type="button" onClick={() => tandai(daftar.map(item => item.id))} disabled={belumBaca.length === 0}>Tandai semua dibaca</button>
          </div>
          {daftar.length === 0 ? (
            <div className="fx-notif-kosong"><BellOff size={22} aria-hidden="true" /><p>Belum ada notifikasi.</p></div>
          ) : (
            <ul>
              {daftar.map(item => {
                const sudah = sudahDibaca(item);
                return (
                  <li key={item.id} className={sudah ? '' : 'baru'}>
                    <Link href={item.href} onClick={() => { tandai([item.id]); setBuka(false); }}>
                      <i className={`n-${item.nada}`} aria-hidden="true" />
                      <span><b>{item.judul}</b><small>{item.isi}</small><em>{waktuRelatif(item.waktu)}</em></span>
                      {!sudah && <u aria-label="Belum dibaca" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
