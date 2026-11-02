import type { ApiAdminKos, ApiAdminStats, ApiAdminUser } from '@/types';

export type AdminKos = ApiAdminKos & { diverifikasiPada?: string | null };
export type AdminUser = ApiAdminUser & { kosNama?: string | null; alasanNonaktif?: string | null };

export const demoStats: ApiAdminStats = { jumlahPenggunaPerPeran: { USER: 186, PEMILIK: 24, SUPERADMIN: 1 }, jumlahKosMenunggu: 6, kosPerStatus: { TERVERIFIKASI: 18, MENUNGGU: 6, DITOLAK: 2, DINONAKTIFKAN: 0 }, kamarKosong: 47, hargaRataRata: 1450000, tingkatHunian: 82 };

export const demoQueue: AdminKos[] = [
  { id: 3, nama: 'Kos Dahlia', alamat: 'Jl. Kebayoran Baru No. 8, Jakarta Selatan', kodePos: '12120', aturanKos: 'Dilarang merokok di dalam kamar. Jaga kebersihan area bersama.', statusVerifikasi: 'MENUNGGU', jumlahKamar: 12, pemilikNama: 'Ahmad Fauzi', pemilikEmail: 'ahmad.fauzi@email.com', dibuatPada: '2026-10-22T09:00:00' },
  { id: 4, nama: 'Kos Kenanga Indah', alamat: 'Jl. Tebet Raya No. 45, Jakarta Selatan', kodePos: '12810', aturanKos: 'Jam bertamu sampai pukul 22.00. Jaga kebersihan area bersama.', statusVerifikasi: 'MENUNGGU', jumlahKamar: 0, pemilikNama: 'Dewi Lestari', pemilikEmail: 'dewi.lestari@email.com', dibuatPada: '2026-10-21T15:20:00' },
];

export const demoUsers: AdminUser[] = [
  { id: 2, nama: 'Budi Santoso', email: 'budi.santoso@email.com', noHp: '081234567891', peran: 'USER', aktif: true, dibuatPada: '2026-05-12T09:00:00' },
  { id: 1, nama: 'Sri Wahyuni', email: 'sri.wahyuni@email.com', noHp: '081234567890', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Melati Putri', dibuatPada: '2026-05-10T09:00:00' },
  { id: 3, nama: 'Ahmad Fauzi', email: 'ahmad.fauzi@email.com', noHp: '081234567892', peran: 'PEMILIK', aktif: false, kosNama: 'Kos Dahlia', alasanNonaktif: 'melanggar aturan verifikasi kos', dibuatPada: '2026-10-22T08:00:00' },
  { id: 4, nama: 'Admin Utama', email: 'admin@roomfinds.id', noHp: '081234567893', peran: 'SUPERADMIN', aktif: true, dibuatPada: '2026-05-01T09:00:00' },
];
