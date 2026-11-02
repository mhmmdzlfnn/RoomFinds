import type { Booking, Kamar, Keluhan, Kos, Pembayaran, PengajuanPenundaan, Tagihan, Tugas } from '@/types';

export const kosContoh: Kos[] = [{
  id: 1, nama: 'Kos Melati Putri', alamat: 'Jl. Setiabudi Timur No. 12, Jakarta Selatan', kodePos: '12910',
  statusVerifikasi: 'TERVERIFIKASI', aturanKos: 'Jam bertamu sampai pukul 22.00. Jaga kebersihan kamar dan area bersama. Dilarang merokok di dalam kamar.',
  tanggalJatuhTempo: 5,
  aturanDenda: { jenis: 'HARIAN', nominalPerHari: 10000, masaTenggang: 3, batasMaksimal: 100000, deskripsi: 'Denda Harian Rp10.000 per hari setelah masa tenggang 3 hari, maksimal Rp100.000.' },
  jumlahKamar: 22, kamarKosong: 3,
}];

// Status pengelolaan dan katalog publik merupakan cuplikan layar yang berbeda.
export const kamarContoh: Kamar[] = [
  { id: 1, kosId: 1, nomor: '204', tipe: 'EKSKLUSIF', hargaBulanan: 1500000, luas: 14, fasilitas: ['AC', 'Kamar Mandi Dalam', 'WiFi', 'Parkir', 'Dapur'], status: 'TERISI' },
  { id: 2, kosId: 1, nomor: '102', tipe: 'STANDAR', hargaBulanan: 1250000, luas: 9, fasilitas: ['WiFi', 'Parkir', 'Dapur'], status: 'KOSONG' },
  { id: 3, kosId: 1, nomor: '305', tipe: 'EKSKLUSIF', hargaBulanan: 2100000, luas: 14, fasilitas: ['AC', 'Kamar Mandi Dalam', 'WiFi'], status: 'DIPESAN' },
];

export const bookingContoh: Booking[] = [{
  id: 1, penyewa: { id: 2, nama: 'Zulfan', email: 'zulfan@email.com', noHp: '0812-3456-7890', peran: 'USER', aktif: true },
  kamar: kamarContoh[0], kosNama: 'Kos Melati Putri', paket: { id: 2, nama: 'Semesteran', durasiBulan: 6, persenDiskon: 5, aktif: true },
  tanggalMasuk: '2026-11-01', tanggalSelesai: '2027-05-01', totalSewa: 8550000, status: 'MENUNGGU', waktuSetujuAturan: '2026-10-20T14:32:00',
}];

export const penundaanContoh: PengajuanPenundaan = {
  id: 1, tagihanId: 1, tanggalDiminta: '2026-11-12', alasan: 'Dana dari orang tua baru masuk pada tanggal 12 November. Saya akan membayar setelah dana diterima.', status: 'MENUNGGU',
};

export const tagihanAktif: Tagihan = {
  id: 1, bookingId: 1, kamarNomor: '204', penyewaNama: 'Zulfan', periode: '2026-10', jatuhTempo: '2026-11-05', jatuhTempoEfektif: '2026-11-05',
  items: [
    { jenis: 'SEWA', keterangan: 'Biaya Sewa', subtotal: 1500000 },
    { jenis: 'TETAP', keterangan: 'WiFi', subtotal: 50000 },
    { jenis: 'TETAP', keterangan: 'Kebersihan', subtotal: 25000 },
    { jenis: 'PEMAKAIAN', keterangan: 'Listrik', subtotal: 93750, meteranAwal: 1240, meteranAkhir: 1302.5, tarifPerUnit: 1500, satuan: 'kWh' },
  ],
  subtotalItem: 1668750, denda: 0, hariTerlambat: 0, sisaMasaTenggang: 3, total: 1668750, terbayar: 0, sisa: 1668750, status: 'BELUM_BAYAR',
};

export const riwayatTagihan: Tagihan[] = [tagihanAktif, {
  ...tagihanAktif, id: 2, periode: '2026-09', jatuhTempo: '2026-10-05', jatuhTempoEfektif: '2026-10-05', terbayar: 1668750, sisa: 0, status: 'LUNAS',
}];

export const keluhanContoh: Keluhan[] = [
  { id: 1, kamarNomor: '204', penyewaNama: 'Zulfan', kategori: 'LISTRIK', deskripsi: 'Lampu kamar mati sejak semalam', status: 'DILAPORKAN', dibuatPada: '2026-10-26', diperbaruiPada: '2026-10-26' },
  { id: 2, kamarNomor: '102', penyewaNama: 'Rina Aulia', kategori: 'AIR', deskripsi: 'Aliran air kamar mandi kecil sejak pagi.', status: 'DIPROSES', tanggapanPemilik: 'Teknisi sedang memeriksa pompa dan saluran air.', dibuatPada: '2026-10-24', diperbaruiPada: '2026-10-25' },
  { id: 3, kamarNomor: '305', penyewaNama: 'Dimas Pratama', kategori: 'INTERNET', deskripsi: 'Koneksi WiFi kamar terputus-putus.', status: 'SELESAI', tanggapanPemilik: 'Router sudah diperbaiki. Koneksi WiFi kembali normal.', dibuatPada: '2026-10-21', diperbaruiPada: '2026-10-23' },
];

export const pembayaranContoh: Pembayaran[] = [
  { id: 1, tagihanId: 1, metode: 'TRANSFER', jumlah: 1668750, tanggal: '2026-10-26', status: 'MENUNGGU_VERIFIKASI', bankAsal: 'BCA', namaPengirim: 'Zulfan' },
  { id: 2, tagihanId: 2, metode: 'TRANSFER', jumlah: 1668750, tanggal: '2026-10-04', status: 'DITERIMA', bankAsal: 'BCA', namaPengirim: 'Zulfan' },
  { id: 3, tagihanId: 1, metode: 'TRANSFER', jumlah: 1668750, tanggal: '2026-10-24', status: 'DITOLAK', bankAsal: 'BCA', namaPengirim: 'Zulfan', catatanVerifikasi: 'Bukti transfer kurang jelas. Mohon unggah ulang bukti yang memperlihatkan tanggal dan nominal.' },
];

export const tugasPemilik: Tugas[] = [
  { label: 'Booking menunggu', detail: 'Zulfan · Kamar 204', href: '/pemilik/booking', icon: 'booking', count: 2 },
  { label: 'Pembayaran menunggu verifikasi', detail: 'Zulfan · Rp1.668.750', href: '/pemilik/pembayaran', icon: 'pay', count: 2 },
  { label: 'Pengajuan penundaan', detail: '1 User menunggu keputusan', href: '/pemilik/pembayaran', icon: 'delay', count: 1 },
  { label: 'Meteran belum diisi', detail: '3 kamar · Kos Melati Putri', href: '/pemilik/tagihan', icon: 'meter', count: 3 },
  { label: 'Keluhan Dilaporkan', detail: 'Lampu kamar mati sejak semalam', href: '/pemilik/keluhan', icon: 'issue', count: 1 },
];
