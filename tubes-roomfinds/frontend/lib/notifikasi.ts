import { get, patch } from '@/lib/api';
import type { Peran } from '@/types';

export type Notifikasi = {
  id: string;
  judul: string;
  isi: string;
  waktu: string;
  href: string;
  nada: 'merah' | 'kuning' | 'hijau' | 'biru';
  dibaca?: boolean;
};

// Mode API: notifikasi dihitung backend dari data tagihan, booking, pembayaran, dan keluhan.
export const muatNotifikasi = () => get<Notifikasi[]>('/api/notifikasi');
export const tandaiNotifikasiDibaca = (ids: string[]) => patch<{ ditandai: number }>('/api/notifikasi/baca', { ids });

const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
// Waktu dari backend berformat ISO; teks demo seperti "Hari ini" dikembalikan apa adanya.
export function waktuRelatif(nilai: string): string {
  const waktu = new Date(nilai);
  if (Number.isNaN(waktu.getTime())) return nilai;
  const hari = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(waktu).setHours(0, 0, 0, 0)) / 86400000);
  if (hari <= 0) return 'Hari ini';
  if (hari < 7) return `${hari} hari lalu`;
  return `${waktu.getDate()} ${namaBulan[waktu.getMonth()]} ${waktu.getFullYear()}`;
}

// Data contoh notifikasi (mode demo).
const demo: Record<Peran, Notifikasi[]> = {
  USER: [
    { id: 'u-tagihan', judul: 'Tagihan Oktober 2026 segera jatuh tempo', isi: 'Rp1.668.750 · jatuh tempo 5 November 2026 (3 hari lagi).', waktu: 'Hari ini', href: '/user/tagihan', nada: 'kuning' },
    { id: 'u-booking', judul: 'Booking Kamar 306 menunggu konfirmasi', isi: 'Pemilik Kos Dahlia Pejaten sedang meninjau pengajuan booking Anda.', waktu: '2 hari lalu', href: '/user/booking', nada: 'biru' },
    { id: 'u-bayar', judul: 'Pembayaran Rp1.668.750 diterima', isi: 'Diverifikasi oleh pemilik kos pada 4 Okt 2026.', waktu: '4 Okt 2026', href: '/user/tagihan', nada: 'hijau' },
    { id: 'u-keluhan', judul: 'Keluhan Anda sedang diproses', isi: 'AC kamar meneteskan air. Teknisi datang besok pukul 10.00.', waktu: '12 Okt 2026', href: '/user/keluhan', nada: 'biru' },
  ],
  PEMILIK: [
    { id: 'p-booking', judul: '1 booking menunggu persetujuan', isi: 'Calon penyewa baru Nabila Putri di Kamar 105.', waktu: 'Hari ini', href: '/pemilik/booking', nada: 'kuning' },
    { id: 'p-bayar', judul: '2 pembayaran menunggu verifikasi', isi: 'Transfer dari Zulfan (BCA) dan Rian Hidayat (Mandiri).', waktu: 'Hari ini', href: '/pemilik/pembayaran', nada: 'kuning' },
    { id: 'p-tunda', judul: 'Pengajuan penundaan dari Siti Aminah', isi: 'Jatuh tempo 5 November diminta mundur ke 12 November.', waktu: '1 hari lalu', href: '/pemilik/pembayaran', nada: 'biru' },
    { id: 'p-keluhan', judul: 'Keluhan baru dilaporkan', isi: 'Kamar 204: lampu kamar mati sejak kemarin malam.', waktu: '2 hari lalu', href: '/pemilik/keluhan', nada: 'merah' },
    { id: 'p-meteran', judul: '2 meteran bulan ini belum diisi', isi: 'Kamar 207 dan 305.', waktu: '3 hari lalu', href: '/pemilik/tagihan', nada: 'kuning' },
  ],
  SUPERADMIN: [
    { id: 'a-kos', judul: '2 kos menunggu verifikasi', isi: 'Kos Dahlia dan Kos Kenanga Indah menunggu peninjauan.', waktu: 'Hari ini', href: '/admin/verifikasi', nada: 'kuning' },
    { id: 'a-akun', judul: 'Akun Ahmad Fauzi diblokir', isi: 'Melanggar aturan verifikasi kos.', waktu: '24 Okt 2026', href: '/admin/akun', nada: 'merah' },
  ],
};

const kunci = (peran: Peran) => `roomfinds-notif-baca-${peran}`;

export function daftarNotifikasi(peran: Peran, mock: boolean): Notifikasi[] {
  return mock ? demo[peran] : [];
}

export function bacaStatusBaca(peran: Peran): string[] {
  try {
    const nilai: unknown = JSON.parse(localStorage.getItem(kunci(peran)) ?? '[]');
    return Array.isArray(nilai) ? nilai.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function simpanStatusBaca(peran: Peran, ids: string[]) {
  try {
    localStorage.setItem(kunci(peran), JSON.stringify(ids));
  } catch {
    // penyimpanan tidak tersedia: status baca hanya berlaku selama halaman terbuka
  }
}
