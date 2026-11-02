'use client';
import { useEffect, useState } from 'react';
import { Badge, Card, PageHead } from '@/components/ui';
import { get, put } from '@/lib/api';
import { bookingContoh } from '@/lib/mock';
import { bacaProfilDemo, kunciProfilDemo } from '@/app/login/demo';
import type { ApiProfil } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const tenant = bookingContoh.find(b => b.penyewa.nama === 'Budi Santoso')?.penyewa;
const mock: ApiProfil = { id: tenant?.id ?? 2, nama: tenant?.nama ?? 'Budi Santoso', email: tenant?.email ?? 'budi.santoso@email.com', noHp: '0812-3456-7890', peran: 'USER', aktif: true, dataTambahan: { asalKampus: 'Universitas Telkom', kontakDarurat: 'Sri Santoso (Ibu) · 0813-2211-9090' } };

export default function Profil() {
  const [profil, setProfil] = useState<ApiProfil | null>(useMock ? mock : null);
  const [nama, setNama] = useState(useMock ? mock.nama : '');
  const [email, setEmail] = useState(useMock ? mock.email : '');
  const [noHp, setNoHp] = useState(useMock ? mock.noHp : '');
  const [kampus, setKampus] = useState(useMock ? mock.dataTambahan.asalKampus ?? '' : '');
  const [darurat, setDarurat] = useState(useMock ? mock.dataTambahan.kontakDarurat ?? '' : '');
  const [ok, setOk] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [lama, setLama] = useState(''); const [baru, setBaru] = useState('');
  const [passwordOk, setPasswordOk] = useState(false);
  const [konfirmasi, setKonfirmasi] = useState(false); const [nonaktif, setNonaktif] = useState(false);

  useEffect(() => {
    if (useMock) {
      const tersimpan = bacaProfilDemo() as (NonNullable<ReturnType<typeof bacaProfilDemo>> & Partial<ApiProfil>) | null;
      if (tersimpan?.peran === 'USER') {
        const p: ApiProfil = {
          ...mock, nama: tersimpan.nama, email: tersimpan.email,
          noHp: typeof tersimpan.noHp === 'string' ? tersimpan.noHp : mock.noHp,
          dataTambahan: {
            asalKampus: typeof tersimpan.dataTambahan?.asalKampus === 'string' ? tersimpan.dataTambahan.asalKampus : mock.dataTambahan.asalKampus,
            kontakDarurat: typeof tersimpan.dataTambahan?.kontakDarurat === 'string' ? tersimpan.dataTambahan.kontakDarurat : mock.dataTambahan.kontakDarurat,
          },
        };
        setProfil(p); setNama(p.nama); setEmail(p.email); setNoHp(p.noHp);
        setKampus(p.dataTambahan.asalKampus ?? ''); setDarurat(p.dataTambahan.kontakDarurat ?? '');
      }
      return;
    }
    get<ApiProfil>('/api/profil').then(p => {
      setProfil(p); setNama(p.nama); setEmail(p.email); setNoHp(p.noHp);
      setKampus(p.dataTambahan?.asalKampus ?? ''); setDarurat(p.dataTambahan?.kontakDarurat ?? '');
    }).catch(e => setError(e instanceof Error ? e.message : 'Profil belum berhasil dimuat.'));
  }, []);

  async function simpan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profil || !nama.trim() || !noHp.trim()) return;
    setBusy(true); setError(''); setOk('');
    try {
      if (!useMock) await put('/api/profil', { nama, noHp });
      const diperbarui: ApiProfil = { ...profil, nama, noHp, ...(useMock ? { email, dataTambahan: { ...profil.dataTambahan, asalKampus: kampus, kontakDarurat: darurat } } : {}) };
      if (useMock) {
        const value = JSON.stringify(diperbarui);
        localStorage.setItem(kunciProfilDemo, value);
        window.dispatchEvent(new StorageEvent('storage', { key: kunciProfilDemo, newValue: value, storageArea: localStorage }));
      }
      setProfil(diperbarui);
      setOk(useMock ? 'Perubahan profil demo tersimpan di browser ini. Akun server tidak diubah.' : 'Nama dan nomor HP berhasil disimpan.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Perubahan belum tersimpan.'); }
    finally { setBusy(false); }
  }

  const singkatan = (profil?.nama ?? '').split(/\s+/).filter(Boolean).slice(0, 2).map(k => k[0]).join('').toUpperCase();

  return <div>
    <PageHead title="Profil Saya" sub="Kelola informasi pribadi dan keamanan akun Anda."/>
    {ok && <div className="success-inline" role="status">✓ {ok}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}
    <div className="col-main" style={{ alignItems: 'start' }}>
      <Card>
        <div className="card-head" style={{ paddingBottom: 18, borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="avatar avatar-lg">{singkatan || '—'}</div>
            <div><h3 className="card-title">{profil?.nama ?? 'Memuat profil…'}</h3><p className="card-sub">{profil?.email ?? '—'}</p><div className="mt-8"><Badge tone="teal">User</Badge></div></div>
          </div>
        </div>
        <h3 className="card-title mb-16">Informasi Pribadi</h3>
        <form onSubmit={simpan}>
          <fieldset disabled={!profil || busy || nonaktif} style={{ border: 0, minWidth: 0 }}>
            <div className="form-grid-2">
              <div className="field"><label htmlFor="profil-nama">Nama Lengkap</label><input id="profil-nama" type="text" autoComplete="name" required value={nama} onChange={e => setNama(e.target.value)}/></div>
              <div className="field"><label htmlFor="profil-email">Email</label><input id="profil-email" type="email" autoComplete="email" required value={email} disabled={!useMock} onChange={e => setEmail(e.target.value)}/></div>
              <div className="field"><label htmlFor="profil-hp">Nomor HP</label><input id="profil-hp" type="tel" autoComplete="tel" required value={noHp} onChange={e => setNoHp(e.target.value)}/></div>
              <div className="field"><label htmlFor="profil-kampus">Asal Kampus</label><input id="profil-kampus" type="text" value={kampus} disabled={!useMock} onChange={e => setKampus(e.target.value)}/></div>
            </div>
            <div className="field"><label htmlFor="profil-darurat">Kontak Darurat</label><input id="profil-darurat" type="text" value={darurat} disabled={!useMock} onChange={e => setDarurat(e.target.value)}/><span className="hint">Nama, hubungan, dan nomor HP yang dapat dihubungi saat darurat.</span></div>
            {!useMock && <p className="note mb-16">Email, kampus, dan kontak darurat belum dapat diubah melalui API profil yang tersedia.</p>}
            <button className="btn btn-primary" type="submit">{busy ? 'Menyimpan…' : 'Simpan Perubahan'}</button>
          </fieldset>
        </form>
      </Card>
      <div className="stack">
        <Card>
          <h3 className="card-title">Ganti Password</h3>
          <p className="card-sub mb-16">Gunakan kata sandi yang berbeda dari akun lain.</p>
          <form onSubmit={e => { e.preventDefault(); if (useMock && lama && baru.length >= 8 && lama !== baru) { setPasswordOk(true); setLama(''); setBaru(''); } }}>
            <div className="field"><label htmlFor="sandi-lama">Kata Sandi Lama</label><input id="sandi-lama" type="password" autoComplete="current-password" required value={lama} onChange={e => { setLama(e.target.value); setPasswordOk(false); }} disabled={!useMock || nonaktif}/></div>
            <div className="field"><label htmlFor="sandi-baru">Kata Sandi Baru</label><input id="sandi-baru" type="password" autoComplete="new-password" required minLength={8} value={baru} onChange={e => { setBaru(e.target.value); setPasswordOk(false); }} disabled={!useMock || nonaktif}/><span className="hint">Minimal 8 karakter dan berbeda dari kata sandi lama.</span></div>
            <button className="btn btn-outline" disabled={!useMock || nonaktif || !lama || baru.length < 8 || lama === baru}>Ganti Password</button>
            {passwordOk && <div className="success-inline mt-16" role="status">✓ Simulasi selesai. Kata sandi akun asli tidak diubah.</div>}
            {!useMock && <p className="note mt-8">Perubahan kata sandi belum tersedia melalui API.</p>}
          </form>
        </Card>
        <section className="danger-zone">
          <h3 className="card-title">Zona Berbahaya</h3>
          <p className="note" style={{ margin: '8px 0 16px' }}>Menonaktifkan akun akan menghentikan akses Anda ke RoomFinds. Data booking dan tagihan tetap tersimpan.</p>
          {!konfirmasi && !nonaktif && <button className="btn btn-danger-outline" disabled={!useMock} onClick={() => setKonfirmasi(true)}>Nonaktifkan Akun</button>}
          {konfirmasi && <div role="group" aria-label="Konfirmasi nonaktifkan akun">
            <p className="small mb-16">Yakin ingin menonaktifkan akun? Pada demo, tindakan ini hanya mengubah tampilan lokal.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button className="btn btn-danger" onClick={() => { if (useMock) { setNonaktif(true); setKonfirmasi(false); } }}>Ya, Nonaktifkan</button><button className="btn btn-outline" onClick={() => setKonfirmasi(false)}>Batal</button></div>
          </div>}
          {nonaktif && <div className="info-box" role="status">Akun dinonaktifkan dalam demo ini saja. Akun asli tidak berubah.</div>}
          {!useMock && <p className="note mt-8">Deaktivasi akun belum tersedia melalui API.</p>}
        </section>
      </div>
    </div>
  </div>;
}
