import { get } from '@/lib/api';
import { statusTagihan, tanggal, tanggalWaktu } from '@/lib/format';
import type { ApiBill, ApiOwnerBooking, ApiOwnerRoom, ApiPayment } from '@/types';
import type { Bagian, InfoDokumen } from '@/lib/unduh';

/*
  Mengumpulkan isi laporan operasional pemilik menjadi tabel siap cetak.
  Mode demo memakai data contoh yang sama dengan yang tampil di layar.
  Mode API menghitung dari endpoint yang sama dengan halaman Tagihan, Booking,
  dan Pembayaran, bukan angka tetap.
*/

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const isiLaporan = ['Ringkasan Keuangan', 'Daftar Tagihan', 'Daftar Penghuni', 'Riwayat Pembayaran'] as const;
export type IsiLaporan = (typeof isiLaporan)[number];

const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
/** "Oktober 2026" menjadi "2026-10". */
export function periodeIso(label: string) {
  const [nama, tahun] = label.split(' ');
  const indeks = bulan.indexOf(nama);
  return indeks < 0 || !tahun ? '' : `${tahun}-${String(indeks + 1).padStart(2, '0')}`;
}

const tgl = (nilai?: string | null) => (nilai ? tanggal(nilai) : '');
const metodeLabel: Record<string, string> = { TRANSFER: 'Transfer', TUNAI: 'Tunai' };
const statusBayarLabel: Record<string, string> = { MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi', DITERIMA: 'Diterima', DITOLAK: 'Ditolak' };
const label = (peta: Record<string, string | { label: string }>, kunci: string) => {
  const nilai = peta[kunci];
  return typeof nilai === 'string' ? nilai : nilai?.label ?? kunci;
};

type Sumber = {
  namaKos: string;
  tagihan: ApiBill[];
  penghuni: ApiOwnerBooking[];
  pembayaran: ApiPayment[];
  ringkasan: { pendapatan: number | null; tunggakan: number | null; terisi: number | null; jumlahKamar: number | null };
};

async function muatSumber(label: string, iso: string, isi: string[], namaKosCadangan: string): Promise<Sumber> {
  if (useMock) {
    const [{ demoTagihan, demoLaporan, demoPendapatan }, { mock: demoBooking }, { mockPay }] = await Promise.all([
      import('@/components/owner/demo'),
      import('@/components/owner/BookingSection'),
      import('@/components/owner/PembayaranSection'),
    ]);
    const penuh = demoLaporan.periode === iso;
    return {
      namaKos: namaKosCadangan,
      tagihan: demoTagihan.filter((t) => t.periode === iso),
      penghuni: demoBooking,
      pembayaran: mockPay,
      ringkasan: {
        pendapatan: penuh ? demoLaporan.pendapatan : demoPendapatan.find((p) => p.periode === iso)?.pendapatan ?? null,
        tunggakan: penuh ? demoLaporan.tunggakan : null,
        terisi: penuh ? demoLaporan.kamarTerisi : null,
        jumlahKamar: penuh ? demoLaporan.jumlahKamar : null,
      },
    };
  }
  const daftarKos = await get<Array<{ id: number; nama?: string }>>('/api/kos');
  const kos = daftarKos[0];
  if (!kos) throw new Error('Belum ada kos yang terdaftar untuk dibuatkan laporan.');
  const butuhTagihan = isi.includes('Daftar Tagihan') || isi.includes('Ringkasan Keuangan');
  const [tagihan, kamar, penghuni, pembayaran] = await Promise.all([
    butuhTagihan ? get<ApiBill[]>(`/api/kos/${kos.id}/tagihan?periode=${iso}`) : Promise.resolve([] as ApiBill[]),
    isi.includes('Ringkasan Keuangan') ? get<ApiOwnerRoom[]>(`/api/kos/${kos.id}/kamar`) : Promise.resolve([] as ApiOwnerRoom[]),
    isi.includes('Daftar Penghuni') ? get<ApiOwnerBooking[]>(`/api/kos/${kos.id}/booking`) : Promise.resolve([] as ApiOwnerBooking[]),
    isi.includes('Riwayat Pembayaran') ? get<ApiPayment[]>('/api/pembayaran/riwayat') : Promise.resolve([] as ApiPayment[]),
  ]);
  return {
    namaKos: kos.nama ?? namaKosCadangan,
    tagihan,
    penghuni,
    pembayaran,
    ringkasan: {
      pendapatan: tagihan.reduce((jumlah, t) => jumlah + t.terbayar, 0),
      tunggakan: tagihan.filter((t) => t.status !== 'LUNAS').reduce((jumlah, t) => jumlah + t.sisa, 0),
      terisi: kamar.length ? kamar.filter((k) => k.status === 'TERISI').length : null,
      jumlahKamar: kamar.length || null,
    },
  };
}

export async function kumpulkanLaporan(periodeLabel: string, isi: string[], namaKosCadangan: string): Promise<{ bagian: Bagian[]; info: InfoDokumen }> {
  const iso = periodeIso(periodeLabel);
  const sumber = await muatSumber(periodeLabel, iso, isi, namaKosCadangan);
  const bagian: Bagian[] = [];

  if (isi.includes('Ringkasan Keuangan')) {
    const r = sumber.ringkasan;
    const baris: Bagian['baris'] = [];
    if (r.pendapatan !== null) baris.push(['Pendapatan terkumpul', r.pendapatan, 'Rp']);
    if (r.tunggakan !== null) baris.push(['Total tunggakan', r.tunggakan, 'Rp']);
    if (r.terisi !== null && r.jumlahKamar) {
      baris.push(['Kamar terisi', r.terisi, 'kamar'], ['Jumlah kamar', r.jumlahKamar, 'kamar'], ['Tingkat hunian', Math.round((r.terisi / r.jumlahKamar) * 100), '%']);
    }
    if (sumber.tagihan.length) {
      baris.push(
        ['Jumlah tagihan', sumber.tagihan.length, 'tagihan'],
        ['Tagihan lunas', sumber.tagihan.filter((t) => t.status === 'LUNAS').length, 'tagihan'],
        ['Tagihan belum lunas', sumber.tagihan.filter((t) => t.status !== 'LUNAS').length, 'tagihan'],
      );
    }
    bagian.push({
      judul: 'Ringkasan Keuangan',
      kolom: [{ judul: 'Keterangan', lebar: 28 }, { judul: 'Jumlah', jenis: 'angka', lebar: 16 }, { judul: 'Satuan', lebar: 12 }],
      baris,
      keterangan: 'Belum ada data keuangan untuk periode ini.',
    });
  }

  if (isi.includes('Daftar Tagihan')) {
    bagian.push({
      judul: 'Daftar Tagihan',
      kolom: [
        { judul: 'Kamar', lebar: 10 }, { judul: 'Penyewa', lebar: 22 }, { judul: 'Jatuh Tempo', lebar: 16 },
        { judul: 'Total', jenis: 'rupiah', lebar: 16 }, { judul: 'Terbayar', jenis: 'rupiah', lebar: 16 },
        { judul: 'Sisa', jenis: 'rupiah', lebar: 16 }, { judul: 'Denda', jenis: 'rupiah', lebar: 14 }, { judul: 'Status', lebar: 16 },
      ],
      baris: [...sumber.tagihan].sort((a, b) => a.kamarNomor.localeCompare(b.kamarNomor)).map((t) => [
        t.kamarNomor, t.penyewaNama ?? '', tgl(t.jatuhTempo), t.total, t.terbayar, t.sisa, t.denda, label(statusTagihan, t.status),
      ]),
      keterangan: 'Tidak ada tagihan pada periode ini.',
    });
  }

  if (isi.includes('Daftar Penghuni')) {
    bagian.push({
      judul: 'Daftar Penghuni',
      kolom: [
        { judul: 'Kamar', lebar: 10 }, { judul: 'Nama', lebar: 22 }, { judul: 'Email', lebar: 28 }, { judul: 'No. HP', lebar: 16 },
        { judul: 'Paket Sewa', lebar: 14 }, { judul: 'Tanggal Masuk', lebar: 16 }, { judul: 'Tanggal Selesai', lebar: 16 },
      ],
      baris: sumber.penghuni
        .filter((b) => b.status === 'DISETUJUI')
        .sort((a, b) => a.kamarNomor.localeCompare(b.kamarNomor))
        .map((b) => [b.kamarNomor, b.penyewaNama, b.email, b.noHp, b.paketNama, tgl(b.tanggalMasuk), tgl(b.tanggalSelesai)]),
      keterangan: 'Belum ada penghuni aktif.',
    });
  }

  if (isi.includes('Riwayat Pembayaran')) {
    bagian.push({
      judul: 'Riwayat Pembayaran',
      kolom: [
        { judul: 'Tanggal', lebar: 16 }, { judul: 'Penyewa', lebar: 22 }, { judul: 'Metode', lebar: 12 }, { judul: 'Bank Asal', lebar: 14 },
        { judul: 'Pengirim', lebar: 22 }, { judul: 'Jumlah', jenis: 'rupiah', lebar: 16 }, { judul: 'Status', lebar: 20 },
      ],
      baris: sumber.pembayaran
        .filter((p) => p.tanggal.startsWith(iso))
        .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
        .map((p) => [tgl(p.tanggal), p.penyewaNama ?? '', label(metodeLabel, p.metode), p.bankAsal ?? '', p.namaPengirim ?? '', p.jumlah, label(statusBayarLabel, p.status)]),
      keterangan: 'Tidak ada pembayaran pada periode ini.',
    });
  }

  return {
    bagian,
    info: {
      judul: 'Laporan Operasional Kos',
      subjudul: `${sumber.namaKos} | Periode ${periodeLabel}`,
      catatan: [`Dibuat ${tanggalWaktu(new Date().toISOString())}`, ...(useMock ? ['Data demo, bukan data nyata.'] : [])],
    },
  };
}
