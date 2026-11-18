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
import { daftarNotifikasi, muatNotifikasi, type Notifikasi } from '@/lib/notifikasi';

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
  // Tugas yang menunggu per halaman, diambil dari notifikasi (yang hijau = sudah selesai, tidak dihitung).
  const [tugas, setTugas] = useState<Notifikasi[]>([]);
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

  useEffect(() => {
    if (publik) return;
    if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
      setTugas(daftarNotifikasi(peran, true));
      return;
    }
    let aktif = true;
    muatNotifikasi()
      .then((data) => {
        if (aktif) setTugas(data);
      })
      .catch(() => {});
    return () => {
      aktif = false;
    };
  }, [publik, peran]);

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
      <p className="container muted u-pt-10" role="status">
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

          {/* Konteks halaman (kos, periode) dan penanda demo, dulu baris putih terpisah di bawah header. */}
          <div className="dn-context">
            {isOwner && (
              <>
                <span className="dn-chip">{kosNama || 'Kos Melati Putri - Jakarta Selatan'}</span>
                <span className="dn-chip">Oktober 2026</span>
              </>
            )}
            {process.env.NEXT_PUBLIC_USE_MOCK === 'true' && (
              <span className="dn-chip dn-chip-demo" title="Mode demo: perubahan hanya berlaku selama halaman dibuka, tidak dikirim ke server.">
                Mode demo<span className="sr-only">: perubahan hanya berlaku selama halaman dibuka, tidak dikirim ke server.</span>
              </span>
            )}
          </div>

          <div className="dn-right">
            <NotifBell peran={peran} />
            <div className="dn-who">
              <b>{nama}</b>
              <span>{peranLengkap}</span>
            </div>
            <LogoutButton className="dn-logout">Keluar</LogoutButton>
          </div>
        </div>

        {/* Peta rute: tiap halaman satu "stasiun". Yang sebelum halaman aktif = sudah dilewati. */}
        <nav className="dn-route" aria-label={`Navigasi ${peranLabel}`}>
          <ol style={{ '--n': menu.length } as React.CSSProperties}>
            {menu.map(({ href, label }, i) => {
              const status = i < aktifIndeks ? 'lewat' : i === aktifIndeks ? 'aktif' : 'nanti';
              const jumlah = tugas.filter((t) => t.href === href && t.nada !== 'hijau').length;
              return (
                <li key={href} data-status={status} style={{ '--i': i } as React.CSSProperties}>
                  <Link href={href} aria-current={status === 'aktif' ? 'page' : undefined}>
                    <span className="dn-stop" aria-hidden="true" />
                    <span className="dn-stop-label">{label}</span>
                    {jumlah > 0 && (
                      <span className="dn-stop-count">
                        {jumlah}
                        <span className="sr-only"> menunggu tindakan</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>

      </header>

      <main className="page">
        {/* Label stasiun: posisi halaman di peta rute. Disembunyikan bila halaman punya breadcrumb sendiri. */}
        {aktifIndeks >= 0 && (
          <p className="page-station">
            <span className="page-station-no">Stasiun {String(aktifIndeks + 1).padStart(2, '0')}</span>
            <span aria-hidden="true">/ {String(menu.length).padStart(2, '0')}</span>
            <span className="page-station-name">{menu[aktifIndeks].label}</span>
          </p>
        )}
        {children}
      </main>
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
