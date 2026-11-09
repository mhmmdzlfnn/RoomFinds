'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { FotoKamar } from '@/components/FotoKamar';
import { get } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { fotoFigmaMenurutHarga, fotoKamarBerdasarkanNomor } from '@/lib/gambar';
import { daftarFasilitas, kamarDemo, normalisasiFasilitas } from './kamar/demo';
import type { ApiRoom } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const jumlahPerHalaman = 6;
const chips = [
  { nama: 'AC', ikon: 'ac', w: 13, h: 13 },
  { nama: 'Kamar Mandi Dalam', ikon: 'kamar-mandi', w: 13, h: 13 },
  { nama: 'WiFi', ikon: 'wifi', w: 16, h: 11 },
  { nama: 'Parkir', ikon: 'parkir', w: 9, h: 12 },
  { nama: 'Dapur', ikon: 'dapur', w: 11, h: 13 },
];

export default function PencarianKamar() {
  const [list, setList] = useState<ApiRoom[]>(useMock ? kamarDemo : []);
    const [jumlahTampil, setJumlahTampil] = useState(jumlahPerHalaman);
  const [lokasi, setLokasi] = useState('');
  const [harga, setHarga] = useState('');
  const [tipe, setTipe] = useState('Semua');
  const [aktif, setAktif] = useState<string[]>([]);
  const [areaHasil, setAreaHasil] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(!useMock);

  const muat = useCallback(async (area = '', hargaMaks = '', tipeKamar = 'Semua') => {
    setError('');
    setBusy(true);
    setJumlahTampil(jumlahPerHalaman);
    const maksimum = Number(hargaMaks.replace(/\D/g, ''));
    try {
      if (useMock) {
        setList(kamarDemo.filter(kamar =>
          (!area.trim() || `${kamar.kosNama} ${kamar.alamat}`.toLowerCase().includes(area.trim().toLowerCase())) &&
          (!maksimum || kamar.hargaBulanan <= maksimum) &&
          (tipeKamar === 'Semua' || kamar.tipe === tipeKamar.toUpperCase())
        ));
      } else {
        const p = new URLSearchParams();
        if (area.trim()) p.set('lokasi', area.trim());
        if (maksimum) p.set('hargaMaks', String(maksimum));
        if (tipeKamar !== 'Semua') p.set('tipe', tipeKamar.toUpperCase());
        setList(await get<ApiRoom[]>(`/api/kamar?${p}`));
      }
      setAreaHasil(area.trim());
    } catch (cause) {
      setList([]);
      setError(cause instanceof Error ? cause.message : 'Kamar belum berhasil dimuat. Silakan cari kembali.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { if (!useMock) void muat(); }, [muat]);

  const hasil = list.filter(kamar => kamar.status === 'KOSONG' && aktif.every(fasilitas =>
    daftarFasilitas(kamar.fasilitas).some(item => normalisasiFasilitas(item) === normalisasiFasilitas(fasilitas))
  ));

  return <div className="fx-page">
    <Navbar active="cari"/>
    <main className="fx-main">
      <section className="fx-hero">
        <div className="fx-hero-blur fx-hero-blur-a" aria-hidden="true"/>
        <div className="fx-hero-blur fx-hero-blur-b" aria-hidden="true"/>
        <div className="fx-hero-inner">
          <span className="fx-pill"><img src="/figma/pencarian/verified.svg" width="15" height="14" alt=""/>Terverifikasi &amp; Transparan</span>
          <h1>Temukan Kos yang Adil dan Transparan</h1>
          <p>Nikmati kejelasan biaya kos tanpa pungutan tersembunyi dan aturan rumah yang<br/>transparan dan tertulis.</p>
          <form className="fx-search" onSubmit={event => { event.preventDefault(); void muat(lokasi, harga, tipe); }}>
            <div className="fx-search-row">
              <div className="fx-field"><label htmlFor="harga">Harga Maksimal</label>
                <div className="fx-input"><img className="fx-input-icon" src="/figma/pencarian/icon-harga.svg" width="18" height="13" alt=""/><input type="text" id="harga" value={harga} onChange={event => setHarga(event.target.value)} inputMode="numeric" placeholder="cth. Rp 1.500.000"/></div></div>
              <div className="fx-field"><label htmlFor="tipe">Tipe Kamar</label>
                <div className="fx-input"><img className="fx-input-icon" src="/figma/pencarian/icon-tipe.svg" width="15" height="15" alt=""/><select id="tipe" value={tipe} onChange={event => setTipe(event.target.value)}><option value="Semua">Semua Tipe</option><option>Standar</option><option>Eksklusif</option></select><img className="fx-chevron" src="/figma/pencarian/chevron.svg" width="10" height="6" alt=""/></div></div>
              <div className="fx-field fx-field-btn"><button className="fx-btn-primary" type="submit" disabled={busy}><img src="/figma/pencarian/search.svg" width="15" height="15" alt=""/>{busy ? 'Mencari…' : 'Cari Kos'}</button></div>
            </div>
            <div className="fx-facilities">
              <span className="fx-label">Fasilitas Utama</span>
              <div className="fx-chips" role="group" aria-label="Filter fasilitas">
                {chips.map(({ nama, ikon, w, h }) => <button type="button" key={nama} className={`fx-chip${aktif.includes(nama) ? ' active' : ''}`} aria-pressed={aktif.includes(nama)} onClick={() => { setAktif(items => items.includes(nama) ? items.filter(item => item !== nama) : [...items, nama]); setJumlahTampil(jumlahPerHalaman); }}>
                  <img src={`/figma/pencarian/f-${ikon}.svg`} width={w} height={h} alt=""/>{nama}
                </button>)}
              </div>
            </div>
          </form>
        </div>
      </section>
      <section className="fx-results">
        {error && <div className="form-alert mt-16" role="alert">{error}</div>}
        <div className="fx-result-head" aria-live="polite">
          <div>
            <h2>{busy ? 'Mencari kamar kosong…' : error ? 'Hasil belum tersedia' : `${hasil.length} kamar kosong ditemukan`}</h2>
            <p>Pilihan kos terverifikasi dengan harga transparan dan tanpa biaya tersembunyi.{areaHasil ? ` Area: ${areaHasil}.` : ''}</p>
          </div>
          <div className="fx-sort"><span>Urutkan:</span><strong>Terbaru</strong></div>
        </div>
        <section className="fx-grid" aria-label="Hasil pencarian kamar" aria-busy={busy}>
          {hasil.slice(0, jumlahTampil).map((kamar, index) => {
            const fotoUrl = useMock ? fotoFigmaMenurutHarga(kamar.hargaBulanan, kamar.id) : fotoKamarBerdasarkanNomor(kamar.nomor, kamar.tipe, kamar.hargaBulanan);
            const fasilitas = daftarFasilitas(kamar.fasilitas);
            const tampil = fasilitas.slice(0, 5);
            const sisa = fasilitas.length - tampil.length;
            return <article className="fx-card" key={kamar.id}>
              <div className="fx-card-photo">
                <FotoKamar src={fotoUrl} fallback={fotoFigmaMenurutHarga(kamar.hargaBulanan, kamar.id)} alt={`Kamar ${kamar.nomor} · ${kamar.kosNama}`}/>
                <span className={`fx-tag ${kamar.tipe === 'EKSKLUSIF' ? 'fx-tag-eks' : 'fx-tag-std'}`}>{kamar.tipe === 'EKSKLUSIF' ? 'Eksklusif' : 'Standar'}</span>
                <span className="fx-status"><i/>Kosong</span>
              </div>
              <div className="fx-card-body">
                <Link href={`/kamar/${kamar.id}`} className="fx-card-link">
                  <h3>{kamar.kosNama} - Kamar {kamar.nomor}</h3>
                  <p className="fx-loc"><img src="/figma/pencarian/pin.svg" width="11" height="13" alt=""/><span>{kamar.alamat}</span></p>
                </Link>
                <div className="fx-fac">
                  {tampil.map(nama => { const c = chips.find(chip => normalisasiFasilitas(chip.nama) === normalisasiFasilitas(nama)); return c ? <img key={nama} src={`/figma/pencarian/c-${c.ikon}.svg`} alt={nama} title={nama} height="16"/> : <span key={nama} className="fx-fac-text">{nama}</span>; })}
                  {sisa > 0 && <small>+{sisa} fasilitas</small>}
                </div>
                <div className="fx-card-foot">
                  <div><span className="fx-muted">Harga sewa</span><div className="fx-price">{rupiah(kamar.hargaBulanan)} <span>/ bulan</span></div></div>
                  <Link className="fx-btn-soft" href={`/kamar/${kamar.id}`}>Lihat Detail</Link>
                </div>
              </div>
            </article>;
          })}
        </section>
        {!busy && !error && jumlahTampil < hasil.length && <div className="fx-more"><button type="button" className="fx-btn-soft fx-btn-lg" onClick={() => setJumlahTampil(jumlah => jumlah + jumlahPerHalaman)}>Muat Lebih Banyak Kos</button></div>}
      {!busy && !error && hasil.length === 0 && <div className="card card-pad center mb-24" role="status"><h2 style={{ fontSize: 18 }}>Belum ada kamar yang cocok</h2><p className="muted mt-8">Coba lokasi lain, naikkan harga maksimal, atau kurangi fasilitas yang dipilih.</p></div>}
      <section id="cara-kerja" className="card card-pad mb-24" style={{ scrollMarginTop: 90 }}>
        <h2 className="card-title mb-16">Cari kos dengan tenang, sejak langkah pertama</h2>
        <div className="grid-3">
          <div><h3 className="card-title">01 · Temukan kamar</h3><p className="card-sub">Saring lokasi, harga, dan fasilitas sesuai kebutuhan.</p></div>
          <div><h3 className="card-title">02 · Baca biaya dan aturan</h3><p className="card-sub">Lihat paket sewa serta aturan kos dan denda sebelum setuju.</p></div>
          <div><h3 className="card-title">03 · Ajukan booking</h3><p className="card-sub">Masuk sebagai User dan pantau persetujuan pemilik.</p></div>
        </div>
      </section>
    </section>
    </main>
    <footer className="fx-footer"><span>© 2024 RoomFinds. Hak cipta dilindungi.</span><span className="fx-footer-links"><a href="#">Kebijakan Privasi</a><a href="#">Syarat &amp; Ketentuan</a></span></footer>
  </div>;
}
