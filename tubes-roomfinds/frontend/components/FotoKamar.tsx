'use client';
import { useState } from 'react';
import { FOTO_REALISTIS } from '@/lib/gambar';

export function FotoKamar({
  nama,
  src,
  alt,
  className,
  style,
}: {
  nama?: string;
  src?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [errorCount, setErrorCount] = useState(0);

  // Tentukan URL gambar awal:
  // 1. Jika ada props `src`, prioritaskan `src`.
  // 2. Jika `nama` ada di pemetaan FOTO_REALISTIS, gunakan URL foto asli beresolusi tinggi.
  // 3. Jika `nama` adalah URL eksternal (http/https), gunakan langsung.
  // 4. Default: gambar aset lokal.
  let imageSource = src;
  if (!imageSource && nama) {
    if (nama.startsWith('http://') || nama.startsWith('https://')) {
      imageSource = nama;
    } else if (FOTO_REALISTIS[nama]) {
      imageSource = FOTO_REALISTIS[nama];
    } else {
      imageSource = `/kamar/${nama}.jpg`;
    }
  }

  // Jika error (misal gambar gagal dimuat), fallback ke SVG lokal
  if (errorCount === 1 && nama && !nama.startsWith('http')) {
    imageSource = `/kamar/${nama}.svg`;
  } else if (errorCount >= 2 || !imageSource) {
    imageSource = '/kamar/204-utama.svg';
  }

  return (
    <img
      src={imageSource}
      alt={alt}
      className={className}
      loading="lazy"
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
        ...style,
      }}
      onError={() => {
        setErrorCount((prev) => prev + 1);
      }}
    />
  );
}
