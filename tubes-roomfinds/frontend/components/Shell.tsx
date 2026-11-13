'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoMark } from '@/components/LogoMark';
import { animate } from 'motion';
import { useEffect, useRef, useState } from 'react';
import { LogoutButton } from '@/components/LogoutButton';
import { NotifBell } from '@/components/NotifBell';
import { PopupLogin } from '@/components/PopupLogin';
import { get } from '@/lib/api';
import { bacaProfilDemo, berandaPeran } from '@/app/login/demo';

type ItemMenu = { href: string; label: string; pendek: string };

const userMenu: ItemMenu[] = [
  { href: '/', label: 'Cari Kamar', pendek: 'Cari' },
  { href: '/user/booking', label: 'Booking Saya', pendek: 'Booking' },
  { href: '/user/tagihan', label: 'Tagihan Saya', pendek: 'Tagihan' },
  { href: '/user/keluhan', label: 'Keluhan Saya', pendek: 'Keluhan' },
  { href: '/user/profil', label: 'Profil', pendek: 'Profil' },
];
const ownerMenu: ItemMenu[] = [
  { href: '/pemilik', label: 'Dashboard', pendek: 'Dashboard' },
  { href: '/pemilik/kos', label: 'Kelola Kos & Kamar', pendek: 'Kos' },
  { href: '/pemilik/booking', label: 'Booking Masuk', pendek: 'Booking' },
  { href: '/pemilik/tagihan', label: 'Tagihan', pendek: 'Tagihan' },
  { href: '/pemilik/pembayaran', label: 'Verifikasi Pembayaran', pendek: 'Bayar' },
  { href: '/pemilik/keluhan', label: 'Keluhan', pendek: 'Keluhan' },
  { href: '/pemilik/denda', label: 'Pengaturan Denda', pendek: 'Denda' },
];
const adminMenu: ItemMenu[] = [
  { href: '/admin', label: 'Dashboard Statistik', pendek: 'Statistik' },
  { href: '/admin/verifikasi', label: 'Verifikasi Kos', pendek: 'Verifikasi' },
  { href: '/admin/akun', label: 'Kelola Akun', pendek: 'Akun' },
];
type Profil = { nama: string; peran: 'USER' | 'PEMILIK' | 'SUPERADMIN' };

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [kosNama, setKosNama] = useState('');
  const [authorizedPath, setAuthorizedPath] = useState('');
  const [laci, setLaci] = useState(false);
  const laciRef = useRef<HTMLDialogElement>(null);
  const isOwner = path.startsWith('/pemilik');
  const isAdmin = path.startsWith('/admin');
  const publik = path === '/' || path === '/login' || path === '/daftar' || path.startsWith('/kamar/');
  const peran = isAdmin ? 'SUPERADMIN' : isOwner ? 'PEMILIK' : 'USER';

  useEffect(() => {
    if (publik) {
      setAuthorizedPath('');
      setProfil(null);
      return;
    }
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      const bacaProfil = () => {
        const value = bacaProfilDemo();
        if (!value || value.peran !== peran) {
          setProfil(null);
          setAuthorizedPath('');
          const login =
            path === '/user/booking/baru'
              ? `/login?${new URLSearchParams({ next: `${path}${window.location.search}` })}`
              : '/login';
          window.location.replace(value ? berandaPeran(value.peran) : login);
          return;
        }
        setProfil(value);
        setAuthorizedPath(path);
      };
      bacaProfil();
      window.addEventListener('storage', bacaProfil);
      return () => window.removeEventListener('storage', bacaProfil);
    }
    let active = true;
    get<Profil>('/api/profil')
      .then((p) => {
        if (active) setProfil(p);
      })
      .catch(() => {});
    if (isOwner)
      get<Array<{ nama: string }>>('/api/kos')
        .then((list) => {
          if (active) setKosNama(list[0]?.nama ?? '');
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [path, publik, isOwner, peran]);

  // Laci menu ponsel memakai <dialog> bawaan: Escape menutup dan fokus terkunci di dalamnya.
  useEffect(() => {
    const dialog = laciRef.current;
    if (!dialog) return;
    if (laci && !dialog.open) {
      dialog.showModal();
      // Laci datang dari dock di bawah, jadi meluncur naik dari sana (sekali, bukan loop).
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        animate(dialog, { transform: ['translateY(40px)', 'translateY(0px)'], opacity: [0, 1] }, { duration: 0.28, ease: [0.2, 0.7, 0.2, 1] });
    }
    if (!laci && dialog.open) dialog.close();
  }, [laci]);
  useEffect(() => {
    setLaci(false);
  }, [path]);

  if (publik) return <>{children}</>;
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true' && authorizedPath !== path)
    return (
      <p className="container muted" role="status" style={{ paddingTop: 40 }}>
        Memeriksa sesi login…
      </p>
    );

  const menu = isAdmin ? adminMenu : isOwner ? ownerMenu : userMenu;
  const peranLabel = isAdmin ? 'SuperAdmin' : isOwner ? 'Pemilik' : 'User';
  const peranLengkap = isAdmin ? 'Super Administrator' : isOwner ? 'Pemilik Kos' : 'User';
  const nama = profil?.peran === peran ? profil.nama : isAdmin ? 'Dynoadmin' : isOwner ? 'Fariz' : 'Zulfan';
  const aktifHref = menu
    .filter(({ href }) => (href === '/' ? path === '/user/cari' : path === href || path.startsWith(`${href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const aktifIndeks = menu.findIndex((item) => item.href === aktifHref);
  const dock = menu.slice(0, 4);
  const aktifDiLaci = aktifIndeks >= dock.length;
  const berandaHref = isAdmin ? '/admin' : isOwner ? '/pemilik' : '/';
  const subJudul = isOwner ? 'Portal Pemilik' : isAdmin ? 'Portal SuperAdmin' : 'Portal Penghuni';

  const daftarLink = (kelas: string, onPilih?: () => void) =>
    menu.map(({ href, label }) => (
      <Link
        key={href}
        href={href}
        className={kelas}
        aria-current={aktifHref === href ? 'page' : undefined}
        onClick={onPilih}
      >
        {label}
      </Link>
    ));

  return (
    <div className={`layout fx-shell${isAdmin ? ' fx-admin' : ''}`}>
      <header className="dn-head">
        <div className="dn-row">
          <Link className="dn-brand" href={berandaHref} aria-label={`RoomFinds, ${subJudul}`}>
            <LogoMark lebar={46} />
            <span>
              <span className="dn-brand-name">RoomFinds</span>
              <span className="dn-brand-sub">{subJudul}</span>
            </span>
          </Link>

          <nav className={`dn-nav${menu.length > 5 ? ' dn-nav--many' : ''}`} aria-label={`Navigasi ${peranLabel}`}>
            {daftarLink('dn-link')}
          </nav>

          <div className="dn-right">
            <NotifBell peran={peran} />
            <div className="dn-who">
              <b>{nama}</b>
              <span>{peranLengkap}</span>
            </div>
            <LogoutButton className="dn-logout">Keluar</LogoutButton>
          </div>
        </div>

        {isOwner && (
          <div className="dn-sub">
            <span className="dn-chip">{kosNama || 'Kos Melati Putri - Jakarta Selatan'}</span>
            <span className="dn-chip">Oktober 2026</span>
          </div>
        )}
        {isAdmin && (
          <div className="dn-sub">
            <span className="dn-chip">Sistem Pengawasan Terpadu</span>
          </div>
        )}
      </header>

      <main className="page">{children}</main>
      {peran === 'USER' && <PopupLogin />}

      <nav className="dn-dock" aria-label={`Navigasi ${peranLabel} ponsel`}>
        {dock.map(({ href, pendek }) => (
          <Link key={href} href={href} aria-current={aktifHref === href ? 'page' : undefined}>
            {pendek}
          </Link>
        ))}
        <button
          type="button"
          className={aktifDiLaci ? 'is-active' : undefined}
          aria-haspopup="dialog"
          aria-expanded={laci}
          onClick={() => setLaci(true)}
        >
          Menu
        </button>
      </nav>

      <dialog
        ref={laciRef}
        className="dn-sheet"
        aria-label={`Semua menu ${peranLabel}`}
        onClose={() => setLaci(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setLaci(false);
        }}
      >
        <div className="dn-sheet-inner">
          <div className="dn-sheet-head">
            <h2>Menu {peranLabel}</h2>
            <button type="button" className="dn-sheet-close" onClick={() => setLaci(false)}>
              Tutup
            </button>
          </div>
          <nav className="dn-sheet-nav" aria-label={`Semua menu ${peranLabel}`}>
            {daftarLink('dn-link', () => setLaci(false))}
          </nav>
          <div className="dn-sheet-foot">
            <div className="dn-who">
              <b>{nama}</b>
              <span>{peranLengkap}</span>
            </div>
            <LogoutButton className="dn-logout">Keluar</LogoutButton>
          </div>
        </div>
      </dialog>
    </div>
  );
}
