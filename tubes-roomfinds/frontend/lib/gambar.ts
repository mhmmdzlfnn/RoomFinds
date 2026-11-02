// Pemetaan gambar kamar sesuai Prompts_Gambar_Kamar_RoomFinds.docx.
// File ilustrasi ada di public/kamar/*.svg; kalau kamu menghasilkan foto asli
// dari prompt di dokumen itu, letakkan sebagai public/kamar/<nama>.jpg dan
// aplikasi otomatis memakai fotonya menggantikan ilustrasi.
export type SetGambar = { slug: string; galeri: { nama: string; label: string }[] };

export function setKamar(tipe: string, id = 0): SetGambar {
  if (tipe === 'EKSKLUSIF') {
    // Docx: Kamar 204 (teal) & Kamar 305 (sage) untuk membedakan dua kamar eksklusif di layar yang sama.
    const slug = id % 2 === 0 ? '204' : '305';
    const galeri = slug === '204'
      ? [{ nama: '204-utama', label: 'Foto utama galeri' }, { nama: '204-tempat-tidur', label: 'Detail tempat tidur' }, { nama: '204-kamar-mandi', label: 'Kamar mandi dalam' }, { nama: '204-sudut-belajar', label: 'Sudut belajar' }, { nama: '204-jendela', label: 'Pemandangan dari jendela' }]
      : [{ nama: '305-utama', label: 'Foto utama galeri' }, { nama: '305-kamar-mandi', label: 'Kamar mandi dalam' }, { nama: '305-sudut-kerja', label: 'Sudut kerja' }, { nama: '204-tempat-tidur', label: 'Detail tempat tidur' }, { nama: '204-jendela', label: 'Pemandangan dari jendela' }];
    return { slug, galeri };
  }
  // Kamar standar: tanpa foto kamar mandi (berbagi), lebih sederhana.
  return { slug: '102', galeri: [{ nama: '102-utama', label: 'Foto utama' }, { nama: '102-lemari', label: 'Detail tempat tidur dan lemari' }, { nama: '102-meja', label: 'Sudut meja dan jendela' }] };
}

export const FASILITAS = {
  dapur: 'fasilitas-dapur',
  parkir: 'fasilitas-parkir',
  eksterior: 'eksterior-kos',
};
