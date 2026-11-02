'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck, FileCheck2, House, ReceiptText, ShieldCheck, UserRound, Wallet } from 'lucide-react';
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

  return <div className="auth-body" style={{ minHeight: '100vh' }}>
    <Navbar/>
    <div className="auth-split">
      <aside className="auth-panel" style={{ background: 'linear-gradient(150deg, #0F766E, #115E59)' }}>
        <Link className="logo on-dark" href="/"><span className="logo-mark">R</span><span>RoomFinds</span></Link>
        <div>
          <p className="small" style={{ color: 'var(--teal-soft)', fontWeight: 600, marginBottom: 12 }}>TEMPAT TINGGAL NYAMAN, BIAYA LEBIH PASTI</p>
          <h1 className="tagline">Kos yang adil dan transparan untuk pemilik dan penyewa.</h1>
          <p className="tagline-sub">Satu platform untuk mencari kos, mengelola tagihan, dan menyelesaikan keluhan — semua tercatat.</p>
        </div>
        <div className="adv-card"><div className="t"><Wallet size={19} aria-hidden="true"/>Harga Transparan</div><div className="d">Rincian sewa dan biaya tambahan terlihat jelas sejak awal — tanpa kejutan di kemudian hari.</div></div>
        <div className="adv-card"><div className="t"><FileCheck2 size={19} aria-hidden="true"/>Booking Terjamin</div><div className="d">Aturan kos dan aturan denda disetujui secara tertulis sebelum booking diproses.</div></div>
        <div className="adv-card"><div className="t"><ReceiptText size={19} aria-hidden="true"/>Tagihan Rapi</div><div className="d">Tagihan bulanan terperinci, bukti transfer terverifikasi pemilik, dan riwayat pembayaran lengkap.</div></div>
        <p className="auth-panel-foot" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><BadgeCheck size={17} style={{ flexShrink: 0 }} aria-hidden="true"/>Jakarta Selatan · Kos terverifikasi SuperAdmin</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <div className="card card-pad" style={{ padding: 30, borderRadius: 12 }}>
            <h2 style={{ fontSize: 24, marginBottom: 6 }}>Buat akun baru</h2>
            <p className="card-sub" style={{ marginBottom: 22 }}>Mulai perjalanan kos yang lebih transparan. Gratis untuk User dan Pemilik.</p>
            <div className="tabs"><Link className="tab" href={loginHref}>Masuk</Link><Link className="tab active" href={next ? `/daftar?${new URLSearchParams({ next })}` : '/daftar'} aria-current="page">Daftar</Link></div>
            <form onSubmit={submit}>
              <div className="field"><label htmlFor="nama">Nama Lengkap</label><input type="text" id="nama" name="nama" placeholder="cth. Budi Santoso" autoComplete="name" required disabled={busy}/></div>
              <div className="field"><label htmlFor="email">Email</label><input type="email" id="email" name="email" placeholder="nama@email.com" autoComplete="email" required disabled={busy}/></div>
              <div className="field"><label htmlFor="noHp">Nomor HP</label><input type="tel" id="noHp" name="noHp" placeholder="08xxxxxxxxxx" autoComplete="tel" inputMode="numeric" pattern="08[0-9]{8,11}" title="Gunakan 10–13 digit angka, diawali 08, tanpa spasi atau tanda hubung." required disabled={busy}/></div>
              <div className="field"><label htmlFor="password">Password</label><input type="password" id="password" name="password" placeholder="Minimal 8 karakter" autoComplete="new-password" minLength={8} required disabled={busy}/></div>
              {peran === 'USER' ? <input type="hidden" name="asalKampus" value=""/> : <><input type="hidden" name="namaBank" value=""/><input type="hidden" name="noRekening" value=""/></>}
              <div className="field">
                <label id="label-peran">Daftar sebagai</label>
                <div className="radio-row" role="radiogroup" aria-labelledby="label-peran">
                  <label className={`radio-card${peran === 'USER' ? ' selected' : ''}`}>
                    <input type="radio" name="peranPilihan" checked={peran === 'USER'} onChange={() => setPeran('USER')} disabled={busy}/>
                    <div className="rc-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><UserRound size={18} color="var(--teal)" aria-hidden="true"/>User</div><div className="rc-sub">Saya mencari kos</div>
                  </label>
                  <label className={`radio-card${peran === 'PEMILIK' ? ' selected' : ''}`}>
                    <input type="radio" name="peranPilihan" checked={peran === 'PEMILIK'} onChange={() => setPeran('PEMILIK')} disabled={busy}/>
                    <div className="rc-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><House size={18} color="var(--teal)" aria-hidden="true"/>Pemilik</div><div className="rc-sub">Saya mengelola kos</div>
                  </label>
                </div>
              </div>
              <div className="info-box warning"><ShieldCheck size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true"/><span>Akun SuperAdmin tidak dapat didaftarkan, melainkan dibuat lewat data awal.</span></div>
              {useMock && <p className="note mt-8">Mode demo: profil disimpan di browser, bukan didaftarkan ke server. Untuk mencoba login berikutnya, gunakan akun contoh di halaman Masuk.</p>}
              {error && <div className="form-alert mt-16" role="alert">{error}</div>}
              <button className="btn btn-primary btn-lg btn-block mt-16" type="submit" disabled={busy}>{busy ? 'Membuat akun…' : <>Daftar <ArrowRight size={17} aria-hidden="true"/></>}</button>
            </form>
            <p className="center mt-16 small">Sudah punya akun? <Link href={loginHref} className="bold">Masuk</Link></p>
          </div>
        </div>
      </main>
    </div>
  </div>;
}
