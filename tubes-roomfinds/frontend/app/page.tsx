'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, Bath, Check, CookingPot, House, Info, MapPin, Search, Snowflake, Wifi, Car } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { FotoKamar } from '@/components/FotoKamar';
import { Badge } from '@/components/ui';
import { get } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { setKamar as pilihGambarKamar } from '@/lib/gambar';
import { daftarFasilitas, kamarDemo, normalisasiFasilitas } from './kamar/demo';
import type { ApiRoom } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const jumlahPerHalaman = 6;
const chips = [
  { nama: 'AC', Icon: Snowflake },
  { nama: 'Kamar Mandi Dalam', Icon: Bath },
  { nama: 'WiFi', Icon: Wifi },
  { nama: 'Parkir', Icon: Car },
  { nama: 'Dapur', Icon: CookingPot },
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

  return <div style={{ minHeight: '100vh' }}>
    <Navbar active="cari"/>
    <header className="hero" style={{ background: 'linear-gradient(180deg, var(--teal-faint), var(--bg))', paddingTop: 48, paddingBottom: 32 }}>
      <div className="container" style={{ maxWidth: 1280 }}>
        <Badge tone="teal"><BadgeCheck size={14} aria-hidden="true"/> Kos terverifikasi, biaya lebih pasti</Badge>
        <h1 style={{ marginTop: 14 }}>Temukan Kos yang Adil dan Transparan</h1>
        <p>Rincian biaya jelas sejak awal, aturan kos tertulis, dan bukti persetujuan yang terekam.</p>
      </div>
    </header>
    <main className="container" style={{ maxWidth: 1280 }}>
      <form className="card search-card" onSubmit={event => { event.preventDefault(); void muat(lokasi, harga, tipe); }}>
        <div className="search-row">
          <div className="field"><label htmlFor="lokasi">Lokasi</label><input type="text" id="lokasi" value={lokasi} onChange={event => setLokasi(event.target.value)} placeholder="Cari area, mis. Setiabudi"/></div>
          <div className="field"><label htmlFor="harga">Harga Maksimal</label><input type="text" id="harga" value={harga} onChange={event => setHarga(event.target.value)} inputMode="numeric" placeholder="Rp2.000.000"/></div>
          <div className="field"><label htmlFor="tipe">Tipe Kamar</label><select id="tipe" value={tipe} onChange={event => setTipe(event.target.value)}><option>Semua</option><option>Standar</option><option>Eksklusif</option></select></div>
          <button className="btn btn-primary" type="submit" disabled={busy}><Search size={17} aria-hidden="true"/>{busy ? 'Mencari…' : 'Cari'}</button>
        </div>
        <div className="chip-row" role="group" aria-label="Filter fasilitas">
          {chips.map(({ nama, Icon }) => <button type="button" key={nama} className={`chip chip-toggle${aktif.includes(nama) ? ' active' : ''}`} aria-pressed={aktif.includes(nama)} onClick={() => { setAktif(items => items.includes(nama) ? items.filter(item => item !== nama) : [...items, nama]); setJumlahTampil(jumlahPerHalaman); }}>
            <Icon size={15} aria-hidden="true"/>{nama}{aktif.includes(nama) && <Check size={13} aria-hidden="true"/>}
          </button>)}
        </div>
        <p className="note" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Info size={14} aria-hidden="true"/>Hanya menampilkan kamar kosong dari kos terverifikasi</p>
      </form>
      {error && <div className="form-alert mt-16" role="alert">{error}</div>}
      <div className="result-bar" aria-live="polite">
        <span className="result-count" style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}><House size={19} color="var(--teal)" aria-hidden="true"/><strong>{busy ? 'Mencari kamar kosong…' : error ? 'Hasil belum tersedia' : `${hasil.length} kamar kosong ditemukan`}</strong></span>
        <span className="muted small">{areaHasil || (useMock ? 'Setiabudi, Jakarta Selatan' : 'Sesuai hasil pencarian')}{aktif.length > 0 ? ` · ${aktif.length} fasilitas dipilih` : ''}</span>
      </div>
      <section className="room-grid" aria-label="Hasil pencarian kamar" aria-busy={busy}>
        {hasil.slice(0, jumlahTampil).map(kamar => {
          const gambar = pilihGambarKamar(kamar.tipe, kamar.nomor === '204' || kamar.nomor === '305' ? Number(kamar.nomor) : kamar.id);
          return <article className="card room-card" key={kamar.id}>
            <Link className="ph-card" href={`/kamar/${kamar.id}`} aria-label={`Lihat detail Kamar ${kamar.nomor}`} style={{ height: 190, overflow: 'hidden', position: 'relative' }}>
              <FotoKamar nama={`${gambar.slug}-utama`} alt={`Kamar ${kamar.nomor} · ${kamar.kosNama}`}/>
              <span style={{ position: 'absolute', top: 12, left: 12 }}><Badge tone={kamar.tipe === 'EKSKLUSIF' ? 'teal' : 'slate'}>{kamar.tipe === 'EKSKLUSIF' ? 'Eksklusif' : 'Standar'}</Badge></span>
            </Link>
            <div className="room-body">
              <div className="room-top"><h3>Kamar {kamar.nomor}</h3><span className="muted small">{Number(kamar.luas)} m²</span></div>
              <p className="room-kos" style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{kamar.kosNama}</p>
              <p className="room-kos" style={{ display: 'flex', gap: 5, alignItems: 'flex-start' }}><MapPin size={14} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true"/>{kamar.alamat}</p>
              <div className="price" style={{ fontSize: 20, marginTop: 3 }}>{rupiah(kamar.hargaBulanan)} <span className="per">/bulan</span></div>
              <div className="room-fac" style={{ minHeight: 38 }}>{daftarFasilitas(kamar.fasilitas).map(fasilitas => {
                const Icon = chips.find(chip => normalisasiFasilitas(chip.nama) === normalisasiFasilitas(fasilitas))?.Icon ?? Check;
                return <span key={fasilitas} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon size={13} aria-hidden="true"/>{fasilitas}</span>;
              })}</div>
              <div className="room-foot"><Badge tone="success" dot>Kosong</Badge><Link className="btn btn-primary btn-sm" href={`/kamar/${kamar.id}`}>Lihat Detail <span aria-hidden="true">→</span></Link></div>
            </div>
          </article>;
        })}
      </section>
      {!busy && !error && jumlahTampil < hasil.length && <div className="center mb-24">
        <button type="button" className="btn btn-outline" style={{ background: 'var(--gray-bg)', borderColor: 'transparent', minWidth: 220 }} onClick={() => setJumlahTampil(jumlah => jumlah + jumlahPerHalaman)}>Muat Lebih Banyak Kos</button>
      </div>}
      {!busy && !error && hasil.length === 0 && <div className="card card-pad center mb-24" role="status"><h2 style={{ fontSize: 18 }}>Belum ada kamar yang cocok</h2><p className="muted mt-8">Coba lokasi lain, naikkan harga maksimal, atau kurangi fasilitas yang dipilih.</p></div>}
      <section id="cara-kerja" className="card card-pad mb-24" style={{ scrollMarginTop: 90 }}>
        <h2 className="card-title mb-16">Cari kos dengan tenang, sejak langkah pertama</h2>
        <div className="grid-3">
          <div><h3 className="card-title">01 · Temukan kamar</h3><p className="card-sub">Saring lokasi, harga, dan fasilitas sesuai kebutuhan.</p></div>
          <div><h3 className="card-title">02 · Baca biaya dan aturan</h3><p className="card-sub">Lihat paket sewa serta aturan kos dan denda sebelum setuju.</p></div>
          <div><h3 className="card-title">03 · Ajukan booking</h3><p className="card-sub">Masuk sebagai User dan pantau persetujuan pemilik.</p></div>
        </div>
      </section>
    </main>
  </div>;
}
