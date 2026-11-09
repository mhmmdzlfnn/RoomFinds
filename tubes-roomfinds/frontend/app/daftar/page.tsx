'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthShell } from '@/components/AuthShell';
import { post } from '@/lib/api';
import { akunDemo, berandaPeran, kunciProfilDemo, tujuanBooking } from '../login/demo';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export default function Daftar() {
  const [peran, setPeran] = useState<'USER' | 'PEMILIK'>('USER');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState('');

  useEffect(() => { setNext(tujuanBooking(window.location.search)); }, []);
  const loginHref = next ? `/login?${new URLSearchParams({ next })}` : '/login';

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
        form.delete('peranPilihan');
        const data = Object.fromEntries(form);
    try {
      if (useMock) {
        const email = String(data.email).trim().toLowerCase();
        if (akunDemo.some(akun => akun.email === email)) throw new Error('Email ini sudah digunakan oleh akun demo. Silakan masuk dengan akun tersebut.');
        localStorage.setItem(kunciProfilDemo, JSON.stringify({ nama: String(data.nama), email, peran }));
      } else {
        await post('/api/auth/register', { ...data, peran });
      }
      const tujuan = tujuanBooking(window.location.search);
      window.location.assign(peran === 'USER' && tujuan ? tujuan : berandaPeran(peran));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Pendaftaran belum berhasil. Periksa kembali data Anda.');
    } finally {
      setBusy(false);
    }
  }

  return <AuthShell variant="register">
    <div className="fx-auth-card">
      <nav className="fx-auth-tabs" aria-label="Masuk atau daftar"><Link href={loginHref}>Masuk</Link><Link className="active" href={next ? `/daftar?${new URLSearchParams({ next })}` : '/daftar'} aria-current="page">Daftar</Link></nav>
      <div className="fx-auth-head"><h2>Buat Akun Baru</h2><p>Daftar gratis dan nikmati kemudahan sewa kos.</p></div>
      <form className="fx-auth-form" onSubmit={submit}>
        <div className="fx-auth-field">
          <span className="fx-auth-label" id="label-peran">Saya mendaftar sebagai:</span>
          <div className="fx-role-row" role="radiogroup" aria-labelledby="label-peran">
            <label className={`fx-role${peran === 'USER' ? ' selected' : ''}`}>
              <input type="radio" name="peranPilihan" checked={peran === 'USER'} onChange={() => setPeran('USER')} disabled={busy}/>
              <span className="fx-role-icon"><img src="/figma/auth/role-penyewa.svg" width="148" height="20" alt=""/></span>
              <strong>Penyewa</strong>
              <span>Saya mencari kos &amp; ingin booking</span>
            </label>
            <label className={`fx-role${peran === 'PEMILIK' ? ' selected' : ''}`}>
              <input type="radio" name="peranPilihan" checked={peran === 'PEMILIK'} onChange={() => setPeran('PEMILIK')} disabled={busy}/>
              <span className="fx-role-icon"><img src="/figma/auth/role-pemilik.svg" width="148" height="21" alt=""/></span>
              <strong>Pemilik</strong>
              <span>Saya mengelola kos &amp; ingin pasang iklan</span>
            </label>
          </div>
        </div>
        <div className="fx-auth-field"><label htmlFor="nama">Nama Lengkap</label><div className="fx-auth-input"><img src="/figma/auth/nama.svg" width="17" height="17" alt=""/><input type="text" id="nama" name="nama" placeholder="Zulfan" autoComplete="name" required disabled={busy}/></div></div>
        <div className="fx-auth-field"><label htmlFor="email">Email</label><div className="fx-auth-input"><img src="/figma/auth/mail.svg" width="17" height="13" alt=""/><input type="email" id="email" name="email" placeholder="nama@email.com" autoComplete="email" required disabled={busy}/></div></div>
        <div className="fx-auth-field"><label htmlFor="noHp">Nomor HP / WhatsApp</label><div className="fx-auth-input"><img src="/figma/auth/phone.svg" width="15" height="15" alt=""/><input type="tel" id="noHp" name="noHp" placeholder="081234567890" autoComplete="tel" inputMode="numeric" pattern="08[0-9]{8,11}" title="Gunakan 10–13 digit angka, diawali 08, tanpa spasi atau tanda hubung." required disabled={busy}/></div></div>
        <div className="fx-auth-field"><label htmlFor="password">Password</label><div className="fx-auth-input"><img src="/figma/auth/lock.svg" width="13" height="18" alt=""/><input type="password" id="password" name="password" placeholder="Minimal 8 karakter" autoComplete="new-password" minLength={8} required disabled={busy}/></div></div>
        {peran === 'USER' ? <input type="hidden" name="asalKampus" value=""/> : <><input type="hidden" name="namaBank" value=""/><input type="hidden" name="noRekening" value=""/></>}
        <label className="fx-auth-check"><input type="checkbox" required disabled={busy}/><span>Saya menyetujui <a href="#syarat">Syarat &amp; Ketentuan</a> serta <a href="#privasi">Kebijakan Privasi</a> RoomFinds.</span></label>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <button className="fx-auth-submit" type="submit" disabled={busy}>{busy ? 'Membuat akun…' : <>Daftar Sekarang <img src="/figma/auth/daftar-submit.svg" width="17" height="14" alt=""/></>}</button>
      </form>
      <p className="fx-auth-switch">Sudah punya akun? <Link href={loginHref}>Masuk di sini</Link></p>
    </div>
  </AuthShell>;
}
