'use client';
import { useEffect, useId, useRef } from 'react';
import { Check } from 'lucide-react';

/*
  Popup konfirmasi sukses untuk aksi seperti Setuju, Simpan, Kirim. Tampilannya sama dengan
  notifikasi "Laporan Berhasil Diunduh" (kelas fx-modal-ok), jadi semua konfirmasi terasa satu keluarga.
  Muncul bila `pesan` terisi, tertutup lewat tombol Tutup, Escape, atau klik di luar kotak.
*/
export function NotifSukses({ pesan, judul = 'Berhasil', onClose }: { pesan: string; judul?: string; onClose: () => void }) {
  const idJudul = useId();
  const tombol = useRef<HTMLButtonElement>(null);
  // onClose biasanya fungsi baru di setiap render; disimpan di ref agar efek tidak berjalan ulang.
  const penutup = useRef(onClose);
  penutup.current = onClose;
  const tampil = Boolean(pesan);

  useEffect(() => {
    if (!tampil) return;
    const tekan = (event: KeyboardEvent) => { if (event.key === 'Escape') penutup.current(); };
    document.addEventListener('keydown', tekan);
    tombol.current?.focus();
    return () => document.removeEventListener('keydown', tekan);
  }, [tampil]);

  if (!tampil) return null;
  return (
    <div className="fx-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="fx-modal fx-modal-ok" role="alertdialog" aria-modal="true" aria-labelledby={idJudul} style={{ maxWidth: 460 }}>
        <span className="fx-modal-ok-icon"><Check size={26} strokeWidth={3} aria-hidden="true" /></span>
        <h2 id={idJudul}>{judul}</h2>
        <p className="fx-modal-sub">{pesan}</p>
        <button type="button" className="fx-modal-btn fx-modal-btn-full" ref={tombol} onClick={onClose}>Tutup</button>
      </div>
    </div>
  );
}
