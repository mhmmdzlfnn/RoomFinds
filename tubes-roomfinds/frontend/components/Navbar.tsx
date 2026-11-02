import Link from 'next/link';
import { Search } from 'lucide-react';

export function Navbar({ active, variant }: { active?: 'cari' | 'kerja'; variant?: 'auth' | 'register' }) {
  return (
    <nav className={`navbar${variant === 'auth' ? ' navbar-auth' : ''}`} aria-label="Navigasi utama">
      <div className="container navbar-inner">
        <Link className="logo" href="/">
          <Search className="logo-icon" size={15} strokeWidth={1.8} aria-hidden="true" />
          <span>RoomFinds</span>
        </Link>
        <div className="nav-links">
          <Link href="/" className={active === 'cari' ? 'active' : ''} aria-current={active === 'cari' ? 'page' : undefined}>
            Cari Kamar
          </Link>
          <Link href="/#cara-kerja" className={active === 'kerja' ? 'active' : ''} aria-current={active === 'kerja' ? 'page' : undefined}>
            Cara Kerja
          </Link>
        </div>
        <Link className="nav-register-combined" href="/login">
          Masuk / Daftar
        </Link>
      </div>
    </nav>
  );
}
