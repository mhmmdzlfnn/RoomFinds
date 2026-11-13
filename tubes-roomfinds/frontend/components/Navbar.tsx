import Link from 'next/link';
import { Search } from 'lucide-react';
import { LogoMark } from '@/components/LogoMark';

export function Navbar({ active, variant }: { active?: 'cari' | 'kerja'; variant?: 'auth' | 'register' | 'detail' }) {
  if (variant === 'detail') {
    return (
      <header className="fx-header">
        <nav className="fx-header-inner" aria-label="Navigasi utama">
          <Link className="fx-brand" href="/">
            <LogoMark lebar={44} />
            <span>RoomFinds</span>
          </Link>
          <div className="fx-nav fx-nav-plain">
            <Link href="/">Cari Kamar</Link>
            <Link href="/#cara-kerja">Cara Kerja</Link>
          </div>
          <div className="fx-auth">
            <Link className="fx-bell" href="/user/tagihan" aria-label="Notifikasi"><img src="/figma/detail/bell.svg" width="16" height="20" alt="" /><i aria-hidden="true"/></Link>
            <Link className="fx-login-combined" href="/login">Masuk / Daftar</Link>
          </div>
        </nav>
      </header>
    );
  }
  if (variant === 'auth' || variant === 'register') {
    return (
      <header className="fx-header">
        <nav className="fx-header-inner" aria-label="Navigasi utama">
          <Link className="fx-brand" href="/">
            <LogoMark lebar={44} />
            <span>RoomFinds</span>
          </Link>
          <div className="fx-nav fx-nav-plain">
            <Link href="/">Cari Kamar</Link>
            <Link href="/#cara-kerja">Cara Kerja</Link>
          </div>
          <Link className="fx-login-combined fx-login-lg" href={variant === 'auth' ? '/daftar' : '/login'}>Masuk / Daftar</Link>
        </nav>
      </header>
    );
  }
  if (!variant) {
    return (
      <header className="fx-header">
        <nav className="fx-header-inner" aria-label="Navigasi utama">
          <Link className="fx-brand" href="/">
            <LogoMark lebar={44} />
            <span>RoomFinds</span>
          </Link>
          <div className="fx-nav">
            <Link href="/" className={active === 'cari' ? 'active' : ''} aria-current={active === 'cari' ? 'page' : undefined}>Cari Kamar</Link>
            <Link href="/#cara-kerja" className={active === 'kerja' ? 'active' : ''} aria-current={active === 'kerja' ? 'page' : undefined}>Cara Kerja</Link>
          </div>
          <div className="fx-auth">
            <Link className="fx-login" href="/login">Masuk</Link>
            <Link className="fx-register" href="/daftar">Daftar</Link>
            <Link className="fx-avatar" href="/login" aria-label="Akun"><img src="/figma/pencarian/avatar.svg" width="12" height="12" alt="" /></Link>
          </div>
        </nav>
      </header>
    );
  }
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
