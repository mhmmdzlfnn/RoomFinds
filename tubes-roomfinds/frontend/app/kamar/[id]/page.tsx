'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, BadgeCheck, Bath, Bike, CalendarDays, Check, Clock3, CookingPot, DoorClosed, FileCheck2, KeyRound, LampDesk, MapPin, ShieldCheck, ShoppingBag, Snowflake, Store, TrainFront, Utensils, Wifi } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { FotoKamar } from '@/components/FotoKamar';
import { Badge } from '@/components/ui';
import { get } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { setKamar as pilihGambarKamar } from '@/lib/gambar';
import { bacaProfilDemo, berandaPeran } from '../../login/demo';
import { daftarFasilitas, infoKosDemo, kamarDemo, lokasiKosDemo, normalisasiFasilitas, paketDemo } from '../demo';
import type { ApiPaket, ApiRoom, Peran } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
type DetailRoom = ApiRoom & { tanggalJatuhTempo?: number };

function ikonFasilitas(nama: string) {
  const nilai = normalisasiFasilitas(nama);
  if (nilai === 'ac') return Snowflake;
  if (nilai.includes('mandi')) return Bath;
  if (nilai.includes('wifi')) return Wifi;
  if (nilai.includes('meja')) return LampDesk;
  if (nilai.includes('lemari')) return DoorClosed;
  if (nilai.includes('parkir')) return Bike;
  if (nilai.includes('dapur')) return CookingPot;
  if (nilai.includes('akses')) return KeyRound;
  return Check;
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
      const tujuan = `/user/booking/baru?kamar=${kamar.id}&paket=${paketIdx}`;
      window.location.assign(peranAktif === 'USER' ? tujuan : `/login?${new URLSearchParams({ next: tujuan })}`);
    } catch (cause) {
      setAkunError(cause instanceof Error ? cause.message : 'Akun belum dapat diperiksa. Silakan coba kembali.');
    } finally {
      setBusy(false);
    }
  }

  if (!kamar) return <div style={{ minHeight: '100vh' }}><Navbar/><main className="container" style={{ paddingTop: 40 }}><Link className="back-link" href="/"><ArrowLeft size={15}/> Kembali ke Pencarian</Link>{error ? <div className="form-alert" role="alert">{error}</div> : <p className="muted" role="status">Memuat kamar…</p>}</main></div>;
  const dipilih = paket[paketIdx];
  const total = dipilih ? Math.round(kamar.hargaBulanan * dipilih.durasiBulan * (100 - dipilih.persenDiskon) / 100) : null;
  const denda = kamar.aturanDenda;
  const fasilitas = daftarFasilitas(kamar.fasilitas);
  const gambar = pilihGambarKamar(kamar.tipe, kamar.nomor === '204' || kamar.nomor === '305' ? Number(kamar.nomor) : kamar.id, kamar.nomor);
  const foto = gambar.galeri[fotoIdx] ?? gambar.galeri[0];
  const kosong = kamar.status === 'KOSONG';
  const bukanUser = peran !== null && peran !== 'USER';
  const fasilitasDetail = [...new Set([...fasilitas, ...(useMock ? infoKosDemo.fasilitasTambahan : [])])].map(nama => {
    const nilai = normalisasiFasilitas(nama);
    const label = useMock && nilai === 'wifi' ? 'WiFi Cepat'
      : useMock && nilai === 'parkir' ? 'Parkir Motor'
      : useMock && nilai === 'dapur' ? 'Dapur Bersama' : nama;
    return { nama: label, Icon: ikonFasilitas(nama) };
  });
  const luasKamar = useMock && Number(kamar.luas) === 14 ? '3,5 × 4 meter'
    : useMock && Number(kamar.luas) === 9 ? '3 × 3 meter' : `${Number(kamar.luas)} m²`;
  const alamat = kamar.alamat?.trim();
  const kueriPeta = alamat ? encodeURIComponent(alamat) : '';
  const ikonAkses = [TrainFront, Store, ShoppingBag, Utensils];
  const aksesTerdekat = [lokasiKosDemo.find(kos => kos.id === kamar.kosId)?.aksesTransportasi ?? 'Angkutan umum sekitar kos', ...infoKosDemo.aksesTerdekat];

  return <div style={{ minHeight: '100vh' }}>
    <Navbar/>
    <main className="container" style={{ maxWidth: 1280, paddingTop: 26, paddingBottom: 60 }}>
      <Link className="back-link" href="/"><ArrowLeft size={15} aria-hidden="true"/> Kembali ke Pencarian</Link>
      {error && <div className="form-alert" role="alert">{error}</div>}
      <div className="col-detail">
        <div className="stack">
          <section aria-label="Galeri kamar">
            <div className="ph-lg" style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
              <FotoKamar key={foto.nama} src={foto.url} nama={foto.nama} alt={`${kamar.kosNama} Kamar ${kamar.nomor} — ${foto.label}`}/>
              <span className={`badge ${kosong ? 'b-green' : kamar.status === 'DIPESAN' ? 'b-amber' : 'b-slate'} ph-tag`} style={{ position: 'absolute', left: 14, top: 14 }}>{kosong ? 'Kosong' : kamar.status === 'DIPESAN' ? 'Dipesan' : 'Terisi'}</span>
              <span className="badge b-slate" style={{ position: 'absolute', bottom: 14, right: 14 }}>{fotoIdx + 1} / {gambar.galeri.length}</span>
            </div>
            <div className="thumb-row" style={{ overflowX: 'auto', paddingBottom: 3 }}>
              {gambar.galeri.map((item, index) => <button type="button" key={item.nama} onClick={() => setFotoIdx(index)} title={item.label} aria-label={`Tampilkan ${item.label.toLowerCase()}`} aria-pressed={index === fotoIdx} className={`ph-sm${index === fotoIdx ? ' active' : ''}`} style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}>
                <FotoKamar src={item.url} nama={item.nama} alt={item.label}/>
              </button>)}
            </div>
          </section>
          <section className="card card-pad">
            <div className="card-head" style={{ marginBottom: 12 }}>
              <div><h1 style={{ fontSize: 24 }}>Kamar {kamar.nomor} — {kamar.tipe === 'EKSKLUSIF' ? 'Eksklusif' : 'Standar'}</h1><p className="card-sub" style={{ fontSize: 14, marginTop: 6 }}>{kamar.kosNama}</p></div>
              <Badge tone={kosong ? 'success' : kamar.status === 'DIPESAN' ? 'warning' : 'slate'} dot>{kosong ? 'Kosong' : kamar.status === 'DIPESAN' ? 'Dipesan' : 'Terisi'}</Badge>
            </div>
            <p className="muted small" style={{ display: 'flex', gap: 6, marginBottom: 16 }}><MapPin size={16} style={{ flexShrink: 0 }} aria-hidden="true"/>{kamar.alamat || 'Alamat belum tersedia'}</p>
            {useMock && <div className="mb-16"><Badge tone="teal"><BadgeCheck size={14} aria-hidden="true"/>Kos terverifikasi</Badge></div>}
            <h2 className="card-title mb-8">Tentang kamar</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.8 }}>Kamar {kamar.tipe === 'EKSKLUSIF' ? 'eksklusif' : 'standar'} seluas {Number(kamar.luas)} m² di {kamar.kosNama}. Pilih paket sewa sesuai kebutuhan Anda dan baca aturan kos serta aturan denda sebelum mengajukan booking.</p>
          </section>
          <section className="card card-pad">
            <h2 className="card-title mb-16">Fasilitas Kamar &amp; Bersama</h2>
            <ul className="fac-list room-detail-facilities">{fasilitasDetail.length ? fasilitasDetail.map(({ nama, Icon }) => <li key={nama}><Icon size={18} aria-hidden="true"/><span>{nama}</span></li>) : <li className="muted">Belum ada data fasilitas.</li>}</ul>
          </section>
          <section className="card card-pad">
            <h2 className="card-title mb-16">Spesifikasi Teknis</h2>
            <dl className="kv room-detail-specs">
              <div><dt>Luas Kamar</dt><dd>{luasKamar}</dd></div>
              <div><dt>Kapasitas</dt><dd>{useMock ? infoKosDemo.kapasitas : 'Konfirmasi ke pemilik'}</dd></div>
              <div><dt>Listrik</dt><dd>{useMock ? infoKosDemo.listrik : 'Konfirmasi ke pemilik'}</dd></div>
              <div><dt>Jenis Kos</dt><dd>{useMock ? infoKosDemo.jenisKos : 'Konfirmasi ke pemilik'}</dd></div>
            </dl>
          </section>
          <section className="card card-pad">
            <h2 className="card-title mb-16">Lokasi &amp; Aksesibilitas Terdekat</h2>
            {alamat ? <>
              <div className="room-detail-map">
                <iframe title={`Peta lokasi ${kamar.kosNama ?? 'kos'} di ${alamat}`} src={`https://maps.google.com/maps?q=${kueriPeta}&z=15&output=embed`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>
              </div>
              <p className="room-detail-address"><MapPin size={15} aria-hidden="true"/><span>{alamat}</span></p>
              <a className="small bold" href={`https://www.google.com/maps/search/?api=1&query=${kueriPeta}`} target="_blank" rel="noopener noreferrer">Buka di Google Maps ↗</a>
            </> : <div className="info-box">Alamat kos belum tersedia, sehingga peta belum dapat ditampilkan.</div>}
            {useMock ? <>
              <ul className="room-detail-access">{aksesTerdekat.map((akses, index) => {
                const Icon = ikonAkses[index];
                return <li key={akses}><Icon size={15} aria-hidden="true"/><span>{akses}</span></li>;
              })}</ul>
              <p className="note mt-8">Informasi akses sekitar merupakan contoh mode demo, bukan jarak atau waktu tempuh terverifikasi.</p>
            </> : <p className="note mt-16">Informasi akses terdekat belum disediakan pemilik.</p>}
          </section>
        </div>
        <div className="stack">
          <section className="card card-pad">
            <div className="price-lg">{rupiah(kamar.hargaBulanan)} <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>/bulan</span></div>
            <p className="card-sub" style={{ marginBottom: 20 }}>{kamar.kosNama} · Kamar {kamar.nomor} {kamar.tipe === 'EKSKLUSIF' ? 'Eksklusif' : 'Standar'}</p>
            <h2 className="card-title mb-16">Pilih Paket Sewa</h2>
            <div className="radio-stack" role="radiogroup" aria-label="Paket sewa">
              {paket.map((item, index) => {
                const hargaNormal = kamar.hargaBulanan * item.durasiBulan;
                const hargaPaket = Math.round(hargaNormal * (100 - item.persenDiskon) / 100);
                return <label key={item.id} className={`radio-card${paketIdx === index ? ' selected' : ''}`}>
                  <input type="radio" name="paket" value={item.id} checked={paketIdx === index} onChange={() => setPaketIdx(index)}/>
                  <div className="rc-top">
                    <div><div className="rc-title">{item.nama}</div><div className="rc-sub">{item.durasiBulan} bulan</div></div>
                    <div className="rc-price">{rupiah(hargaPaket)}<span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>total {item.durasiBulan} bulan</span></div>
                  </div>
                  {hargaNormal > hargaPaket && <div className="mt-8"><Badge tone="teal">Hemat {rupiah(hargaNormal - hargaPaket)}</Badge></div>}
                </label>;
              })}
            </div>
            {paketError && <div className="form-alert mt-16" role="alert">{paketError}</div>}
            {!paket.length && !paketError && <p className="note">Paket sewa belum tersedia. Booking dapat diajukan setelah paket aktif dimuat.</p>}
            {total !== null && <div className="bill-rows mt-16"><div className="row total"><span className="lbl">Total sewa · {dipilih.nama}</span><span className="amt">{rupiah(total)}</span></div></div>}
          </section>
          <section className="card card-pad">
            <h2 className="card-title mb-8" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={19} color="var(--teal)" aria-hidden="true"/>Aturan Kos dan Aturan Denda</h2>
            <ul className="rule-list">
              <li><FileCheck2 size={17} className="ico" aria-hidden="true"/><span>{kamar.aturanKos || 'Aturan kos dikonfirmasi pemilik saat booking.'}</span></li>
              {kamar.tanggalJatuhTempo !== undefined && <li><CalendarDays size={17} className="ico" aria-hidden="true"/><span>Jatuh tempo pembayaran setiap <b>tanggal {kamar.tanggalJatuhTempo}</b>.</span></li>}
              {denda?.jenis === 'HARIAN' && <>
                <li><span className="ico" aria-hidden="true">Rp</span><span>Denda harian <b>{rupiah(denda.nominalPerHari)} per hari</b> setelah masa tenggang berakhir.</span></li>
                <li><Clock3 size={17} className="ico" aria-hidden="true"/><span>Masa tenggang pembayaran: <b>{denda.masaTenggang} hari</b>.</span></li>
                <li><ShieldCheck size={17} className="ico" aria-hidden="true"/><span>Maksimal denda: <b>{rupiah(denda.batasMaksimal)}</b>.</span></li>
              </>}
              {denda?.jenis === 'FLAT' && <li><span className="ico" aria-hidden="true">Rp</span><span>Denda tetap <b>{rupiah(denda.nominal)}</b> setelah masa tenggang {denda.masaTenggang} hari.</span></li>}
              {denda?.jenis === 'TANPA' && <li><Check size={17} className="ico" aria-hidden="true"/><span>Kos ini tidak memberlakukan denda keterlambatan.</span></li>}
              {!denda && <li><span>Aturan denda belum tersedia. Konfirmasikan kepada pemilik sebelum booking.</span></li>}
            </ul>
            <hr className="divider"/>
            <div className="check-row">
              <input type="checkbox" id="setuju-aturan" required checked={setuju} onChange={event => setSetuju(event.target.checked)} aria-describedby="bukti-persetujuan"/>
              <label htmlFor="setuju-aturan">Saya telah membaca dan menyetujui aturan kos dan aturan denda</label>
            </div>
            <p className="note mt-8" id="bukti-persetujuan" style={{ display: 'flex', gap: 6 }}><Clock3 size={15} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true"/>Waktu persetujuan Anda direkam otomatis sebagai bukti tertulis saat booking diajukan.</p>
            {bukanUser && <div className="info-box warning mt-16">Booking hanya tersedia untuk akun User. Akun {peran === 'PEMILIK' ? 'Pemilik' : 'SuperAdmin'} tidak dapat mengajukan booking.</div>}
            {!kosong && <div className="info-box warning mt-16">Kamar ini tidak kosong dan belum dapat dipesan.</div>}
            {akunError && <div className="form-alert mt-16" role="alert">{akunError}</div>}
            <button type="button" className="btn btn-primary btn-lg btn-block mt-16" disabled={!setuju || busy || memeriksaAkun || bukanUser || !kosong || !dipilih || Boolean(akunError)} onClick={ajukanBooking}>{busy ? 'Memeriksa akun…' : 'Ajukan Booking'}</button>
            {!peran && !memeriksaAkun && !akunError && <p className="note center mt-8">Anda akan diminta masuk sebelum melanjutkan booking.</p>}
            {bukanUser && <Link className="btn btn-outline btn-block mt-8" href={berandaPeran(peran)}>Kembali ke Dashboard</Link>}
          </section>
        </div>
      </div>
    </main>
  </div>;
}
