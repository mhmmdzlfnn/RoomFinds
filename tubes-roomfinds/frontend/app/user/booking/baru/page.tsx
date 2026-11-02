'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Badge } from '@/components/ui';
import { get, post } from '@/lib/api';
import { isoHariIni, rupiah } from '@/lib/format';
import { bacaBookingDemo, bookingMasihAktif, buatBookingDemo } from '@/app/user/demo';
import { kamarDemo, paketDemo } from '@/app/kamar/demo';
import { bacaProfilDemo, berandaPeran } from '@/app/login/demo';
import type { ApiBooking, ApiPaket, ApiRoom } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

function Konten() {
  const params = useSearchParams();
  const kamarId = Number(params.get('kamar') ?? 0);
  const paketIndex = Math.max(Number(params.get('paket') ?? 0), 0);
  const [paketIdx, setPaketIdx] = useState(paketIndex);
  const [kamar, setKamar] = useState<ApiRoom | null>(null);
  const [paket, setPaket] = useState<ApiPaket[]>([]);
  const [tanggalMasuk, setTanggalMasuk] = useState('2026-11-01');
  const [setuju, setSetuju] = useState(false);
  const [sukses, setSukses] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [bookingAktif, setBookingAktif] = useState(false);
  const [sudahPeriksa, setSudahPeriksa] = useState(false);
  const hariIni = useMock ? '2026-10-26' : isoHariIni();

  useEffect(() => {
    if (useMock) {
      const profil = bacaProfilDemo();
      if (!profil || profil.peran !== 'USER') { setError('Booking hanya dapat diajukan oleh akun User. Silakan masuk dengan akun User.'); return; }
      try { setBookingAktif(bacaBookingDemo().some(bookingMasihAktif)); setSudahPeriksa(true); }
      catch (e) { setError(e instanceof Error ? e.message : 'Status booking demo belum berhasil diperiksa.'); }
      return;
    }
    get<ApiBooking[]>('/api/booking/saya').then(list => { setBookingAktif(list.some(b => b.status === 'MENUNGGU' || b.status === 'DISETUJUI')); setSudahPeriksa(true); }).catch(e => setError(e instanceof Error ? e.message : 'Status booking aktif belum berhasil diperiksa.'));
  }, []);

  useEffect(() => {
    let active = true;
    setKamar(null); setPaket([]); setPaketIdx(paketIndex); setSetuju(false);
    if (useMock) {
      const k = kamarDemo.find(x => x.id === kamarId);
      if (!k) { setError('Kamar tidak ditemukan. Pilih kamar dari halaman pencarian terlebih dahulu.'); return; }
      setKamar(k); setPaket(paketDemo.map(p => ({ ...p, kosId: k.kosId })).filter(p => p.aktif).sort((a, b) => a.durasiBulan - b.durasiBulan));
      return;
    }
    if (!kamarId) { setError('Pilih kamar dari halaman pencarian terlebih dahulu.'); return; }
    get<ApiRoom>(`/api/kamar/${kamarId}`).then(k => {
      if (!active) return;
      setKamar(k);
      return get<ApiPaket[]>(`/api/kos/${k.kosId}/paket`);
    }).then(l => { if (active && l) setPaket(l.filter(x => x.aktif).sort((a, b) => a.durasiBulan - b.durasiBulan)); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Data kamar belum berhasil dimuat.'); });
    return () => { active = false; };
  }, [kamarId, paketIndex]);

  async function ajukan() {
    if (busy || sukses) return;
    setError('');
    if (useMock) {
      const profil = bacaProfilDemo();
      if (!profil || profil.peran !== 'USER') {
        setSudahPeriksa(false);
        window.location.replace(profil ? berandaPeran(profil.peran) : `/login?${new URLSearchParams({ next: `${window.location.pathname}${window.location.search}` })}`);
        return;
      }
    }
    if (!setuju) { setError('Anda harus menyetujui aturan kos dan aturan denda.'); return; }
    if (!sudahPeriksa || bookingAktif) { setError('Anda masih memiliki booking aktif. Selesaikan atau batalkan booking tersebut terlebih dahulu.'); return; }
    if (!kamar || !paket[paketIdx] || !tanggalMasuk || tanggalMasuk < hariIni) { setError('Pilih kamar, paket, dan tanggal masuk yang valid.'); return; }
    setBusy(true);
    try {
      if (useMock) {
        buatBookingDemo({ kamar, paket: paket[paketIdx], tanggalMasuk, setujuAturan: setuju });
        setBookingAktif(true);
      } else {
        const list = await get<ApiBooking[]>('/api/booking/saya');
        if (list.some(b => b.status === 'MENUNGGU' || b.status === 'DISETUJUI')) { setBookingAktif(true); throw new Error('Anda masih memiliki booking aktif. Booking baru tidak dikirim.'); }
        await post('/api/booking', { kamarId, paketId: paket[paketIdx].id, tanggalMasuk, setujuAturan: true });
      }
      setSukses(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Booking belum berhasil. Coba lagi.'); } finally { setBusy(false); }
  }

  if (sukses) return <div className="page" style={{ maxWidth: 640, margin: '0 auto', paddingTop: 70 }}>
    <div className="card card-pad center" style={{ padding: 46 }}>
      <div style={{ fontSize: 42 }}>✅</div>
      <h1 style={{ marginTop: 12 }}>Booking berhasil diajukan</h1>
      <p className="muted" style={{ marginTop: 8 }}>{useMock ? 'Booking demo tersimpan pada sesi browser ini. Pantau pengajuan Anda di Booking Saya. Tidak ada data yang dikirim ke server.' : 'Pemilik kos sudah menerima permintaan booking Anda. Pantau statusnya di halaman Booking Saya.'}</p>
      <Link className="btn btn-primary btn-lg mt-16" href="/user/booking">Lihat Booking Saya</Link>
    </div>
  </div>;

  const harga = kamar?.hargaBulanan ?? 0;
  const dipilih = paket[paketIdx];
  const total = kamar && dipilih ? Math.round(harga * dipilih.durasiBulan * (100 - dipilih.persenDiskon) / 100) : null;
  const denda = kamar?.aturanDenda as { jenis?: string; nominalPerHari?: number; nominal?: number; masaTenggang?: number; batasMaksimal?: number } | null | undefined;
  const dendaTeks = !denda ? 'Aturan denda dikonfirmasi pemilik saat booking.'
    : denda.jenis === 'HARIAN' ? `Denda ${rupiah(denda.nominalPerHari ?? 0)} per hari setelah masa tenggang ${denda.masaTenggang ?? 0} hari, maksimal ${rupiah(denda.batasMaksimal ?? 0)}.`
    : denda.jenis === 'FLAT' ? `Denda tetap ${rupiah(denda.nominal ?? 0)} setelah masa tenggang ${denda.masaTenggang ?? 0} hari.`
    : 'Tanpa denda keterlambatan.';

  return <div>
    <Link className="back-link" href={kamarId ? `/kamar/${kamarId}` : '/'}>← Kembali ke Detail Kamar</Link>
    <div className="page-head"><div><h1>Ajukan Booking</h1><div className="sub">Baca aturan kos, pilih paket, lalu ajukan booking Anda.</div></div></div>
    {bookingAktif && <div className="info-box warning mb-16">Anda hanya dapat memiliki satu booking aktif. <Link href="/user/booking">Lihat Booking Saya</Link></div>}
        <div className="col-detail">
      <div className="stack">
        <section className="card card-pad">
          <div className="card-head"><div><h3 className="card-title">Aturan {kamar?.kosNama ?? 'Kos'}</h3><p className="card-sub">{kamar?.alamat ?? 'Jakarta Selatan'}</p></div><Badge tone="success">Terverifikasi</Badge></div>
          <div style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 6 }}>
            <p style={{ fontSize: 14.5, lineHeight: 1.7 }}>{kamar?.aturanKos || 'Aturan kos akan dikonfirmasi pemilik sebelum booking diproses.'}</p>
          </div>
          <hr className="divider"/>
          <div className="check-row">
            <input type="checkbox" id="setuju" checked={setuju} onChange={e => setSetuju(e.target.checked)}/>
            <label htmlFor="setuju">Saya telah membaca dan menyetujui aturan kos dan aturan denda</label>
          </div>
          <p className="note mt-8">🕒 Waktu persetujuan Anda direkam otomatis sebagai bukti tertulis.</p>
        </section>
        <section className="card card-pad">
          <h3 className="card-title mb-8">Aturan Denda</h3>
          <div className="info-box">{dendaTeks}</div>
        </section>
      </div>
      <div className="stack">
        <section className="card card-pad">
          <div className="price-lg">{kamar ? rupiah(harga) : '—'} <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>/bulan</span></div>
          <p className="card-sub" style={{ marginBottom: 14 }}>{kamar ? `${kamar.kosNama ?? 'Kos'} · Kamar ${kamar.nomor}` : 'Memuat kamar…'}</p>
          <h3 className="card-title mb-16">Pilih Paket Sewa</h3>
          <div className="radio-stack">
            {paket.map((p, i) => {
              const tot = Math.round(harga * p.durasiBulan * (100 - p.persenDiskon) / 100);
              return <label key={p.id || i} className="radio-card" onClick={() => setPaketIdx(i)}>
                <input type="radio" name="paket" checked={paketIdx === i} readOnly/>
                <div className="rc-top">
                  <div><div className="rc-title">{p.nama} {p.persenDiskon > 0 && <Badge tone="teal">Hemat {p.persenDiskon}%</Badge>}</div><div className="rc-sub">{p.durasiBulan} bulan</div></div>
                  <div className="rc-price">{rupiah(tot)}<span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', fontWeight: 500 }}>total {p.durasiBulan} bulan</span></div>
                </div>
              </label>;
            })}
          </div>
        </section>
        <section className="card card-pad">
          <div className="field"><label>Tanggal Masuk</label><input type="date" value={tanggalMasuk} min={hariIni} onChange={e => setTanggalMasuk(e.target.value)}/></div>
          <dl className="kv" style={{ margin: '10px 0 16px' }}>
            <div><dt>Paket</dt><dd>{dipilih?.nama ?? 'Belum dipilih'}{dipilih && dipilih.persenDiskon > 0 ? ` · Hemat ${dipilih.persenDiskon}%` : ''}</dd></div>
            <div><dt>Durasi</dt><dd>{dipilih ? `${dipilih.durasiBulan} bulan` : '—'}</dd></div>
            <div><dt>Total sewa</dt><dd>{total === null ? '—' : rupiah(total)}</dd></div>
          </dl>
          <button className="btn btn-primary btn-lg btn-block" disabled={!setuju || busy || bookingAktif || !sudahPeriksa || !kamar || !paket[paketIdx]} onClick={ajukan}>{busy ? 'Mengirim…' : 'Ajukan Booking'}</button>
          {error && <div className="form-alert mt-16" role="alert">{error}</div>}
        </section>
      </div>
    </div>
  </div>;
}

export default function BookingBaru() { return <Suspense fallback={null}><Konten/></Suspense>; }
