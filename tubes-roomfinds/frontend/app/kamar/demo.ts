import type { ApiPaket, ApiRoom } from '@/types';

export const lokasiKosDemo = [
  { id: 1, nama: 'Kos Melati Putri', alamat: 'Jl. Setiabudi Timur No. 12, Setiabudi, Jakarta Selatan', aksesTransportasi: 'MRT Setiabudi Astra', pemilikNama: 'Fariz' },
  { id: 2, nama: 'Kos Anggrek Tebet', alamat: 'Jl. Tebet Timur Dalam II No. 18, Tebet, Jakarta Selatan', aksesTransportasi: 'Angkutan umum area Tebet', pemilikNama: 'Sulthan' },
  { id: 3, nama: 'Kos Kenanga Mampang', alamat: 'Jl. Mampang Prapatan IV No. 7, Mampang Prapatan, Jakarta Selatan', aksesTransportasi: 'Angkutan umum area Mampang', pemilikNama: 'Rino' },
  { id: 4, nama: 'Kos Cempaka Cilandak', alamat: 'Jl. Cilandak Tengah No. 24, Cilandak, Jakarta Selatan', aksesTransportasi: 'Angkutan umum area Cilandak', pemilikNama: 'Aulia' },
  { id: 5, nama: 'Kos Dahlia Pejaten', alamat: 'Jl. Pejaten Barat II No. 15, Pasar Minggu, Jakarta Selatan', aksesTransportasi: 'Angkutan umum area Pejaten', pemilikNama: 'Hafizh' },
  { id: 6, nama: 'Kos Flamboyan Kebayoran', alamat: 'Jl. Gandaria I No. 9, Kebayoran Baru, Jakarta Selatan', aksesTransportasi: 'Angkutan umum area Gandaria', pemilikNama: 'Vada' },
];

// Katalog publik terpisah dari kamar terisi pada layar pengelolaan kos.
export const kamarDemo: ApiRoom[] = Array.from({ length: 12 }, (_, index) => {
  const eksklusif = index % 3 !== 2;
  const kos = lokasiKosDemo[index % lokasiKosDemo.length];
  const nomor = ['204', '304', '102', '205', '306', '103', '206', '307', '104', '207', '308', '105'][index];
  return {
    id: index + 1,
    kosId: kos.id,
    nomor,
    tipe: eksklusif ? 'EKSKLUSIF' : 'STANDAR',
    hargaBulanan: nomor === '204' ? 1500000 : nomor === '102' ? 1250000 : eksklusif ? 1400000 + (index % 4) * 100000 : 900000 + (index % 3) * 100000,
    luas: eksklusif ? 14 : 9,
    fasilitas: eksklusif ? ['AC', 'Kamar Mandi Dalam', 'WiFi', 'Parkir', 'Dapur'] : ['WiFi', 'Parkir', 'Dapur'],
    status: 'KOSONG',
    kosNama: kos.nama,
    alamat: kos.alamat,
    aturanKos: 'Dilarang merokok di dalam kamar. Tamu maksimal sampai pukul 22.00. Jaga kebersihan kamar dan area bersama.',
    aturanDenda: { jenis: 'HARIAN', nominalPerHari: 10000, masaTenggang: 3, batasMaksimal: 100000, deskripsi: 'Denda harian setelah masa tenggang 3 hari.' },
  };
});

export const infoKosDemo = {
  fasilitasTambahan: ['Meja Belajar', 'Lemari', 'Akses 24 Jam'],
  kapasitas: 'Maks. 1 Orang',
  listrik: 'Termasuk (Token pribadi)',
  jenisKos: 'Khusus Putri',
  aksesTerdekat: [

    'Minimarket & apotek sekitar',
    'Pusat belanja Jakarta Selatan',
    'Pilihan kuliner di sekitar kos',
  ],
};

export const paketDemo: ApiPaket[] = [
  { id: 1, kosId: 1, nama: 'Bulanan', durasiBulan: 1, persenDiskon: 0, aktif: true },
  { id: 2, kosId: 1, nama: 'Semesteran', durasiBulan: 6, persenDiskon: 5, aktif: true },
  { id: 3, kosId: 1, nama: 'Tahunan', durasiBulan: 12, persenDiskon: 10, aktif: true },
];

export function daftarFasilitas(value: ApiRoom['fasilitas']): string[] {
  if (Array.isArray(value)) return value;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export const normalisasiFasilitas = (value: string) => value.toLowerCase().replace(/[\s-]/g, '');
