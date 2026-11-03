// Pemetaan foto kamar nyata beresolusi tinggi (Unsplash) & aset galeri
export type SetGambar = {
  slug: string;
  fotoUtama: string;
  galeri: { nama: string; label: string; url?: string }[];
};

// Foto-foto kamar tidur kos nyata, bersih, modern, dan estetik
export const FOTO_REALISTIS: Record<string, string> = {
  // Kamar 204 (Eksklusif Rp1.500.000)
  '204-utama': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
  '204-tempat-tidur': 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80',
  '204-kamar-mandi': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
  '204-sudut-belajar': 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&auto=format&fit=crop&q=80',
  '204-jendela': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',

  // Kamar 304 & 305 (Eksklusif Rp1.500.000 - Rp2.100.000)
  '305-utama': 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80',
  '305-kamar-mandi': 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&auto=format&fit=crop&q=80',
  '305-sudut-kerja': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',

  // Kamar 102 & Standar (Rp1.250.000)
  '102-utama': 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80',
  '102-lemari': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&auto=format&fit=crop&q=80',
  '102-meja': 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&auto=format&fit=crop&q=80',

  // Fasilitas umum kos
  'fasilitas-dapur': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  'fasilitas-parkir': 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
  'eksterior-kos': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
};

// Koleksi foto kamar realistis berdasarkan tipe dan tingkatan harga
export const FOTO_KAMAR_PER_NOMOR: Record<string, string> = {
  // Kamar 204: Eksklusif Rp1.500.000 (Melati Putri)
  '204': 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
  // Kamar 304: Eksklusif Rp1.500.000 (Anggrek Tebet)
  '304': 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80',
  // Kamar 102: Standar Rp1.250.000 (Kenanga Mampang)
  '102': 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80',
  // Kamar 205: Eksklusif Rp1.700.000 (Cempaka Cilandak - Mewah / Premium)
  '205': 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80',
  // Kamar 306: Eksklusif Rp1.400.000 (Dahlia Pejaten)
  '306': 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop&q=80',
  // Kamar 103: Standar Rp1.100.000 (Flamboyan Kebayoran - Minimalis Rapi)
  '103': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
  // Kamar 206: Eksklusif Rp1.600.000
  '206': 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop&q=80',
  // Kamar 307: Eksklusif Rp1.700.000
  '307': 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80',
  // Kamar 104: Standar Rp1.000.000 (Ekonomis Bersih)
  '104': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
  // Kamar 207: Eksklusif Rp1.400.000
  '207': 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&auto=format&fit=crop&q=80',
  // Kamar 308: Eksklusif Rp1.500.000
  '308': 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=80',
  // Kamar 105: Standar Rp1.100.000
  '105': 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80',
};

export function fotoKamarBerdasarkanNomor(nomor?: string, tipe = 'EKSKLUSIF', harga = 1500000): string {
  if (nomor && FOTO_KAMAR_PER_NOMOR[nomor]) {
    return FOTO_KAMAR_PER_NOMOR[nomor];
  }
  if (tipe === 'EKSKLUSIF') {
    if (harga >= 1600000) {
      return 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80';
  }
  // Standar
  if (harga >= 1200000) {
    return 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80';
}

export function setKamar(tipe: string, id = 0, nomor?: string): SetGambar {
  const nomorKey = nomor || String(id);
  const fotoUtama = FOTO_KAMAR_PER_NOMOR[nomorKey] || fotoKamarBerdasarkanNomor(nomorKey, tipe);

  if (tipe === 'EKSKLUSIF') {
    const slug = id % 2 === 0 ? '204' : '305';
    const galeri = slug === '204'
      ? [
          { nama: '204-utama', label: 'Foto utama galeri', url: fotoUtama },
          { nama: '204-tempat-tidur', label: 'Detail tempat tidur', url: FOTO_REALISTIS['204-tempat-tidur'] },
          { nama: '204-kamar-mandi', label: 'Kamar mandi dalam', url: FOTO_REALISTIS['204-kamar-mandi'] },
          { nama: '204-sudut-belajar', label: 'Sudut belajar', url: FOTO_REALISTIS['204-sudut-belajar'] },
          { nama: '204-jendela', label: 'Pemandangan dari jendela', url: FOTO_REALISTIS['204-jendela'] },
        ]
      : [
          { nama: '305-utama', label: 'Foto utama galeri', url: fotoUtama },
          { nama: '305-kamar-mandi', label: 'Kamar mandi dalam', url: FOTO_REALISTIS['305-kamar-mandi'] },
          { nama: '305-sudut-kerja', label: 'Sudut kerja', url: FOTO_REALISTIS['305-sudut-kerja'] },
          { nama: '204-tempat-tidur', label: 'Detail tempat tidur', url: FOTO_REALISTIS['204-tempat-tidur'] },
          { nama: '204-jendela', label: 'Pemandangan dari jendela', url: FOTO_REALISTIS['204-jendela'] },
        ];
    return { slug, fotoUtama, galeri };
  }

  // Kamar standar: tanpa foto kamar mandi dalam (berbagi), lebih sederhana
  return {
    slug: '102',
    fotoUtama,
    galeri: [
      { nama: '102-utama', label: 'Foto utama', url: fotoUtama },
      { nama: '102-lemari', label: 'Detail tempat tidur dan lemari', url: FOTO_REALISTIS['102-lemari'] },
      { nama: '102-meja', label: 'Sudut meja dan jendela', url: FOTO_REALISTIS['102-meja'] },
    ],
  };
}

export const FASILITAS = {
  dapur: 'fasilitas-dapur',
  parkir: 'fasilitas-parkir',
  eksterior: 'eksterior-kos',
};
