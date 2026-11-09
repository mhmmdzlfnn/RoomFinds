import type { ApiAdminKos, ApiAdminStats, ApiAdminUser } from '@/types';

export type AdminKos = ApiAdminKos & { diverifikasiPada?: string | null };
export type AdminUser = ApiAdminUser & { kosNama?: string | null; alasanNonaktif?: string | null; kodeId?: string; diblokirPada?: string | null };

export const demoStats: ApiAdminStats = { jumlahPenggunaPerPeran: { USER: 186, PEMILIK: 24, SUPERADMIN: 1 }, jumlahKosMenunggu: 6, kosPerStatus: { TERVERIFIKASI: 18, MENUNGGU: 6, DITOLAK: 2, DINONAKTIFKAN: 0 }, kamarKosong: 47, hargaRataRata: 1450000, tingkatHunian: 82 };

export const demoQueue: AdminKos[] = [
  { id: 3, nama: 'Kos Dahlia', alamat: 'Jl. Kebayoran Baru No. 8, Jakarta Selatan', kodePos: '12120', aturanKos: 'Dilarang merokok di dalam kamar. Jaga kebersihan area bersama.', statusVerifikasi: 'MENUNGGU', jumlahKamar: 12, pemilikNama: 'Ahmad Fauzi', pemilikEmail: 'ahmad.fauzi@email.com', dibuatPada: '2026-10-20T09:00:00' },
  { id: 4, nama: 'Kos Kenanga Indah', alamat: 'Jl. Tebet Raya No. 45, Jakarta Selatan', kodePos: '12810', aturanKos: 'Jam bertamu sampai pukul 22.00. Jaga kebersihan area bersama.', statusVerifikasi: 'MENUNGGU', jumlahKamar: 0, pemilikNama: 'Dewi Lestari', pemilikEmail: 'dewi.lestari@email.com', dibuatPada: '2026-10-21T15:20:00' },
];

export const demoUsers: AdminUser[] = [
  { id: 2, nama: 'Zulfan', email: 'zulfan@email.com', noHp: '081234567891', peran: 'USER', aktif: true, kodeId: 'RF-USR-8921', dibuatPada: '2026-05-12T09:00:00' },
  { id: 1, nama: 'Fariz', email: 'fariz@email.com', noHp: '081234567890', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Melati Putri', kodeId: 'RF-OWN-3341', dibuatPada: '2026-05-10T09:00:00' },
  { id: 3, nama: 'Ahmad Fauzi', email: 'ahmad.fauzi@email.com', noHp: '081234567892', peran: 'PEMILIK', aktif: false, kosNama: 'Kos Dahlia', alasanNonaktif: 'Melanggar aturan verifikasi kos (foto fasilitas tidak sesuai kenyataan).', diblokirPada: '2024-10-14T09:00:00', kodeId: 'RF-OWN-1092', dibuatPada: '2026-10-22T08:00:00' },
  { id: 5, nama: 'Sulthan', email: 'sulthan@email.com', noHp: '081234567900', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Anggrek Tebet', kodeId: 'RF-OWN-2100', dibuatPada: '2026-06-01T09:00:00' },
  { id: 6, nama: 'Rino', email: 'rino@email.com', noHp: '081234567901', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Kenanga Mampang', kodeId: 'RF-OWN-2237', dibuatPada: '2026-06-02T09:00:00' },
  { id: 7, nama: 'Aulia', email: 'aulia@email.com', noHp: '081234567902', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Cempaka Cilandak', kodeId: 'RF-OWN-2374', dibuatPada: '2026-06-03T09:00:00' },
  { id: 8, nama: 'Hafizh', email: 'hafizh@email.com', noHp: '081234567903', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Dahlia Pejaten', kodeId: 'RF-OWN-2511', dibuatPada: '2026-06-04T09:00:00' },
  { id: 9, nama: 'Vada', email: 'vada@email.com', noHp: '081234567904', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Flamboyan Kebayoran', kodeId: 'RF-OWN-2648', dibuatPada: '2026-06-05T09:00:00' },
  { id: 10, nama: 'Naya', email: 'naya@email.com', noHp: '081234567905', peran: 'PEMILIK', aktif: true, kodeId: 'RF-OWN-2785', dibuatPada: '2026-06-06T09:00:00' },
  { id: 4, nama: 'Dynoadmin', email: 'dynoadmin@roomfinds.id', noHp: '081234567893', peran: 'SUPERADMIN', aktif: true, dibuatPada: '2026-05-01T09:00:00' },
];
