'use client';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Building2,
  Camera,
  Contact,
  GraduationCap,
  Landmark,
  Mail,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react';
import { get, put } from '@/lib/api';
import { bacaProfilDemo, kunciProfilDemo } from '@/app/login/demo';
import type { ApiProfil } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const mockDefault: ApiProfil = {
  id: 2,
  nama: 'Budi Santoso',
  email: 'budi.santoso@ui.ac.id',
  noHp: '+62 812-3456-7890',
  peran: 'USER',
  aktif: true,
  dataTambahan: {
    asalKampus: 'Universitas Indonesia',
    kontakDarurat: 'Ibu Siti (Ibu Kandung) - 0818-9876-5432',
  },
};

export default function Profil() {
  const [profil, setProfil] = useState<ApiProfil | null>(useMock ? mockDefault : null);
  const [nama, setNama] = useState(useMock ? mockDefault.nama : '');
  const [email, setEmail] = useState(useMock ? mockDefault.email : '');
  const [noHp, setNoHp] = useState(useMock ? mockDefault.noHp : '');
  const [kampus, setKampus] = useState(useMock ? mockDefault.dataTambahan.asalKampus ?? '' : '');
  const [darurat, setDarurat] = useState(useMock ? mockDefault.dataTambahan.kontakDarurat ?? '' : '');
  const [kamarInfo, setKamarInfo] = useState('Kamar 304 - Melati Residence');

  const [ok, setOk] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Ganti Password state
  const [lama, setLama] = useState('');
  const [baru, setBaru] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [passwordOk, setPasswordOk] = useState(false);

  // Nonaktifkan Akun state
  const [konfirmasiHapus, setKonfirmasiHapus] = useState(false);
  const [nonaktif, setNonaktif] = useState(false);

  useEffect(() => {
    if (useMock) {
      const tersimpan = bacaProfilDemo() as (NonNullable<ReturnType<typeof bacaProfilDemo>> & Partial<ApiProfil>) | null;
      if (tersimpan?.peran === 'USER') {
        const p: ApiProfil = {
          ...mockDefault,
          nama: tersimpan.nama || mockDefault.nama,
          email: tersimpan.email || mockDefault.email,
          noHp: typeof tersimpan.noHp === 'string' ? tersimpan.noHp : mockDefault.noHp,
          dataTambahan: {
            asalKampus: typeof tersimpan.dataTambahan?.asalKampus === 'string' ? tersimpan.dataTambahan.asalKampus : mockDefault.dataTambahan.asalKampus,
            kontakDarurat: typeof tersimpan.dataTambahan?.kontakDarurat === 'string' ? tersimpan.dataTambahan.kontakDarurat : mockDefault.dataTambahan.kontakDarurat,
          },
        };
        setProfil(p);
        setNama(p.nama);
        setEmail(p.email);
        setNoHp(p.noHp);
        setKampus(p.dataTambahan.asalKampus ?? '');
        setDarurat(p.dataTambahan.kontakDarurat ?? '');
      }
      return;
    }

    get<ApiProfil>('/api/profil')
      .then((p) => {
        setProfil(p);
        setNama(p.nama);
        setEmail(p.email);
        setNoHp(p.noHp);
        setKampus(p.dataTambahan?.asalKampus ?? '');
        setDarurat(p.dataTambahan?.kontakDarurat ?? '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Profil belum berhasil dimuat.'));
  }, []);

  async function simpan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profil || !nama.trim() || !noHp.trim()) return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      if (!useMock) await put('/api/profil', { nama, noHp });
      const diperbarui: ApiProfil = {
        ...profil,
        nama,
        noHp,
        ...(useMock ? { email, dataTambahan: { ...profil.dataTambahan, asalKampus: kampus, kontakDarurat: darurat } } : {}),
      };
      if (useMock) {
        const value = JSON.stringify(diperbarui);
        localStorage.setItem(kunciProfilDemo, value);
        window.dispatchEvent(new StorageEvent('storage', { key: kunciProfilDemo, newValue: value, storageArea: localStorage }));
      }
      setProfil(diperbarui);
      setOk('Perubahan profil berhasil disimpan.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Perubahan belum tersimpan.');
    } finally {
      setBusy(false);
    }
  }

  function handleGantiPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lama || !baru || baru !== konfirmasiPassword) {
      setError('Pastikan password baru dan konfirmasi password cocok serta minimal 8 karakter.');
      return;
    }
    setPasswordOk(true);
    setLama('');
    setBaru('');
    setKonfirmasiPassword('');
    setTimeout(() => setPasswordOk(false), 4000);
  }

  const inisial = (profil?.nama ?? 'Budi Santoso')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0])
    .join('')
    .toUpperCase() || 'BS';

  return (
    <div className="profil-page-container">
      {/* Category header */}
      <div className="profil-category-tag">PENGATURAN AKUN</div>

      {/* Header row: Title & Verified Badge */}
      <div className="profil-header-row">
        <div>
          <h1 className="profil-title">Profil Saya</h1>
          <p className="profil-sub">Kelola informasi akun, keamanan, dan preferensi Anda</p>
        </div>
        <div className="profil-verified-pill">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Akun Penyewa Terverifikasi</span>
        </div>
      </div>

      {ok && <div className="success-inline mb-16" role="status">✓ {ok}</div>}
      {error && <div className="form-alert mb-16" role="alert">{error}</div>}

      {/* 2-Column Grid */}
      <div className="profil-layout">
        {/* Kolom Kiri: Form Informasi Pribadi */}
        <div className="profil-left-col">
          <section className="profil-card">
            {/* Header Profil (Avatar + Info + Badges) */}
            <div className="profil-user-header">
              <div className="profil-avatar-wrapper">
                <div className="profil-avatar">{inisial}</div>
                <div className="profil-avatar-badge" aria-label="Ganti foto profil">
                  <Camera size={12} aria-hidden="true" />
                </div>
              </div>

              <div className="profil-user-meta">
                <h2 className="profil-user-name">{profil?.nama ?? 'Budi Santoso'}</h2>
                <div className="profil-user-email">{profil?.email ?? 'budi.santoso@ui.ac.id'}</div>
                <div className="profil-user-badges">
                  <span className="profil-badge-pill badge-kampus">
                    <GraduationCap size={13} aria-hidden="true" />
                    <span>{kampus || 'Universitas Indonesia'}</span>
                  </span>
                  <span className="profil-badge-pill badge-kamar">
                    <Building2 size={12} aria-hidden="true" />
                    <span>{kamarInfo}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="profil-divider" aria-hidden="true"></div>

            {/* Form Fields */}
            <form onSubmit={simpan}>
              <fieldset disabled={!profil || busy || nonaktif} style={{ border: 0, minWidth: 0, padding: 0 }}>
                {/* Row 1: Nama Lengkap & Email */}
                <div className="profil-grid-2">
                  <div className="profil-field">
                    <label htmlFor="profil-nama" className="profil-label">
                      Nama Lengkap
                    </label>
                    <div className="profil-input-wrap">
                      <User size={16} className="profil-input-icon" aria-hidden="true" />
                      <input
                        id="profil-nama"
                        type="text"
                        className="profil-input"
                        autoComplete="name"
                        required
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="profil-field">
                    <label htmlFor="profil-email" className="profil-label">
                      Email
                    </label>
                    <div className="profil-input-wrap">
                      <Mail size={16} className="profil-input-icon" aria-hidden="true" />
                      <input
                        id="profil-email"
                        type="email"
                        className="profil-input"
                        autoComplete="email"
                        required
                        value={email}
                        disabled={!useMock}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: Nomor HP & Asal Kampus */}
                <div className="profil-grid-2">
                  <div className="profil-field">
                    <label htmlFor="profil-hp" className="profil-label">
                      Nomor HP
                    </label>
                    <div className="profil-input-wrap">
                      <Smartphone size={16} className="profil-input-icon" aria-hidden="true" />
                      <input
                        id="profil-hp"
                        type="tel"
                        className="profil-input"
                        autoComplete="tel"
                        required
                        value={noHp}
                        onChange={(e) => setNoHp(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="profil-field">
                    <label htmlFor="profil-kampus" className="profil-label">
                      Asal Kampus
                    </label>
                    <div className="profil-input-wrap">
                      <Landmark size={16} className="profil-input-icon" aria-hidden="true" />
                      <input
                        id="profil-kampus"
                        type="text"
                        className="profil-input"
                        value={kampus}
                        disabled={!useMock}
                        onChange={(e) => setKampus(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Kontak Darurat */}
                <div className="profil-field">
                  <label htmlFor="profil-darurat" className="profil-label">
                    Kontak Darurat (Nama &amp; No HP Orang Tua/Wali)
                  </label>
                  <div className="profil-input-wrap">
                    <Contact size={16} className="profil-input-icon" aria-hidden="true" />
                    <input
                      id="profil-darurat"
                      type="text"
                      className="profil-input"
                      value={darurat}
                      disabled={!useMock}
                      onChange={(e) => setDarurat(e.target.value)}
                    />
                  </div>
                  <span className="profil-field-hint">
                    Digunakan hanya saat keadaan darurat atau konfirmasi penting.
                  </span>
                </div>

                {/* Submit Button */}
                <div className="profil-submit-wrap">
                  <button type="submit" className="profil-submit-btn" disabled={busy}>
                    <Save size={15} aria-hidden="true" />
                    <span>{busy ? 'Menyimpan…' : 'Simpan Perubahan'}</span>
                  </button>
                </div>
              </fieldset>
            </form>
          </section>
        </div>

        {/* Kolom Kanan: Ganti Password & Zona Berbahaya */}
        <div className="profil-right-col">
          {/* Card Ganti Password */}
          <section className="profil-card profil-side-card">
            <div className="profil-side-header">
              <RotateCcw size={17} className="profil-side-icon" aria-hidden="true" />
              <h2 className="profil-side-title">Ganti Password</h2>
            </div>

            <form onSubmit={handleGantiPassword}>
              <div className="profil-field">
                <label htmlFor="sandi-lama" className="profil-label">
                  Password Lama
                </label>
                <input
                  id="sandi-lama"
                  type="password"
                  className="profil-side-input"
                  placeholder="••••••••"
                  required
                  value={lama}
                  onChange={(e) => setLama(e.target.value)}
                />
              </div>

              <div className="profil-field">
                <label htmlFor="sandi-baru" className="profil-label">
                  Password Baru
                </label>
                <input
                  id="sandi-baru"
                  type="password"
                  className="profil-side-input"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={baru}
                  onChange={(e) => setBaru(e.target.value)}
                />
              </div>

              <div className="profil-field">
                <label htmlFor="sandi-konfirmasi" className="profil-label">
                  Konfirmasi Password Baru
                </label>
                <input
                  id="sandi-konfirmasi"
                  type="password"
                  className="profil-side-input"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={konfirmasiPassword}
                  onChange={(e) => setKonfirmasiPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="profil-password-btn"
                disabled={!lama || !baru || baru.length < 8}
              >
                Perbarui Password
              </button>

              {passwordOk && (
                <div className="success-inline mt-8" role="status" style={{ fontSize: 11.5 }}>
                  ✓ Password berhasil diperbarui.
                </div>
              )}
            </form>
          </section>

          {/* Card Zona Berbahaya */}
          <section className="profil-danger-card">
            <div className="profil-danger-header">
              <AlertTriangle size={17} className="profil-danger-icon" aria-hidden="true" />
              <h2 className="profil-danger-title">Zona Berbahaya</h2>
            </div>
            <p className="profil-danger-text">
              Menonaktifkan akun akan menghentikan akses langganan aktif, membatalkan antrean kamar, dan
              menghapus riwayat data Anda dari sistem RoomFinds secara permanen.
            </p>

            {!konfirmasiHapus && !nonaktif && (
              <button
                type="button"
                className="profil-danger-btn"
                onClick={() => setKonfirmasiHapus(true)}
              >
                <Ban size={14} aria-hidden="true" />
                <span>Nonaktifkan Akun</span>
              </button>
            )}

            {konfirmasiHapus && (
              <div className="profil-danger-confirm">
                <p className="small mb-8" style={{ color: '#991B1B' }}>
                  Yakin ingin menonaktifkan akun ini?
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setNonaktif(true);
                      setKonfirmasiHapus(false);
                    }}
                  >
                    Ya, Nonaktifkan
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setKonfirmasiHapus(false)}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {nonaktif && (
              <div className="info-box mt-8" role="status" style={{ fontSize: 11.5 }}>
                Akun telah dinonaktifkan dalam simulasi ini.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
