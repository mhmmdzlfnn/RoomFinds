'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { FotoKamar } from '@/components/FotoKamar';
import { get } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { fotoFigmaMenurutHarga, setKamar as pilihGambarKamar } from '@/lib/gambar';
import { bacaProfilDemo, berandaPeran } from '../../login/demo';
import { daftarFasilitas, infoKosDemo, kamarDemo, lokasiKosDemo, normalisasiFasilitas, paketDemo } from '../demo';
import type { ApiPaket, ApiRoom, Peran } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
type DetailRoom = ApiRoom & { tanggalJatuhTempo?: number };

const FOTO_FIGMA = ['foto-1', 'foto-2', 'foto-3', 'foto-4'].map(nama => `/figma/detail/${nama}.png`);
const AKSES_FIGMA = [
  { ikon: 'stasiun', w: 10, h: 16, teks: '5 menit ke Stasiun KRL Setiabudi' },
  { ikon: 'minimarket', w: 15, h: 14, teks: '2 menit ke Indomaret & Apotek terdekat' },
  { ikon: 'mal', w: 14, h: 16, teks: '7 menit ke Mal di Jakarta Selatan' },
  { ikon: 'kuliner', w: 11, h: 15, teks: 'Banyak pilihan kuliner Jakarta Selatan' },
];

function ikonFasilitas(nama: string): { file: string; w: number; h: number } | null {
  const nilai = normalisasiFasilitas(nama);
  if (nilai === 'ac') return { file: 'ac', w: 18, h: 18 };
  if (nilai.includes('mandi')) return { file: 'kamar-mandi', w: 18, h: 18 };
  if (nilai.includes('wifi')) return { file: 'wifi', w: 22, h: 16 };
  if (nilai.includes('meja')) return { file: 'meja', w: 18, h: 11 };
  if (nilai.includes('lemari')) return { file: 'lemari', w: 18, h: 15 };
  if (nilai.includes('parkir')) return { file: 'parkir', w: 22, h: 13 };
  if (nilai.includes('dapur')) return { file: 'dapur', w: 15, h: 18 };
  if (nilai.includes('akses')) return { file: 'akses', w: 21, h: 11 };
  return null;
}

async function bacaPeran(): Promise<Peran | null> {
  if (useMock) return bacaProfilDemo()?.peran ?? null;
  const response = await fetch('/api/profil', { credentials: 'include', cache: 'no-store' });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Akun belum dapat diperiksa. Muat ulang halaman sebelum mengajukan booking.');
  const profil = await response.json() as { peran?: Peran; aktif?: boolean };
  if (profil.aktif === false) throw new Error('Akun Anda tidak aktif. Hubungi pengelola untuk bantuan.');
  if (profil.peran !== 'USER' && profil.peran !== 'PEMILIK' && profil.peran !== 'SUPERADMIN') throw new Error('Peran akun tidak dikenali. Silakan masuk kembali.');
  return profil.peran;
}

