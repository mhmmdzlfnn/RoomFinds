'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, BriefcaseBusiness, FileText, House, LockKeyhole, Mail, Phone, UserRound, Wallet } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
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

  return <div className="auth-body register-page">
    <Navbar variant="register"/>
    <div className="auth-split">
      <aside className="auth-panel register-panel">
        <Link className="register-brand" href="/"><span className="register-brand-icon"><House size={22} fill="currentColor" aria-hidden="true"/></span><span><strong>RoomFinds</strong><small>Platform Cari Kos #1 di Indonesia</small></span></Link>
        <div className="register-pitch">
          <span className="register-welcome">Selamat Datang Kembali</span>
          <h1 className="tagline">Temukan kos impian Anda dengan mudah, aman, dan transparan tanpa biaya tersembunyi.</h1>
          <p className="tagline-sub">Bergabunglah dengan ribuan pencari kos dan pemilik properti yang telah mempercayai RoomFinds untuk transaksi hunian mereka.</p>
        </div>
        <div className="register-benefits">
          <div className="register-benefit"><span className="register-benefit-icon"><BadgeCheck size={20} aria-hidden="true"/></span><div><h2>Terverifikasi &amp; Terpercaya</h2><p>Setiap listing kos telah melalui kurasi ketat tim kami.</p></div></div>
          <div className="register-benefit"><span className="register-benefit-icon"><Wallet size={20} aria-hidden="true"/></span><div><h2>Bebas Biaya Admin Tambahan</h2><p>Bayar sewa tanpa potongan atau biaya tersembunyi.</p></div></div>
          <div className="register-benefit"><span className="register-benefit-icon"><FileText size={20} aria-hidden="true"/></span><div><h2>Kontrak &amp; Transaksi Transparan</h2><p>Keamanan hukum dan kejelasan perjanjian sewa terjamin.</p></div></div>
        </div>
        <p className="auth-panel-foot register-panel-foot">© 2024 RoomFinds Indonesia. Seluruh hak cipta dilindungi.</p>
      </aside>
      <main className="auth-main register-main">
        <div className="auth-card register-card">
          <div className="card card-pad register-form-card">
            <div className="register-tabs"><Link href={loginHref}>Masuk</Link><Link className="active" href={next ? `/daftar?${new URLSearchParams({ next })}` : '/daftar'} aria-current="page">Daftar</Link></div>
            <h2>Buat Akun Baru</h2>
            <p className="register-form-sub">Daftar gratis dan nikmati kemudahan sewa kos.</p>
            <form onSubmit={submit}>
              <div className="register-role-label">Saya mendaftar sebagai:</div>
              <div className="radio-row register-role-row" role="radiogroup" aria-label="Saya mendaftar sebagai">
                <label className={`radio-card register-role-card${peran === 'USER' ? ' selected' : ''}`}>
                  <input type="radio" name="peranPilihan" checked={peran === 'USER'} onChange={() => setPeran('USER')} disabled={busy}/>
                  <div className="register-role-head">
                    <UserRound size={17} aria-hidden="true"/>
                    <strong>Penyewa</strong>
                  </div>
                  <span>Saya mencari kos &amp; ingin booking</span>
                </label>
                <label className={`radio-card register-role-card${peran === 'PEMILIK' ? ' selected' : ''}`}>
                  <input type="radio" name="peranPilihan" checked={peran === 'PEMILIK'} onChange={() => setPeran('PEMILIK')} disabled={busy}/>
                  <div className="register-role-head">
                    <House size={17} aria-hidden="true"/>
                    <strong>Pemilik</strong>
                  </div>
                  <span>Saya mengelola kos &amp; ingin pasang iklan</span>
                </label>
              </div>
              <div className="field register-field"><label htmlFor="nama">Nama Lengkap</label><div className="register-input"><BriefcaseBusiness size={15} aria-hidden="true"/><input type="text" id="nama" name="nama" placeholder="Zulfan" autoComplete="name" required disabled={busy}/></div></div>
              <div className="field register-field"><label htmlFor="email">Email</label><div className="register-input"><Mail size={15} aria-hidden="true"/><input type="email" id="email" name="email" placeholder="nama@email.com" autoComplete="email" required disabled={busy}/></div></div>
              <div className="field register-field"><label htmlFor="noHp">Nomor HP / WhatsApp</label><div className="register-input"><Phone size={15} aria-hidden="true"/><input type="tel" id="noHp" name="noHp" placeholder="081234567890" autoComplete="tel" inputMode="numeric" pattern="08[0-9]{8,11}" title="Gunakan 10–13 digit angka, diawali 08, tanpa spasi atau tanda hubung." required disabled={busy}/></div></div>
              <div className="field register-field"><label htmlFor="password">Password</label><div className="register-input"><LockKeyhole size={15} aria-hidden="true"/><input type="password" id="password" name="password" placeholder="Minimal 8 karakter" autoComplete="new-password" minLength={8} required disabled={busy}/></div></div>
              {peran === 'USER' ? <input type="hidden" name="asalKampus" value=""/> : <><input type="hidden" name="namaBank" value=""/><input type="hidden" name="noRekening" value=""/></>}
              <label className="register-check"><input type="checkbox" required disabled={busy}/><span>Saya menyetujui <a href="#syarat">Syarat &amp; Ketentuan</a> serta <a href="#privasi">Kebijakan Privasi</a> RoomFinds.</span></label>
              {error && <div className="form-alert" role="alert">{error}</div>}
              <button className="btn btn-primary btn-block register-submit" type="submit" disabled={busy}>{busy ? 'Membuat akun…' : <>Daftar Sekarang <ArrowRight size={16} aria-hidden="true"/></>}</button>
            </form>
            <p className="register-login-link">Sudah punya akun? <Link href={loginHref}>Masuk di sini</Link></p>
          </div>
        </div>
      </main>
    </div>
    <footer className="register-footer"><span>© 2024 RoomFinds. Hak cipta dilindungi.</span><span><a href="#privasi">Kebijakan Privasi</a><a href="#syarat">Syarat &amp; Ketentuan</a></span></footer>
  </div>;
}
