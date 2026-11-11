import type { ApiAdminKos, ApiAdminStats, ApiAdminUser } from '@/types';
import { kamarDemo, lokasiKosDemo } from '../kamar/demo';

export type AdminKos = ApiAdminKos & { diverifikasiPada?: string | null };
export type AdminUser = ApiAdminUser & { kosNama?: string | null; alasanNonaktif?: string | null; kodeId?: string; diblokirPada?: string | null };

export const demoQueue: AdminKos[] = [
  { id: 3, nama: 'Kos Dahlia', alamat: 'Jl. Kebayoran Baru No. 8, Jakarta Selatan', kodePos: '12120', aturanKos: 'Dilarang merokok di dalam kamar. Jaga kebersihan area bersama.', statusVerifikasi: 'MENUNGGU', jumlahKamar: 12, pemilikNama: 'Ahmad Fauzi', pemilikEmail: 'ahmad.fauzi@email.com', dibuatPada: '2026-10-20T09:00:00' },
  { id: 4, nama: 'Kos Kenanga Indah', alamat: 'Jl. Tebet Raya No. 45, Jakarta Selatan', kodePos: '12810', aturanKos: 'Jam bertamu sampai pukul 22.00. Jaga kebersihan area bersama.', statusVerifikasi: 'MENUNGGU', jumlahKamar: 0, pemilikNama: 'Dewi Lestari', pemilikEmail: 'dewi.lestari@email.com', dibuatPada: '2026-10-21T15:20:00' },
];

export const demoUsers: AdminUser[] = [
  { id: 2, nama: 'Zulfan', email: 'zulfan@email.com', noHp: '081234567891', peran: 'USER', aktif: true, kodeId: 'RF-USR-8921', dibuatPada: '2026-05-12T09:00:00' },
  { id: 1, nama: 'Fariz', email: 'fariz@email.com', noHp: '081234567890', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Melati Putri', kodeId: 'RF-OWN-3341', dibuatPada: '2026-05-10T09:00:00' },
  { id: 3, nama: 'Ahmad Fauzi', email: 'ahmad.fauzi@email.com', noHp: '081234567892', peran: 'PEMILIK', aktif: false, kosNama: 'Kos Dahlia', alasanNonaktif: 'Melanggar aturan verifikasi kos (foto fasilitas tidak sesuai kenyataan).', diblokirPada: '2026-10-24T09:00:00', kodeId: 'RF-OWN-1092', dibuatPada: '2026-10-12T08:00:00' },
  { id: 5, nama: 'Sulthan', email: 'sulthan@email.com', noHp: '081234567900', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Anggrek Tebet', kodeId: 'RF-OWN-2100', dibuatPada: '2026-06-01T09:00:00' },
  { id: 6, nama: 'Rino', email: 'rino@email.com', noHp: '081234567901', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Kenanga Mampang', kodeId: 'RF-OWN-2237', dibuatPada: '2026-06-02T09:00:00' },
  { id: 7, nama: 'Aulia', email: 'aulia@email.com', noHp: '081234567902', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Cempaka Cilandak', kodeId: 'RF-OWN-2374', dibuatPada: '2026-06-03T09:00:00' },
  { id: 8, nama: 'Hafizh', email: 'hafizh@email.com', noHp: '081234567903', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Dahlia Pejaten', kodeId: 'RF-OWN-2511', dibuatPada: '2026-06-04T09:00:00' },
  { id: 9, nama: 'Vada', email: 'vada@email.com', noHp: '081234567904', peran: 'PEMILIK', aktif: true, kosNama: 'Kos Flamboyan Kebayoran', kodeId: 'RF-OWN-2648', dibuatPada: '2026-06-05T09:00:00' },
  { id: 10, nama: 'Naya', email: 'naya@email.com', noHp: '081234567905', peran: 'PEMILIK', aktif: true, kodeId: 'RF-OWN-2785', dibuatPada: '2026-06-06T09:00:00' },
  { id: 4, nama: 'Dynoadmin', email: 'dynoadmin@roomfinds.id', noHp: '081234567893', peran: 'SUPERADMIN', aktif: true, dibuatPada: '2026-05-01T09:00:00' },
  // Penyewa lain yang muncul di layar Pemilik (booking, tagihan, pembayaran, keluhan).
  { id: 11, nama: 'Rina Aulia', email: 'rina.aulia@email.com', noHp: '081234567894', peran: 'USER', aktif: true, kodeId: 'RF-USR-8934', dibuatPada: '2026-06-10T09:00:00' },
  { id: 12, nama: 'Dimas Pratama', email: 'dimas.pratama@email.com', noHp: '081234567895', peran: 'USER', aktif: true, kodeId: 'RF-USR-8952', dibuatPada: '2026-06-18T09:00:00' },
  { id: 13, nama: 'Siti Aminah', email: 'siti.aminah@email.com', noHp: '081234567896', peran: 'USER', aktif: true, kodeId: 'RF-USR-8967', dibuatPada: '2026-07-02T09:00:00' },
  { id: 14, nama: 'Rian Hidayat', email: 'rian.hidayat@email.com', noHp: '081234567897', peran: 'USER', aktif: true, kodeId: 'RF-USR-8978', dibuatPada: '2026-07-15T09:00:00' },
  { id: 15, nama: 'Nabila Putri', email: 'nabila.putri@email.com', noHp: '081234567898', peran: 'USER', aktif: true, kodeId: 'RF-USR-8990', dibuatPada: '2026-08-04T09:00:00' },
];

// Statistik dihitung dari data demo yang sama dengan layar lain, supaya angkanya selalu sinkron:
// akun dari demoUsers (Kelola Akun), kos terverifikasi dari katalog kos, kos menunggu dari antrean verifikasi,
// kamar kosong dari katalog publik (Pencarian), dan kamar terisi dari "19/22 Terisi" di Dashboard Pemilik.
const kamarTerisiDemo = 19;
const jumlahPeran = (peran: AdminUser['peran']) => demoUsers.filter(user => user.peran === peran).length;
const kamarKosongDemo = kamarDemo.filter(kamar => kamar.status === 'KOSONG');
const kosMenungguDemo = demoQueue.filter(kos => kos.statusVerifikasi === 'MENUNGGU').length;

export const demoStats: ApiAdminStats = {
  jumlahPenggunaPerPeran: { USER: jumlahPeran('USER'), PEMILIK: jumlahPeran('PEMILIK'), SUPERADMIN: jumlahPeran('SUPERADMIN') },
  jumlahKosMenunggu: kosMenungguDemo,
  kosPerStatus: { TERVERIFIKASI: lokasiKosDemo.length, MENUNGGU: kosMenungguDemo, DITOLAK: 0, DINONAKTIFKAN: 0 },
  kamarKosong: kamarKosongDemo.length,
  hargaRataRata: Math.round(kamarKosongDemo.reduce((jumlah, kamar) => jumlah + kamar.hargaBulanan, 0) / Math.max(1, kamarKosongDemo.length)),
  tingkatHunian: Math.round((100 * kamarTerisiDemo) / (kamarTerisiDemo + kamarKosongDemo.length)),
};
