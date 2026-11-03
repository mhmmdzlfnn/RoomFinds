import type { ApiBill, ApiLaporan } from '@/types';

// Bentuk data owner mengikuti respons API yang sudah diratakan, bukan model User.
export const demoTagihan: ApiBill[] = [
  { id: 1, bookingId: 3, periode: '2026-10', jatuhTempo: '2026-11-05', penyewaNama: 'Budi Santoso', kamarNomor: '204', kosNama: 'Kos Melati Putri', total: 1668750, terbayar: 0, sisa: 1668750, denda: 0, status: 'BELUM_BAYAR', meteranAwal: 1240, meteranAkhir: null, items: [
    { jenis: 'SEWA', keterangan: 'Sewa kamar eksklusif', subtotal: 1500000 },
    { jenis: 'TETAP', keterangan: 'WiFi', subtotal: 50000 },
    { jenis: 'TETAP', keterangan: 'Kebersihan', subtotal: 25000 },
    { jenis: 'PEMAKAIAN', keterangan: 'Listrik', subtotal: 93750, meteranAwal: 1240, tarifPerUnit: 1500, satuan: 'kWh' },
  ] },
  { id: 2, bookingId: 1, periode: '2026-10', jatuhTempo: '2026-11-05', penyewaNama: 'Rina Aulia', kamarNomor: '102', kosNama: 'Kos Melati Putri', total: 1250000, terbayar: 1250000, sisa: 0, denda: 0, status: 'LUNAS', meteranAwal: 1120, meteranAkhir: 1170, items: [{ jenis: 'SEWA', keterangan: 'Sewa kamar standar', subtotal: 1250000 }] },
  { id: 3, bookingId: 2, periode: '2026-10', jatuhTempo: '2026-10-05', penyewaNama: 'Dimas Pratama', kamarNomor: '305', kosNama: 'Kos Melati Putri', total: 2110000, terbayar: 0, sisa: 2110000, denda: 10000, status: 'TERLAMBAT', meteranAwal: 1240, meteranAkhir: null, items: [{ jenis: 'SEWA', keterangan: 'Sewa kamar eksklusif', subtotal: 2100000 }] },
];

export const demoLaporan: ApiLaporan = { periode: '2026-10', pendapatan: 28400000, tunggakan: 3337500, kamarTerisi: 19, jumlahKamar: 22 };
export const demoPendapatan = [
  { periode: '2026-05', pendapatan: 24800000 }, { periode: '2026-06', pendapatan: 26100000 },
  { periode: '2026-07', pendapatan: 25400000 }, { periode: '2026-08', pendapatan: 27200000 },
  { periode: '2026-09', pendapatan: 26900000 }, { periode: '2026-10', pendapatan: 28400000 },
];

export function DemoNotice() {
  return process.env.NEXT_PUBLIC_USE_MOCK === 'true'
    ? <p className="note mb-16" role="status">Mode demo: perubahan hanya berlaku selama halaman ini dibuka, tidak dikirim ke server.</p>
    : null;
}
