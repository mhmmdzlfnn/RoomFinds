import { bookingContoh } from '@/lib/mock';
import { fotoKamarBerdasarkanNomor } from '@/lib/gambar';
import type { ApiBooking, ApiDelay, ApiPaket, ApiRoom } from '@/types';

const kunciBooking = 'roomfinds-demo-booking';
const kunciPenundaan = (tagihanId: number) => `roomfinds-demo-penundaan:${tagihanId}`;
export const bookingMasihAktif = (booking: ApiBooking) => booking.status === 'MENUNGGU' || booking.status === 'DISETUJUI';

function bacaSesi<T>(key: string): T | null {
  try {
    const value = sessionStorage.getItem(key);
    return value === null ? null : JSON.parse(value) as T;
  } catch {
    throw new Error('Data demo belum dapat dibaca dari penyimpanan sesi browser.');
  }
}

function simpanSesi(key: string, value: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('Data demo belum tersimpan. Izinkan penyimpanan sesi pada browser lalu coba lagi.'); }
}

function bookingAwal(): ApiBooking[] {
  // Satu cerita: Zulfan sedang menyewa kamar 204 di Kos Melati Putri (booking disetujui),
  // sehingga tagihan, pembayaran, dan keluhan di layar lain berasal dari kontrak ini.
  return [
    {
      id: 1,
      bookingCode: 'BK-2026-7722',
      kosNama: 'Kos Dahlia Pejaten',
      kamarNomor: '306',
      tipe: 'EKSKLUSIF',
      lokasi: 'Pasar Minggu, Jakarta Selatan',
      paketNama: 'Bulanan (1 Bulan)',
      tanggalMasuk: '2026-11-15',
      tanggalSelesai: '2026-12-15',
      totalSewa: 1400000,
      status: 'MENUNGGU',
      foto: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80',
      waktuSetujuAturan: '2026-11-02T10:05:00',
    },
    {
      id: 2,
      bookingCode: 'BK-2026-6891',
      kosNama: 'Kos Melati Putri',
      kamarNomor: '204',
      tipe: 'EKSKLUSIF',
      lokasi: 'Setiabudi, Jakarta Selatan',
      paketNama: 'Semesteran (6 Bulan)',
      tanggalMasuk: '2026-09-01',
      tanggalSelesai: '2027-03-01',
      checkOut: '1 Mar 2027',
      totalSewa: 8550000,
      status: 'DISETUJUI',
      foto: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&auto=format&fit=crop&q=80',
      waktuSetujuAturan: '2026-08-20T14:32:00',
    },
    {
      id: 3,
      bookingCode: 'BK-2026-6510',
      kosNama: 'Kos Anggrek Tebet',
      kamarNomor: '304',
      tipe: 'EKSKLUSIF',
      lokasi: 'Tebet, Jakarta Selatan',
      paketNama: 'Tahunan (12 Bulan)',
      tanggalMasuk: '2026-08-01',
      tanggalSelesai: '2027-08-01',
      totalSewa: 16200000,
      status: 'DITOLAK',
      alasanTolak: 'Maaf, kamar tersebut sudah dipesan oleh calon penyewa lain pada tanggal yang sama.',
      foto: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
      waktuSetujuAturan: '2026-07-25T09:20:00',
    },
    {
      id: 4,
      bookingCode: 'BK-2026-4112',
      kosNama: 'Kos Kenanga Mampang',
      kamarNomor: '104',
      tipe: 'STANDAR',
      lokasi: 'Mampang Prapatan, Jakarta Selatan',
      paketNama: 'Bulanan (3 Bulan)',
      statusKontrak: 'Masa Sewa Berakhir',
      tanggalMasuk: '2026-05-15',
      tanggalSelesai: '2026-08-15',
      totalSewa: 3300000,
      status: 'SELESAI',
      foto: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
      waktuSetujuAturan: '2026-05-13T16:45:00',
    },
  ];
}

export function bacaBookingDemo(): ApiBooking[] {
  const tersimpan = bacaSesi<ApiBooking[]>(kunciBooking);
  if (tersimpan !== null) {
    if (!Array.isArray(tersimpan) || !tersimpan.every(b => b && typeof b.id === 'number' && typeof b.status === 'string')) {
      throw new Error('Data booking demo dalam sesi browser tidak valid.');
    }
    return tersimpan;
  }
  const list = bookingAwal();
  simpanSesi(kunciBooking, list);
  return list;
}


export function batalkanBookingDemo(id: number): ApiBooking[] {
  const list = bacaBookingDemo();
  if (list.find(b => b.id === id)?.status !== 'MENUNGGU') throw new Error('Hanya booking yang masih Menunggu yang dapat dibatalkan.');
  const diperbarui = list.map<ApiBooking>(b => b.id === id ? { ...b, status: 'DIBATALKAN' } : b);
  simpanSesi(kunciBooking, diperbarui);
  return diperbarui;
}

const tanggalISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function buatBookingDemo({ kamar, paket, tanggalMasuk, setujuAturan }: { kamar: ApiRoom; paket: ApiPaket; tanggalMasuk: string; setujuAturan: boolean }): ApiBooking {
  const list = bacaBookingDemo();
  if (list.some(bookingMasihAktif)) throw new Error('Anda masih memiliki booking aktif. Selesaikan atau batalkan booking tersebut terlebih dahulu.');
  if (!setujuAturan) throw new Error('Anda harus menyetujui aturan kos dan aturan denda.');
  if (kamar.status !== 'KOSONG' || !paket.aktif || paket.kosId !== kamar.kosId || !Number.isInteger(paket.durasiBulan) || paket.durasiBulan <= 0) {
    throw new Error('Kamar atau paket sewa yang dipilih tidak tersedia.');
  }
  const mulai = new Date(`${tanggalMasuk}T00:00:00`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggalMasuk) || !Number.isFinite(mulai.getTime()) || tanggalISO(mulai) !== tanggalMasuk) throw new Error('Tanggal masuk tidak valid.');
  const selesai = new Date(mulai.getFullYear(), mulai.getMonth() + paket.durasiBulan + 1, 0);
  selesai.setDate(Math.min(mulai.getDate(), selesai.getDate()));
  const booking: ApiBooking = {
    id: Math.max(0, ...list.map(b => b.id)) + 1,
    tanggalMasuk, tanggalSelesai: tanggalISO(selesai),
    totalSewa: Math.round(kamar.hargaBulanan * paket.durasiBulan * (100 - paket.persenDiskon) / 100),
    status: 'MENUNGGU', waktuSetujuAturan: new Date().toISOString(),
    kamarNomor: kamar.nomor, tipe: kamar.tipe, kosNama: kamar.kosNama ?? 'Kos', paketNama: paket.nama,
    foto: fotoKamarBerdasarkanNomor(kamar.nomor, kamar.tipe, kamar.hargaBulanan), lokasi: kamar.alamat ?? 'Setiabudi, Jakarta Selatan',
  };
  simpanSesi(kunciBooking, [booking, ...list]);
  return booking;
}

export const bacaPenundaanDemo = (tagihanId: number) => bacaSesi<ApiDelay>(kunciPenundaan(tagihanId));

export function ajukanPenundaanDemo(pengajuan: ApiDelay): ApiDelay {
  if (bacaPenundaanDemo(pengajuan.tagihanId)) throw new Error('Tagihan ini sudah memiliki pengajuan. Penundaan hanya dapat diajukan sekali per tagihan.');
  simpanSesi(kunciPenundaan(pengajuan.tagihanId), pengajuan);
  return pengajuan;
}