export default function DetailKamar() {
  const { id } = useParams<{ id: string }>();
  const [kamar, setKamar] = useState<DetailRoom | null>(useMock ? kamarDemo.find(item => item.id === Number(id)) ?? null : null);
  const [paket, setPaket] = useState<ApiPaket[]>(useMock ? paketDemo : []);
  const [paketIdx, setPaketIdx] = useState(0);
  const [fotoIdx, setFotoIdx] = useState(0);
  const [setuju, setSetuju] = useState(false);
  const [error, setError] = useState('');
  const [paketError, setPaketError] = useState('');
  const [akunError, setAkunError] = useState('');
  const [peran, setPeran] = useState<Peran | null>(null);
  const [memeriksaAkun, setMemeriksaAkun] = useState(true);
  const [busy, setBusy] = useState(false);
  const hariIni = useMock ? '2026-10-26' : new Date().toISOString().slice(0, 10);
  const [tanggalMasuk, setTanggalMasuk] = useState(useMock ? '2026-11-01' : hariIni);

  useEffect(() => {
    let active = true;
    setFotoIdx(0); setPaketIdx(0); setSetuju(false); setError(''); setPaketError('');
    if (useMock) {
      const contoh = kamarDemo.find(item => item.id === Number(id));
      setKamar(contoh ? { ...contoh, tanggalJatuhTempo: 5 } : null);
      setPaket(contoh ? paketDemo.map(item => ({ ...item, kosId: contoh.kosId })) : []);
      if (!contoh) setError('Kamar tidak ditemukan. Silakan pilih kamar lain dari pencarian.');
      return;
    }
    setKamar(null); setPaket([]);
    get<DetailRoom>(`/api/kamar/${id}`).then(async data => {
      if (!active) return;
      setKamar(data);
      try {
        const daftar = await get<ApiPaket[]>(`/api/kos/${data.kosId}/paket`);
        if (active) setPaket(daftar.filter(item => item.aktif).sort((a, b) => a.durasiBulan - b.durasiBulan));
      } catch (cause) {
        if (active) setPaketError(cause instanceof Error ? cause.message : 'Paket sewa belum berhasil dimuat.');
      }
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'Kamar belum berhasil dimuat.'); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    bacaPeran().then(value => { if (active) setPeran(value); })
      .catch(cause => { if (active) setAkunError(cause instanceof Error ? cause.message : 'Akun belum dapat diperiksa.'); })
      .finally(() => { if (active) setMemeriksaAkun(false); });
    return () => { active = false; };
  }, []);

  async function ajukanBooking() {
    if (!setuju || !kamar || kamar.status !== 'KOSONG' || !paket[paketIdx] || busy || memeriksaAkun) return;
    setBusy(true); setAkunError('');
    try {
      const peranAktif = await bacaPeran();
      setPeran(peranAktif);
      if (peranAktif && peranAktif !== 'USER') {
        setAkunError('Booking hanya dapat diajukan oleh akun User, bukan Pemilik atau SuperAdmin.');
        return;
      }
      const tujuan = `/user/booking/baru?kamar=${kamar.id}&paket=${paketIdx}&tanggal=${tanggalMasuk}`;
      window.location.assign(peranAktif === 'USER' ? tujuan : `/login?${new URLSearchParams({ next: tujuan })}`);
    } catch (cause) {
      setAkunError(cause instanceof Error ? cause.message : 'Akun belum dapat diperiksa. Silakan coba kembali.');
    } finally {
      setBusy(false);
    }
  }

  if (!kamar) return <div className="fx-page"><Navbar variant="detail"/><main className="fx-detail"><Link className="fx-crumb-back" href="/"><img src="/figma/detail/back.svg" width="11" height="11" alt=""/>Cari Kamar</Link>{error ? <div className="form-alert" role="alert">{error}</div> : <p className="muted" role="status">Memuat kamar…</p>}</main></div>;
  const dipilih = paket[paketIdx];
  const denda = kamar.aturanDenda;
  const fasilitas = daftarFasilitas(kamar.fasilitas);
  const gambar = pilihGambarKamar(kamar.tipe, kamar.nomor === '204' || kamar.nomor === '305' ? Number(kamar.nomor) : kamar.id, kamar.nomor);
  const fotoLokal = kamar.hargaBulanan >= 1200000 ? FOTO_FIGMA : [fotoFigmaMenurutHarga(kamar.hargaBulanan, kamar.id), fotoFigmaMenurutHarga(kamar.hargaBulanan, kamar.id + 1)];
  const galeriDasar = useMock ? fotoLokal.map((url, index) => ({ nama: `figma-${index}`, label: `Foto kamar ${index + 1}`, url })) : gambar.galeri;
  // Foto yang diunggah pemilik saat menambah kamar tampil paling depan di galeri.
  const galeri = kamar.foto ? [{ nama: 'foto-pemilik', label: 'Foto dari pemilik kos', url: kamar.foto }, ...galeriDasar] : galeriDasar;
  const foto = galeri[fotoIdx] ?? galeri[0];
  const kosong = kamar.status === 'KOSONG';
  const bukanUser = peran !== null && peran !== 'USER';
  const eksklusif = kamar.tipe === 'EKSKLUSIF';
  const fasilitasDetail = [...new Set([...fasilitas, ...(useMock ? infoKosDemo.fasilitasTambahan : [])])].map(nama => {
    const nilai = normalisasiFasilitas(nama);
    const label = useMock && nilai === 'wifi' ? 'WiFi Cepat'
      : useMock && nilai === 'parkir' ? 'Parkir Motor'
      : useMock && nilai === 'dapur' ? 'Dapur Bersama' : nama;
    return { nama: label, ikon: ikonFasilitas(nama) };
  });
  const luasKamar = useMock && Number(kamar.luas) === 14 ? '3,5 × 4 meter'
    : useMock && Number(kamar.luas) === 9 ? '3 × 3 meter' : `${Number(kamar.luas)} m²`;
  const alamat = kamar.alamat?.trim();
  const kueriPeta = alamat ? encodeURIComponent(alamat) : '';
  const aksesTerdekat = useMock ? AKSES_FIGMA : [];
  const statusLabel = kosong ? 'Kosong' : kamar.status === 'DIPESAN' ? 'Dipesan' : 'Terisi';
  const dendaTeks = denda?.jenis === 'HARIAN' ? <>Denda keterlambatan pembayaran sebesar <b>{rupiah(denda.nominalPerHari)} / hari</b>{denda.masaTenggang ? <>, setelah masa tenggang {denda.masaTenggang} hari</> : null}.</>
    : denda?.jenis === 'FLAT' ? <>Denda keterlambatan tetap sebesar <b>{rupiah(denda.nominal)}</b> setelah masa tenggang {denda.masaTenggang} hari.</>
    : denda?.jenis === 'TANPA' ? <>Kos ini tidak memberlakukan denda keterlambatan.</>
    : <>Aturan denda belum tersedia. Konfirmasikan kepada pemilik sebelum booking.</>;

  return <div className="fx-page">
    <Navbar variant="detail"/>
    <main className="fx-detail">
      <nav className="fx-crumb" aria-label="Breadcrumb">
        <Link className="fx-crumb-back" href="/"><img src="/figma/detail/back.svg" width="11" height="11" alt=""/>Cari Kamar</Link>
        <span>/</span><strong>{kamar.kosNama}</strong><span>/</span><em>Kamar {kamar.nomor} - {eksklusif ? 'Eksklusif' : 'Standar'}</em>
      </nav>
      {error && <div className="form-alert" role="alert">{error}</div>}
      <div className="fx-detail-grid">
        <div className="fx-detail-left">
          <section className="fx-gallery" aria-label="Galeri kamar">
            <div className="fx-gallery-main">
              <FotoKamar key={foto.nama} src={foto.url} nama={foto.nama} fallback={fotoLokal[fotoIdx % fotoLokal.length]} alt={`${kamar.kosNama} Kamar ${kamar.nomor} — ${foto.label}`}/>
              <span className={`fx-gallery-status${kosong ? '' : ' off'}`}><i/>{statusLabel}</span>
              <span className="fx-gallery-count"><img src="/figma/detail/camera.svg" width="13" height="12" alt=""/>{fotoIdx + 1} / {galeri.length} Foto</span>
            </div>
            <div className="fx-thumbs">
              {galeri.map((item, index) => <button type="button" key={item.nama} onClick={() => setFotoIdx(index)} title={item.label} aria-label={`Tampilkan ${item.label.toLowerCase()}`} aria-pressed={index === fotoIdx} className={index === fotoIdx ? 'active' : ''}>
                <FotoKamar src={item.url} nama={item.nama} fallback={fotoLokal[index % fotoLokal.length]} alt={item.label}/>
              </button>)}
            </div>
          </section>
          <section className="fx-panel fx-title">
            <div className="fx-title-top">
              <span className="fx-kind">Kamar {eksklusif ? 'Eksklusif' : 'Standar'}{useMock ? ' Putri' : ''}</span>
              {useMock && <span className="fx-rating"><img src="/figma/detail/star.svg" width="15" height="14" alt=""/><b>4.9</b> (42 ulasan)</span>}
            </div>
            <h1>Kamar {kamar.nomor} - {eksklusif ? 'Eksklusif' : 'Standar'}</h1>
            <p className="fx-address"><img src="/figma/detail/pin.svg" width="13" height="17" alt=""/>{kamar.kosNama}{kamar.alamat ? ` · ${kamar.alamat}` : ' · Alamat belum tersedia'}</p>
          </section>
          <section className="fx-panel">
            <h2>Tentang Kamar Ini</h2>
            <p className="fx-body">Kamar {eksklusif ? 'eksklusif' : 'standar'} seluas {Number(kamar.luas)} m² di {kamar.kosNama}. Pilih paket sewa sesuai kebutuhan Anda dan baca aturan kos serta aturan denda sebelum mengajukan booking.</p>
          </section>
          <section className="fx-panel">
            <h2>Fasilitas Kamar &amp; Bersama</h2>
            <ul className="fx-fac-grid">{fasilitasDetail.length ? fasilitasDetail.map(({ nama, ikon }) => <li key={nama}>{ikon ? <img src={`/figma/detail/f-${ikon.file}.svg`} width={ikon.w} height={ikon.h} alt=""/> : <span className="fx-fac-dot" aria-hidden="true"/>}<span>{nama}</span></li>) : <li className="fx-muted">Belum ada data fasilitas.</li>}</ul>
          </section>
          <section className="fx-panel">
            <h2>Spesifikasi Teknis</h2>
            <dl className="fx-specs">
              <div><dt>Luas Kamar</dt><dd>{luasKamar}</dd></div>
              <div><dt>Kapasitas</dt><dd>{useMock ? infoKosDemo.kapasitas : 'Konfirmasi ke pemilik'}</dd></div>
              <div><dt>Listrik</dt><dd>{useMock ? infoKosDemo.listrik : 'Konfirmasi ke pemilik'}</dd></div>
              <div><dt>Jenis Kos</dt><dd>{useMock ? infoKosDemo.jenisKos : 'Konfirmasi ke pemilik'}</dd></div>
            </dl>
          </section>
          <section className="fx-panel">
            <h2>Lokasi &amp; Aksesibilitas Terdekat</h2>
            {useMock ? <div className="fx-map"><img src="/figma/detail/peta.png" alt={`Peta lokasi ${kamar.kosNama}`}/></div>
              : alamat ? <div className="fx-map"><iframe title={`Peta lokasi ${kamar.kosNama ?? 'kos'} di ${alamat}`} src={`https://maps.google.com/maps?q=${kueriPeta}&z=15&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div>
              : <div className="info-box">Alamat kos belum tersedia, sehingga peta belum dapat ditampilkan.</div>}
            {aksesTerdekat.length > 0 ? <ul className="fx-access">{aksesTerdekat.map(item => <li key={item.ikon}><img src={`/figma/detail/a-${item.ikon}.svg`} width={item.w} height={item.h} alt=""/>{item.teks}</li>)}</ul>
              : <p className="fx-muted fx-note">Informasi akses terdekat belum disediakan pemilik.</p>}
            {alamat && !useMock && <a className="fx-maps-link" href={`https://www.google.com/maps/search/?api=1&query=${kueriPeta}`} target="_blank" rel="noopener noreferrer">Buka di Google Maps ↗</a>}
          </section>
        </div>
        <aside className="fx-booking" aria-label="Pemesanan">
          <div className="fx-price-head">
            <div><span className="fx-muted fx-xs">Harga Mulai Dari</span><div className="fx-price-big">{rupiah(kamar.hargaBulanan)} <span>/ bulan</span></div></div>
            <span className={`fx-avail${kosong ? '' : ' off'}`}>{kosong ? 'Tersedia' : statusLabel}</span>
          </div>
          <div className="fx-book-field">
            <label htmlFor="tanggal-masuk">Tanggal Masuk</label>
            <div className="fx-date"><input type="date" id="tanggal-masuk" value={tanggalMasuk} min={hariIni} onChange={event => setTanggalMasuk(event.target.value)}/><img src="/figma/detail/calendar.svg" width="18" height="20" alt=""/></div>
          </div>
          <div className="fx-book-field">
            <span className="fx-book-label" id="label-paket">Pilih Paket Sewa</span>
            <div className="fx-pkgs" role="radiogroup" aria-labelledby="label-paket">
              {paket.map((item, index) => {
                const hargaNormal = kamar.hargaBulanan * item.durasiBulan;
                const hargaPaket = Math.round(hargaNormal * (100 - item.persenDiskon) / 100);
                const hemat = hargaNormal - hargaPaket;
                return <label key={item.id} className={`fx-pkg${paketIdx === index ? ' selected' : ''}`}>
                  <input type="radio" name="paket" value={item.id} checked={paketIdx === index} onChange={() => setPaketIdx(index)}/>
                  <span className="fx-radio" aria-hidden="true"/>
                  <span className="fx-pkg-main">
                    <span className="fx-pkg-title">{item.nama} ({item.durasiBulan} Bulan){item.persenDiskon > 0 && <em>Diskon {item.persenDiskon}%</em>}</span>
                    {hemat > 0 && <span className="fx-pkg-sub">Hemat {rupiah(hemat)}</span>}
                  </span>
                  <span className="fx-pkg-price"><b>{rupiah(hargaPaket)}</b><small>/ {item.durasiBulan === 1 ? 'bln' : item.durasiBulan === 12 ? 'thn' : `${item.durasiBulan} bln`}</small></span>
                </label>;
              })}
            </div>
            {paketError && <div className="form-alert" role="alert">{paketError}</div>}
            {!paket.length && !paketError && <p className="fx-muted fx-xs">Paket sewa belum tersedia. Booking dapat diajukan setelah paket aktif dimuat.</p>}
          </div>
          <div className="fx-rules">
            <div className="fx-rules-title"><img src="/figma/detail/aturan.svg" width="15" height="15" alt=""/>Aturan Kos &amp; Kebijakan Denda</div>
            <ul>
              {kamar.tanggalJatuhTempo !== undefined && <li>Jatuh tempo pembayaran sewa setiap tanggal <b>{kamar.tanggalJatuhTempo}</b> tiap bulannya.</li>}
              <li>{dendaTeks}</li>
              <li>{kamar.aturanKos || 'Aturan kos dikonfirmasi pemilik saat booking.'}</li>
            </ul>
          </div>
          <div className="fx-agree">
            <input type="checkbox" id="setuju-aturan" required checked={setuju} onChange={event => setSetuju(event.target.checked)} aria-describedby="bukti-persetujuan"/>
            <label htmlFor="setuju-aturan">Saya menyetujui seluruh aturan kos, kebijakan denda transparan, serta syarat dan ketentuan sewa yang berlaku di {kamar.kosNama}.</label>
          </div>
          {bukanUser && <div className="info-box warning">Booking hanya tersedia untuk akun User. Akun {peran === 'PEMILIK' ? 'Pemilik' : 'SuperAdmin'} tidak dapat mengajukan booking.</div>}
          {!kosong && <div className="info-box warning">Kamar ini tidak kosong dan belum dapat dipesan.</div>}
          {akunError && <div className="form-alert" role="alert">{akunError}</div>}
          <button type="button" className="fx-submit" disabled={!setuju || busy || memeriksaAkun || bukanUser || !kosong || !dipilih || Boolean(akunError)} onClick={ajukanBooking}>{busy ? 'Memeriksa akun…' : 'Ajukan Booking'}</button>
          <p className="fx-muted fx-xs fx-center" id="bukti-persetujuan">Belum ada biaya yang dibebankan saat pengajuan booking. Waktu persetujuan Anda direkam sebagai bukti tertulis.</p>
          {bukanUser && <Link className="fx-btn-soft fx-block" href={berandaPeran(peran)}>Kembali ke Dashboard</Link>}
        </aside>
      </div>
    </main>
    <footer className="fx-footer"><span>© 2024 RoomFinds. Hak cipta dilindungi.</span><span className="fx-footer-links"><a href="#">Kebijakan Privasi</a><a href="#">Syarat &amp; Ketentuan</a></span></footer>
  </div>;
}
