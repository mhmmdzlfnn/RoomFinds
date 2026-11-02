'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, FileText, House, LockKeyhole, Mail, Wallet } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { post } from '@/lib/api';
import { akunDemo, berandaPeran, kunciProfilDemo, tujuanBooking } from './demo';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export default function Login() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [bantuanPassword, setBantuanPassword] = useState(false);
  const [next, setNext] = useState('');

  useEffect(() => { setNext(tujuanBooking(window.location.search)); }, []);
  const daftarHref = next ? `/daftar?${new URLSearchParams({ next })}` : '/daftar';

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      let peran: string | undefined;
      if (useMock) {
        const email = String(data.email).trim().toLowerCase();
        const akun = akunDemo.find(item => item.email === email);
        if (!akun || data.password !== 'password') throw new Error('Email atau password demo salah. Gunakan salah satu email contoh di bawah dengan password: password.');
        localStorage.setItem(kunciProfilDemo, JSON.stringify(akun));
        peran = akun.peran;
      } else {
        const result = await post<{ peran?: string }>('/api/auth/login', data);
        peran = result.peran;
      }
      const tujuan = tujuanBooking(window.location.search);
      window.location.assign((!peran || peran === 'USER') && tujuan ? tujuan : berandaPeran(peran));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Email atau password salah. Periksa kembali lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="auth-body login-page">
    <Navbar variant="auth"/>
    <div className="auth-split">
      <aside className="auth-panel">
        <Link className="login-brand" href="/"><span className="login-brand-icon"><House size={26} fill="currentColor" aria-hidden="true"/></span><span><strong>RoomFinds</strong><small>Platform Cari Kos di Jakarta Selatan</small></span></Link>
        <div className="login-pitch">
          <span className="login-welcome">Selamat datang kembali</span>
          <h1 className="tagline">Temukan kos impian Anda dengan mudah, aman, dan transparan tanpa biaya tersembunyi.</h1>
          <p className="tagline-sub">Temukan pilihan kos di Jakarta Selatan dan kelola kebutuhan sewa Anda dalam satu platform.</p>
          <div className="login-benefits">
            <div className="login-benefit"><span className="login-benefit-icon"><BadgeCheck size={23} aria-hidden="true"/></span><div><h2>Terverifikasi &amp; Terpercaya</h2><p>Lihat status verifikasi kos sebelum menentukan pilihan.</p></div></div>
            <div className="login-benefit"><span className="login-benefit-icon"><Wallet size={23} aria-hidden="true"/></span><div><h2>Biaya Jelas Sejak Awal</h2><p>Rincian sewa dan biaya tambahan ditampilkan secara transparan.</p></div></div>
            <div className="login-benefit"><span className="login-benefit-icon"><FileText size={23} aria-hidden="true"/></span><div><h2>Kontrak &amp; Transaksi Transparan</h2><p>Aturan kos dan persetujuan sewa tercatat secara tertulis.</p></div></div>
          </div>
        </div>
        <p className="auth-panel-foot">© 2026 RoomFinds Indonesia. Seluruh hak cipta dilindungi.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <div className="login-form-card">
            <nav className="login-tabs" aria-label="Masuk atau daftar"><Link className="active" href={next ? `/login?${new URLSearchParams({ next })}` : '/login'} aria-current="page">Masuk</Link><Link href={daftarHref}>Daftar</Link></nav>
            <h2>Masuk ke Akun Anda</h2>
            <p className="login-form-sub">Masukkan detail akun untuk melanjutkan pencarian kos.</p>
            {next && <p className="login-booking-note" role="status">Masuk terlebih dahulu untuk booking. Pilihan kamar dan paket Anda tetap tersimpan.</p>}
            <form onSubmit={submit}>
              <div className="field"><label htmlFor="email">Email</label><div className="login-input"><Mail size={18} aria-hidden="true"/><input type="email" id="email" name="email" placeholder="nama@email.com" autoComplete="email" required disabled={busy}/></div></div>
              <div className="field"><div className="login-password-label"><label htmlFor="password">Password</label><button type="button" aria-expanded={bantuanPassword} aria-controls="bantuan-password" onClick={() => setBantuanPassword(value => !value)}>Lupa password?</button></div><div className="login-input"><LockKeyhole size={18} aria-hidden="true"/><input type="password" id="password" name="password" placeholder="••••••••" autoComplete="current-password" required disabled={busy}/></div></div>
              {bantuanPassword && <div className="info-box mb-16" id="bantuan-password" role="status">{useMock ? 'Untuk akun demo, gunakan password: password. Daftar email tersedia pada Informasi akun demo di bawah formulir.' : 'Hubungi pengelola kos untuk meminta bantuan pemulihan akun. Pengaturan ulang password otomatis belum tersedia.'}</div>}
              {error && <div className="form-alert mb-16" role="alert">{error}</div>}
              <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>{busy ? 'Memeriksa…' : <>Masuk <ArrowRight size={17} aria-hidden="true"/></>}</button>
            </form>
            <p className="login-signup">Belum punya akun? <Link href={daftarHref}>Daftar sekarang</Link></p>
          </div>
          {useMock && <details className="login-demo">
            <summary>Informasi akun demo</summary>
            <p>Gunakan password <code>password</code> untuk semua akun contoh:</p>
            <ul>{akunDemo.map(akun => <li key={akun.email}><b>{akun.nama}</b><br/>{akun.email}</li>)}</ul>
            <p>Sesi demo disimpan lokal di browser, bukan autentikasi server.</p>
          </details>}
        </div>
      </main>
    </div>
    <footer className="login-footer">
      <p>© 2026 RoomFinds. Hak cipta dilindungi.</p>
      <div className="login-footer-links">
        <details><summary>Kebijakan Privasi</summary><p>Dalam mode demo, profil disimpan di browser dan tidak dikirim ke server. Peta Google Maps pada detail kamar menggunakan layanan pihak ketiga.</p></details>
        <details><summary>Syarat &amp; Ketentuan</summary><p>Booking memerlukan akun User dan persetujuan aturan kos. Harga, paket sewa, serta aturan denda ditampilkan sebelum pengajuan. Transaksi mode demo bukan transaksi sewa nyata.</p></details>
      </div>
    </footer>
  </div>;
}
