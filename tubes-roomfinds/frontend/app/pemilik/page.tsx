'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card, PageHead, StatCard } from '@/components/ui';
import { get } from '@/lib/api';
import { rupiah, periodeLabel } from '@/lib/format';
import { useKos } from '@/components/owner/useKos';
import { DemoNotice, demoLaporan, demoPendapatan, demoTagihan } from '@/components/owner/demo';
import type { ApiBill, ApiComplaint, ApiDelay, ApiOwnerBooking, ApiLaporan, ApiPayment } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const tugasDemo = [2, 2, 1, 3, 1];

export default function DashboardPemilik() {
  const { kos, loaded: kosLoaded, error: kosError } = useKos();
  const [periode, setPeriode] = useState('2026-10');
  const [laporan, setLaporan] = useState<ApiLaporan | null>(useMock ? demoLaporan : null);
  const [chart, setChart] = useState<{ periode: string; pendapatan: number }[]>(useMock ? demoPendapatan : []);
  const [booking, setBooking] = useState<ApiOwnerBooking[]>([]);
  const [pays, setPays] = useState<ApiPayment[]>([]);
  const [delays, setDelays] = useState<ApiDelay[]>([]);
  const [bills, setBills] = useState<ApiBill[]>(useMock ? demoTagihan : []);
  const [keluhan, setKeluhan] = useState<ApiComplaint[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!useMock);
  const bulanChart = useMemo(() => {
    const [tahun, bulan] = periode.split('-').map(Number);
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(tahun, bulan - 6 + i, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });
  }, [periode]);

  useEffect(() => {
    if (useMock) {
      setLaporan(periode === '2026-10' ? demoLaporan : null);
      setBills(demoTagihan.filter(b => b.periode.slice(0, 7) === periode));
      return;
    }
    if (!kos?.id) { setLoading(false); return; }
    let active = true;
    setLoading(true); setError(''); setLaporan(null); setChart([]);
    setBooking([]); setPays([]); setDelays([]); setBills([]); setKeluhan([]);
    const gagal = () => { if (active) setError('Sebagian data belum berhasil dimuat. Ringkasan mungkin belum lengkap.'); };
    const requests = [
      ...bulanChart.map(p => get<ApiLaporan>(`/api/kos/${kos.id}/laporan?periode=${p}`).then(data => {
        if (!active) return;
        setChart(prev => [...prev, { periode: p, pendapatan: data.pendapatan }]);
        if (p === periode) setLaporan(data);
      }).catch(gagal)),
      get<ApiOwnerBooking[]>(`/api/kos/${kos.id}/booking`).then(data => { if (active) setBooking(data); }).catch(gagal),
      get<ApiBill[]>(`/api/kos/${kos.id}/tagihan?periode=${periode}`).then(data => { if (active) setBills(data); }).catch(gagal),
      get<ApiComplaint[]>(`/api/kos/${kos.id}/keluhan`).then(data => { if (active) setKeluhan(data); }).catch(gagal),
      get<ApiPayment[]>('/api/pembayaran/riwayat').then(data => { if (active) setPays(data); }).catch(gagal),
      get<ApiDelay[]>('/api/penundaan').then(data => { if (active) setDelays(data); }).catch(gagal),
    ];
    Promise.all(requests).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kos?.id, periode, bulanChart]);

  const counts = useMock ? tugasDemo : [
    booking.filter(b => b.status === 'MENUNGGU').length,
    pays.filter(p => p.status === 'MENUNGGU_VERIFIKASI').length,
    delays.filter(d => d.status === 'MENUNGGU').length,
    bills.filter(b => b.meteranAkhir == null && b.status !== 'LUNAS').length,
    keluhan.filter(q => q.status === 'DILAPORKAN').length,
  ];
  const tugas = [
    { t: 'Booking menunggu persetujuan', href: '/pemilik/booking', ico: '📥' },
    { t: 'Pembayaran menunggu verifikasi', href: '/pemilik/pembayaran', ico: '✅' },
    { t: 'Pengajuan penundaan', href: '/pemilik/pembayaran', ico: '⏳' },
    { t: 'Meteran listrik belum diisi', href: '/pemilik/tagihan', ico: '⚡' },
    { t: 'Keluhan baru berstatus Dilaporkan', href: '/pemilik/keluhan', ico: '🛠️' },
  ].map((t, i) => ({ ...t, n: counts[i] })).filter(t => t.n > 0);
  const menunggak = bills.filter(b => b.status !== 'LUNAS' && b.sisa > 0);
  const jumlahUserMenunggak = new Set(menunggak.map(b => b.penyewaNama ?? `booking-${b.bookingId}`)).size;
  const hunian = laporan && laporan.jumlahKamar > 0 ? Math.round(100 * laporan.kamarTerisi / laporan.jumlahKamar) : 0;
  const maxPendapatan = Math.max(1, ...chart.map(b => b.pendapatan));

  return <div>
    <PageHead title="Dashboard Pemilik & Laporan Bulanan" sub="Ringkasan pendapatan, tunggakan, dan pekerjaan yang menunggu tindakan Anda."
      action={<div className="field" style={{ marginBottom: 0, minWidth: 210 }}><select value={periode} onChange={e => setPeriode(e.target.value)} aria-label="Pilih periode">{['2026-10', '2026-09', '2026-08'].map(p => <option key={p} value={p}>Periode {periodeLabel(p)}</option>)}</select></div>}/>
    <DemoNotice/>
    {(error || kosError) && <div className="form-alert" role="alert">{error || kosError}</div>}
    {(loading || !kosLoaded) && <p className="note mb-16" role="status">Memuat ringkasan…</p>}
        {kosLoaded && !kos && !kosError && <p className="note mb-16">Belum ada data kos untuk ditampilkan.</p>}
    {useMock && !laporan && <p className="note mb-16">Contoh laporan lengkap tersedia untuk Oktober 2026. Grafik tetap menampilkan pendapatan yang tersedia.</p>}
    <div className="grid-4">
      <StatCard label="Pendapatan" value={laporan ? rupiah(laporan.pendapatan) : '—'} sub={`Pembayaran diterima ${periodeLabel(periode)}`}/>
      <StatCard label="Tunggakan" value={laporan ? rupiah(laporan.tunggakan) : '—'} sub="Tagihan belum lunas"/>
      <StatCard label="Hunian" value={laporan ? `${hunian}%` : '—'} sub={laporan ? `${laporan.kamarTerisi} dari ${laporan.jumlahKamar} kamar` : ''}>
        <div className="progress"><div className="progress-fill" style={{ width: `${hunian}%` }}/></div>
      </StatCard>
      <StatCard label="User Menunggak" value={loading || !kosLoaded || !kos || error || kosError ? '—' : String(jumlahUserMenunggak)} sub="Lihat daftar di bawah"/>
    </div>

    <Card className="mt-24">
      <div className="card-head"><div><h3 className="card-title">🔔 Perlu Tindakan</h3><p className="card-sub">Hal-hal yang menunggu keputusan atau input Anda.</p></div></div>
      {tugas.length === 0 ? <p className="muted">{loading || error ? 'Data tindakan belum lengkap.' : 'Tidak ada pekerjaan menunggu.'}</p> : <div className="action-list">
        {tugas.map(t => <Link key={t.t} href={t.href}><span className="ico" aria-hidden="true">{t.ico}</span> {t.t} <span className="cnt">{t.n}</span><span className="chev" aria-hidden="true">›</span></Link>)}
      </div>}
    </Card>

    <div className="grid-2 mt-24" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
      <Card>
        <div className="card-head"><div><h3 className="card-title">Pendapatan 6 Bulan Terakhir</h3><p className="card-sub">Dalam juta Rupiah · hingga {periodeLabel(periode)}</p></div></div>
        <div className="chart" role="img" aria-label={bulanChart.map(p => { const data = chart.find(b => b.periode === p); return `${periodeLabel(p)}: ${data ? rupiah(data.pendapatan) : 'belum tersedia'}`; }).join('; ')}>
          {bulanChart.map(p => { const data = chart.find(b => b.periode === p); return <div key={p} className="chart-col"><span className="bar-val">{data ? (data.pendapatan / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'}</span><div className="bar" style={{ height: data ? `${data.pendapatan / maxPendapatan * 78}%` : 0 }}/><span className="bar-lbl">{new Date(`${p}-01T00:00:00`).toLocaleDateString('id-ID', { month: 'short' })}</span></div>; })}
        </div>
      </Card>
      <Card>
        <div className="card-head"><div><h3 className="card-title">User Menunggak</h3><p className="card-sub">{periodeLabel(periode)}</p></div></div>
        {menunggak.length === 0 ? <p className="muted">{loading || error ? 'Data tunggakan belum lengkap.' : 'Tidak ada tunggakan pada periode ini.'}</p> : <div className="table-wrap"><table className="data-table">
          <thead><tr><th>User</th><th>Kamar</th><th>Periode</th><th>Jumlah</th><th>Lihat Tagihan</th></tr></thead>
          <tbody>{menunggak.map(b => <tr key={b.id}>
            <td className="bold">{b.penyewaNama ?? 'User'}</td><td>{b.kamarNomor}</td><td>{periodeLabel(b.periode.slice(0, 7))}</td><td className="num">{rupiah(b.sisa)}</td>
            <td><Link className="btn btn-outline btn-sm" href="/pemilik/tagihan">Lihat Tagihan</Link></td>
          </tr>)}</tbody>
        </table></div>}
      </Card>
    </div>
  </div>;
}
