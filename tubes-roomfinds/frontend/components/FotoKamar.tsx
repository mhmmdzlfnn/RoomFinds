'use client';
import { useEffect, useState } from 'react';

// Ilustrasi lokal tersedia untuk seluruh galeri; foto JPG menjadi fallback aset.
export function FotoKamar({ nama, alt, className, style }: { nama: string; alt: string; className?: string; style?: React.CSSProperties }) {
  const [fotoAsli, setFotoAsli] = useState(false);
  useEffect(() => { setFotoAsli(false); }, [nama]);
  return <img src={`/kamar/${nama}.${fotoAsli ? 'jpg' : 'svg'}`} alt={alt} className={className} loading="lazy"
    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
    onError={() => { if (!fotoAsli) setFotoAsli(true); }}/>;
}
