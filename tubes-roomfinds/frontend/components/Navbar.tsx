import Link from 'next/link';
import { House } from 'lucide-react';
export function Navbar({ active, variant }: { active?: 'cari' | 'kerja'; variant?: 'auth' }) {
  return <nav className="navbar" aria-label="Navigasi utama">
    <div className="container navbar-inner">
      <Link className="logo" href="/"><span className="logo-mark">{variant === 'auth' ? <House size={18} aria-hidden="true"/> : 'R'}</span><span>RoomFinds</span></Link>
      <div className="nav-links">
        <Link href="/" className={active === 'cari' ? 'active' : ''} aria-current={active === 'cari' ? 'page' : undefined}>Cari Kamar</Link>
        <Link href="/#cara-kerja">Cara Kerja</Link>
        {variant === 'auth' && <Link href="/login" aria-current="page">Masuk / Daftar</Link>}
      </div>
      <Link className="btn btn-primary" href="/login">Masuk / Daftar</Link>
    </div>
  </nav>;
}
