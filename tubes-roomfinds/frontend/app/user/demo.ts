import { bookingContoh } from '@/lib/mock';
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
  const contohBudi = bookingContoh.filter(b => b.penyewa.nama === 'Budi Santoso');
  const aktif = contohBudi.find(b => b.status === 'MENUNGGU') ?? contohBudi.find(b => b.status === 'DISETUJUI');
  const list: ApiBooking[] = contohBudi.map(b => ({
    id: b.id, tanggalMasuk: b.tanggalMasuk, tanggalSelesai: b.tanggalSelesai,
    totalSewa: b.totalSewa,
    status: b.id !== aktif?.id && (b.status === 'MENUNGGU' || b.status === 'DISETUJUI') ? 'SELESAI' : b.status,
    waktuSetujuAturan: b.waktuSetujuAturan, kamarNomor: b.kamar.nomor, tipe: b.kamar.tipe,
    kosNama: b.kosNama, paketNama: b.paket.nama, alasanTolak: b.alasanTolak,
  }));
  if (list.length && !list.some(b => b.status === 'DITOLAK')) list.push({
    ...list[0], id: -2, tanggalMasuk: '2026-09-01', tanggalSelesai: '2027-03-01', status: 'DITOLAK',
    waktuSetujuAturan: '2026-08-20T09:15:00',
    alasanTolak: 'Kamar sudah terisi pada tanggal masuk yang dipilih. Silakan pilih kamar atau tanggal lain.',
  });
  return list;
}

export function bacaBookingDemo(): ApiBooking[] {
  const tersimpan = bacaSesi<ApiBooking[]>(kunciBooking);
  if (tersimpan !== null) {
    if (!Array.isArray(tersimpan) || !tersimpan.every(b => b && typeof b.id === 'number' && typeof b.status === 'string') || tersimpan.filter(bookingMasihAktif).length > 1) {
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
