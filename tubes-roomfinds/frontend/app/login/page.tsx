'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
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
      if (!peran || peran === "USER") { try { sessionStorage.setItem("roomfinds-popup-login", "1"); } catch { /* sesi tidak tersedia */ } }
      window.location.assign((!peran || peran === 'USER') && tujuan ? tujuan : berandaPeran(peran));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Email atau password salah. Periksa kembali lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell variant="auth">
    <div className="fx-auth-card">
      <nav className="fx-auth-tabs" aria-label="Masuk atau daftar"><Link className="active" href={next ? `/login?${new URLSearchParams({ next })}` : '/login'} aria-current="page">Masuk</Link><Link href={daftarHref}>Daftar</Link></nav>
      <div className="fx-auth-head"><h2>Masuk ke Akun Anda</h2><p>Masukkan detail akun untuk melanjutkan pencarian kos.</p></div>
      {next && <p className="fx-auth-note" role="status">Masuk terlebih dahulu untuk booking. Pilihan kamar dan paket Anda tetap tersimpan.</p>}
      <form className="fx-auth-form" onSubmit={submit}>
        <div className="fx-auth-field"><label htmlFor="email">Email</label><div className="fx-auth-input"><img src="/figma/auth/mail.svg" width="17" height="13" alt=""/><input type="email" id="email" name="email" placeholder="nama@email.com" autoComplete="email" required disabled={busy}/></div></div>
        <div className="fx-auth-field"><div className="fx-auth-label-row"><label htmlFor="password">Password</label><button type="button" aria-expanded={bantuanPassword} aria-controls="bantuan-password" onClick={() => setBantuanPassword(value => !value)}>Lupa password?</button></div><div className="fx-auth-input"><img src="/figma/auth/lock.svg" width="13" height="18" alt=""/><input type="password" id="password" name="password" placeholder="••••••••" autoComplete="current-password" required disabled={busy}/></div></div>
        {bantuanPassword && <div className="info-box" id="bantuan-password" role="status">{useMock ? 'Untuk akun demo, gunakan password: password. Daftar email tersedia pada Informasi akun demo di bawah formulir.' : 'Hubungi pengelola kos untuk meminta bantuan pemulihan akun. Pengaturan ulang password otomatis belum tersedia.'}</div>}
        {error && <div className="form-alert" role="alert">{error}</div>}
        <button className="fx-auth-submit" type="submit" disabled={busy}>{busy ? 'Memeriksa…' : <>Masuk <img src="/figma/auth/arrow.svg" width="13" height="13" alt=""/></>}</button>
      </form>
      <p className="fx-auth-switch">Belum punya akun? <Link href={daftarHref}>Daftar sekarang</Link></p>
    </div>
    {useMock && <details className="fx-auth-demo" open>
      <summary>Informasi akun demo</summary>
      <p>Gunakan password &quot;password&quot; untuk semua akun contoh:</p>
      <ul>{akunDemo.map(akun => <li key={akun.email}><b>{akun.nama} · {akun.peran === 'USER' ? 'User' : akun.peran === 'PEMILIK' ? 'Pemilik' : 'SuperAdmin'}</b><span>{akun.email}</span></li>)}</ul>
      <small>Sesi demo disimpan lokal di browser, bukan autentikasi server.</small>
    </details>}
  </AuthShell>;
}
