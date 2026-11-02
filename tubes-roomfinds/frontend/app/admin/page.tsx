'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge, Card, PageHead, StatCard } from '@/components/ui';
import { get } from '@/lib/api';
import { rupiah } from '@/lib/format';
import type { ApiAdminKos, ApiAdminStats } from '@/types';
import { demoQueue, demoStats } from './demo';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const tanggalAntrean = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default function DashboardStatistik() {
  const [stats, setStats] = useState<ApiAdminStats | null>(useMock ? demoStats : null);
  const [queue, setQueue] = useState<ApiAdminKos[]>(useMock ? demoQueue : []);
  const [error, setError] = useState('');
  const [queueError, setQueueError] = useState('');
  const [queueLoading, setQueueLoading] = useState(!useMock);

  useEffect(() => {
    if (useMock) return;
    get<ApiAdminStats>('/api/admin/statistik').then(setStats).catch(e => setError(e instanceof Error ? e.message : 'Statistik belum berhasil dimuat.'));
    get<ApiAdminKos[]>('/api/admin/kos?status=MENUNGGU').then(setQueue).catch(e => setQueueError(e instanceof Error ? e.message : 'Antrean verifikasi belum berhasil dimuat.')).finally(() => setQueueLoading(false));
  }, []);

  const totalAkun = stats ? stats.jumlahPenggunaPerPeran.USER + stats.jumlahPenggunaPerPeran.PEMILIK + stats.jumlahPenggunaPerPeran.SUPERADMIN : 0;
  const totalKos = stats ? Object.values(stats.kosPerStatus).reduce((a, b) => a + b, 0) : 0;
  const tumbuh = [{ l: 'Mei', v: 68 }, { l: 'Jun', v: 74 }, { l: 'Jul', v: 80 }, { l: 'Agu', v: 85 }, { l: 'Sep', v: 92 }, { l: 'Okt', v: 100 }];
  const latestQueue = [...queue].filter(k => k.statusVerifikasi === 'MENUNGGU').sort((a, b) => new Date(b.dibuatPada).getTime() - new Date(a.dibuatPada).getTime());

  return <div style={{ minWidth: 0 }}>
    <PageHead title="Statistik Platform" sub="Ringkasan akun, kos, dan kamar di seluruh RoomFinds."/>
    {error && <div className="form-alert" role="alert">{error}</div>}
    {stats && <div className="grid-5">
      <StatCard label="Total Akun" value={String(totalAkun)}>
        <div className="stat-rows">
          <div className="stat-row"><span>Pemilik</span><span className="val">{stats.jumlahPenggunaPerPeran.PEMILIK}</span></div>
          <div className="stat-row"><span>User</span><span className="val">{stats.jumlahPenggunaPerPeran.USER}</span></div>
          <div className="stat-row"><span>SuperAdmin</span><span className="val">{stats.jumlahPenggunaPerPeran.SUPERADMIN}</span></div>
        </div>
      </StatCard>
      <StatCard label="Status Kos" value={String(totalKos)}>
        <div className="stat-rows">
          <div className="stat-row"><span className="dot dot-green"/> Terverifikasi <span className="val">{stats.kosPerStatus.TERVERIFIKASI}</span></div>
          <div className="stat-row"><span className="dot dot-amber"/> Menunggu <span className="val">{stats.kosPerStatus.MENUNGGU}</span></div>
          <div className="stat-row"><span className="dot dot-red"/> Ditolak <span className="val">{stats.kosPerStatus.DITOLAK}</span></div>
        </div>
      </StatCard>
      <StatCard label="Kamar Kosong" value={String(stats.kamarKosong)} sub="Siap disewa di kos terverifikasi"/>
      <StatCard label="Harga Rata-Rata" value={rupiah(stats.hargaRataRata)} sub="per bulan"/>
      <StatCard label="Okupansi Platform" value={`${stats.tingkatHunian}%`} sub="Kamar terisi dari total kamar">
        <div className="progress" role="progressbar" aria-label="Okupansi Platform" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats.tingkatHunian}><div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, stats.tingkatHunian))}%` }}/></div>
      </StatCard>
    </div>}
    {stats && <p className="note mt-16">Statistik dihitung dari kos TERVERIFIKASI, kecuali antrean verifikasi.</p>}

    <Card className="mt-16">
      <div className="card-head"><div><h3 className="card-title">Pertumbuhan Akun 6 Bulan Terakhir</h3><p className="card-sub">{useMock ? 'Ilustrasi data demo, bukan riwayat akun aktual.' : 'Riwayat jumlah akun terdaftar per bulan'}</p></div></div>
      {useMock ? <div className="chart">
        {tumbuh.map(m => <div key={m.l} className="chart-col"><span className="bar-val">{stats ? Math.round(totalAkun * m.v / 100) : ''}</span><div className="bar" style={{ height: `${m.v}%` }}/><span className="bar-lbl">{m.l}</span></div>)}
      </div> : <div className="chart" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p className="muted" role="status">Data historis pertumbuhan akun belum tersedia.</p>
      </div>}
    </Card>

    <Card className="mt-24" style={{ width: '100%', minWidth: 0 }}>
      <div className="card-head"><div><h3 className="card-title">Antrean Verifikasi Terbaru</h3><p className="card-sub">Kos berstatus Menunggu verifikasi SuperAdmin.</p></div><Link className="btn btn-outline btn-sm" href="/admin/verifikasi">Buka Verifikasi Kos</Link></div>
      {queueError ? <div className="form-alert" role="alert">{queueError}</div> : queueLoading ? <p className="muted" role="status">Memuat antrean verifikasi…</p> : latestQueue.length === 0 ? <p className="muted">Tidak ada kos menunggu verifikasi.</p> : <div className="table-wrap"><table className="data-table" style={{ width: '100%' }}>
        <thead><tr><th>Kos</th><th>Pemilik</th><th>Tanggal Diajukan</th><th>Status</th></tr></thead>
        <tbody>
          {latestQueue.map(k => <tr key={k.id}>
            <td className="bold">{k.nama}</td><td>{k.pemilikNama}</td><td>{tanggalAntrean.format(new Date(k.dibuatPada))}</td>
            <td style={{ minWidth: 130, whiteSpace: 'nowrap' }}><Badge tone="warning" dot>Menunggu</Badge></td>
          </tr>)}
        </tbody>
      </table></div>}
    </Card>
  </div>;
}
