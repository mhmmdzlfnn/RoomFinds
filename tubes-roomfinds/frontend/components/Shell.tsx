'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SlidersHorizontal,
  BadgeCheck,
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  ClipboardList,
  House,
  Inbox,
  LayoutDashboard,
  LineChart,
  LogOut,
  ReceiptText,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { LogoutButton } from '@/components/LogoutButton';
import { NotifBell } from '@/components/NotifBell';
import { PopupLogin } from '@/components/PopupLogin';
import { get } from '@/lib/api';
import { bacaProfilDemo, berandaPeran } from '@/app/login/demo';

const userMenu = [
  { href: '/', label: 'Cari Kamar', icon: Search, img: 'cari', w: 18, h: 18 },
  { href: '/user/booking', label: 'Booking Saya', icon: ClipboardList, img: 'booking', w: 14, h: 18 },
  { href: '/user/tagihan', label: 'Tagihan Saya', icon: Wallet, img: 'tagihan', w: 18, h: 20 },
  { href: '/user/keluhan', label: 'Keluhan Saya', icon: Wrench, img: 'keluhan', w: 20, h: 18 },
  { href: '/user/profil', label: 'Profil', icon: UserRound, img: 'profil', w: 16, h: 16 },
];
const ownerMenu = [
  { href: '/pemilik', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pemilik/kos', label: 'Kelola Kos & Kamar', icon: House },
  { href: '/pemilik/booking', label: 'Booking Masuk', icon: Inbox },
  { href: '/pemilik/tagihan', label: 'Tagihan', icon: ReceiptText },
  { href: '/pemilik/pembayaran', label: 'Verifikasi Pembayaran', icon: BadgeCheck },
  { href: '/pemilik/keluhan', label: 'Keluhan', icon: Wrench },
  { href: '/pemilik/denda', label: 'Pengaturan Denda', icon: SlidersHorizontal },
];
const adminMenu = [
  { href: '/admin', label: 'Dashboard Statistik', icon: LineChart },
  { href: '/admin/verifikasi', label: 'Verifikasi Kos', icon: Building2 },
  { href: '/admin/akun', label: 'Kelola Akun', icon: Users },
];
const judul: Record<string, string> = {
  '/user/booking': 'Booking Saya',
  '/user/tagihan': 'Tagihan Saya',
  '/user/keluhan': 'Keluhan Saya',
  '/user/profil': 'Profil',
  '/pemilik': 'Dashboard',
  '/pemilik/kos': 'Kelola Kos & Kamar',
  '/pemilik/kos/baru': 'Tambah Kos Baru',
  '/pemilik/booking': 'Booking Masuk',
  '/pemilik/tagihan': 'Tagihan',
  '/pemilik/pembayaran': 'Verifikasi Pembayaran',
  '/pemilik/keluhan': 'Keluhan',
  '/pemilik/denda': 'Pengaturan Denda',
  '/admin': 'Dashboard Statistik',
  '/admin/verifikasi': 'Verifikasi Kos',
  '/admin/akun': 'Kelola Akun',
  '/user/booking/baru': 'Ajukan Booking',
  '/user/cari': 'Cari Kamar',
};
type Profil = { nama: string; peran: 'USER' | 'PEMILIK' | 'SUPERADMIN' };

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [profil, setProfil] = useState<Profil | null>(null);
  const [kosNama, setKosNama] = useState('');
  const [authorizedPath, setAuthorizedPath] = useState('');
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

  if (publik) return <>{children}</>;
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true' && authorizedPath !== path)
    return (
      <p className="container muted" role="status" style={{ paddingTop: 40 }}>
        Memeriksa sesi login…
      </p>
    );

  const menu = isAdmin ? adminMenu : isOwner ? ownerMenu : userMenu;
  const peranLabel = isAdmin ? 'SuperAdmin' : isOwner ? 'Pemilik' : 'User';
  const nama = profil?.peran === peran ? profil.nama : isAdmin ? 'Dynoadmin' : isOwner ? 'Fariz' : 'Zulfan';
  const judulHalaman = judul[path] ?? (path.startsWith('/user/tagihan/') ? 'Tagihan Saya' : peranLabel);
  const aktifHref = menu
    .filter(({ href }) => (href === '/' ? path === '/user/cari' : path === href || path.startsWith(`${href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className={`layout fx-shell${isAdmin ? ' fx-admin' : ''}`}>
      <aside className="sidebar">
        {isOwner ? (
          <Link className="sidebar-logo-owner" href="/pemilik" aria-label="Portal Pemilik">
            <div className="sidebar-logo-owner-icon">
              <Building2 size={18} aria-hidden="true" />
            </div>
            <div className="sidebar-logo-owner-meta">
              <span className="sidebar-logo-owner-brand">RoomFinds</span>
              <span className="sidebar-logo-owner-sub">Portal Pemilik</span>
            </div>
          </Link>
        ) : isAdmin ? (
          <Link className="sidebar-logo-owner" href="/admin" aria-label="Portal SuperAdmin">
            <div className="sidebar-logo-owner-icon">
              <Building2 size={18} aria-hidden="true" />
            </div>
            <div className="sidebar-logo-owner-meta">
              <span className="sidebar-logo-owner-brand">Room<span className="fx-brand-teal">Finds</span></span>
            </div>
          </Link>
        ) : (
          <Link className="sidebar-logo" href="/" aria-label="RoomFinds Home">
            <img src="/figma/shell/logo-home.svg" width="16" height="18" alt="" />
            <span>RoomFinds</span>
          </Link>
        )}

        <nav className="sidebar-menu" aria-label={`Navigasi ${peranLabel}`}>
          {menu.map((item) => {
            const { href, label, icon: Icon } = item;
            const gambar = 'img' in item ? (item as unknown as { img: string; w: number; h: number }) : null;
            return (
            <Link
              key={href}
              href={href}
              className={aktifHref === href ? 'active' : ''}
              aria-current={aktifHref === href ? 'page' : undefined}
            >
              <span className="ico">
                {gambar ? <img src={`/figma/shell/nav-${gambar.img}.svg`} width={gambar.w} height={gambar.h} alt="" /> : <Icon size={18} aria-hidden="true" />}
              </span>
              {label}
            </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <LogoutButton className="btn btn-ghost">
            <span className="ico">
              {!isOwner && !isAdmin ? <img src="/figma/shell/logout.svg" width="15" height="15" alt="" /> : <LogOut size={18} aria-hidden="true" />}
            </span>
            Keluar
          </LogoutButton>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          {isOwner ? (
            <div className="topbar-owner-pills">
              <div className="topbar-filter-pill">
                <Building2 size={15} className="text-teal" aria-hidden="true" />
                <span>Kos Melati Putri - Jakarta Selatan</span>
                <ChevronDown size={14} className="muted" aria-hidden="true" />
              </div>
              <div className="topbar-filter-pill">
                <Calendar size={15} className="text-teal" aria-hidden="true" />
                <span>Oktober 2026</span>
                <ChevronDown size={14} className="muted" aria-hidden="true" />
              </div>
            </div>
          ) : (
            isAdmin
              ? (
                  <div className="fx-admin-tag"><span>SUPERADMIN</span><small>Sistem Pengawasan Terpadu</small></div>
                )
              : !path.startsWith('/user/') && <div className="topbar-title">{judulHalaman}</div>
          )}

          <div className="topbar-right">
            <NotifBell peran={peran} />
            {isOwner ? (
              <div className="topbar-owner-user">
                <div className="topbar-owner-user-info">
                  <span className="topbar-owner-user-name">{nama}</span>
                  <span className="topbar-owner-user-role">Pemilik Kos</span>
                </div>
                <div className="topbar-avatar-btn" aria-label={`Akun ${nama}`}>
                  <UserRound size={17} aria-hidden="true" />
                </div>
              </div>
            ) : isAdmin ? (
              <div className="topbar-owner-user">
                <div className="topbar-owner-user-info" style={{ textAlign: 'right' }}>
                  <span className="topbar-owner-user-name" style={{ fontWeight: 700 }}>Dynoadmin</span>
                  <span className="topbar-owner-user-role" style={{ color: '#64748B' }}>Super Administrator</span>
                </div>
                <div className="topbar-avatar-btn" style={{ background: '#2A5B53', color: '#fff' }} aria-label="Akun Dynoadmin">
                  <UserRound size={17} aria-hidden="true" />
                </div>
              </div>
            ) : (
              <div className="topbar-avatar-btn" aria-label={`Akun ${nama}`}>
                <img src="/figma/shell/user.svg" width="12" height="12" alt="" />
              </div>
            )}
          </div>
        </header>

        <main className="page">{children}</main>
        {peran === "USER" && <PopupLogin />}
      </div>
    </div>
  );
}
