'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  Building,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  CircleDollarSign,
  Info,
  PieChart,
  Users,
} from 'lucide-react';
import { get } from '@/lib/api';
import { rupiah } from '@/lib/format';
import type { ApiAdminKos, ApiAdminStats } from '@/types';
import { demoQueue, demoStats } from './demo';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const tanggalAntrean = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function getInitials(nama: string) {
  return nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function DashboardStatistik() {
  const [stats, setStats] = useState<ApiAdminStats | null>(useMock ? demoStats : null);
  const [queue, setQueue] = useState<ApiAdminKos[]>(useMock ? demoQueue : []);
  const [error, setError] = useState('');
  const [queueError, setQueueError] = useState('');
  const [queueLoading, setQueueLoading] = useState(!useMock);

  useEffect(() => {
    if (useMock) return;
    get<ApiAdminStats>('/api/admin/statistik')
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Statistik belum berhasil dimuat.'));
    get<ApiAdminKos[]>('/api/admin/kos?status=MENUNGGU')
      .then(setQueue)
      .catch((e) =>
        setQueueError(e instanceof Error ? e.message : 'Antrean verifikasi belum berhasil dimuat.')
      )
      .finally(() => setQueueLoading(false));
  }, []);

  const totalAkun = stats
    ? stats.jumlahPenggunaPerPeran.USER +
      stats.jumlahPenggunaPerPeran.PEMILIK +
      stats.jumlahPenggunaPerPeran.SUPERADMIN
    : 211;

  const totalKos = stats ? Object.values(stats.kosPerStatus).reduce((a, b) => a + b, 0) : 26;
  const latestQueue = [...queue]
    .filter((k) => k.statusVerifikasi === 'MENUNGGU')
    .sort((a, b) => new Date(b.dibuatPada).getTime() - new Date(a.dibuatPada).getTime());

  return (
    <div className="admin-dash-container">
      {/* ── Header ── */}
      <header className="admin-dash-header">
        <h1 className="admin-dash-title">Dashboard Statistik</h1>
        <p className="admin-dash-sub">
          Ringkasan performa dan metrik operasional platform RoomFinds
        </p>
      </header>

      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      {/* ── 5 Stat Cards Grid ── */}
      {stats && (
        <div className="admin-stats-grid-5">
          {/* Card 1: TOTAL AKUN */}
          <div className="admin-stat-card">
            <div>
              <div className="admin-stat-top">
                <span className="admin-stat-label">TOTAL AKUN</span>
                <div className="admin-stat-icon">
                  <Users size={15} aria-hidden="true" />
                </div>
              </div>
              <div className="admin-stat-main-val">{totalAkun} Akun</div>
            </div>
            <div className="admin-sub-rows">
              <div className="admin-sub-row">
                <span className="lbl">Pemilik</span>
                <span className="val">{stats.jumlahPenggunaPerPeran.PEMILIK}</span>
              </div>
              <div className="admin-sub-row">
                <span className="lbl">Penyewa</span>
                <span className="val">{stats.jumlahPenggunaPerPeran.USER}</span>
              </div>
              <div className="admin-sub-row">
                <span className="lbl">SuperAdmin</span>
                <span className="val">{stats.jumlahPenggunaPerPeran.SUPERADMIN}</span>
              </div>
            </div>
          </div>

          {/* Card 2: STATUS KOS */}
          <div className="admin-stat-card">
            <div>
              <div className="admin-stat-top">
                <span className="admin-stat-label">STATUS KOS</span>
                <div className="admin-stat-icon">
                  <Building size={15} aria-hidden="true" />
                </div>
              </div>
              <div className="admin-stat-main-val">{totalKos} Total Kos</div>
            </div>
            <div className="admin-sub-rows">
              <div className="admin-sub-row">
                <span className="lbl">
                  <span className="admin-status-dot dot-green" />
                  Terverifikasi
                </span>
                <span className="val">{stats.kosPerStatus.TERVERIFIKASI}</span>
              </div>
              <div className="admin-sub-row">
                <span className="lbl">
                  <span className="admin-status-dot dot-amber" />
                  Menunggu
                </span>
                <span className="val">{stats.kosPerStatus.MENUNGGU}</span>
              </div>
              <div className="admin-sub-row">
                <span className="lbl">
                  <span className="admin-status-dot dot-red" />
                  Ditolak
                </span>
                <span className="val">{stats.kosPerStatus.DITOLAK}</span>
              </div>
            </div>
          </div>

          {/* Card 3: KAMAR KOSONG */}
          <div className="admin-stat-card">
            <div>
              <div className="admin-stat-top">
                <span className="admin-stat-label">KAMAR KOSONG</span>
                <div className="admin-stat-icon">
                  <BedDouble size={15} aria-hidden="true" />
                </div>
              </div>
              <div className="admin-stat-main-val">{stats.kamarKosong} Kamar</div>
            </div>
            <div className="admin-stat-pill-info">
              <CheckCircle2 size={13} className="text-teal" style={{ flex: 'none' }} aria-hidden="true" />
              <span>Tersedia untuk disewa saat ini</span>
            </div>
          </div>

          {/* Card 4: HARGA RATA-RATA */}
          <div className="admin-stat-card">
            <div>
              <div className="admin-stat-top">
                <span className="admin-stat-label">HARGA RATA-RATA</span>
                <div className="admin-stat-icon">
                  <CircleDollarSign size={15} aria-hidden="true" />
                </div>
              </div>
              <div className="admin-stat-price-val">{rupiah(stats.hargaRataRata)}</div>
            </div>
            <div className="admin-stat-pill-info">
              <Calendar size={13} className="text-teal" style={{ flex: 'none' }} aria-hidden="true" />
              <span>Per bulan / unit kos</span>
            </div>
          </div>

          {/* Card 5: OKUPANSI PLATFORM */}
          <div className="admin-stat-card">
            <div>
              <div className="admin-stat-top">
                <span className="admin-stat-label">OKUPANSI PLATFORM</span>
                <div className="admin-stat-icon">
                  <PieChart size={15} aria-hidden="true" />
                </div>
              </div>
              <div className="admin-stat-main-val">{stats.tingkatHunian}%</div>
            </div>
            <div className="admin-stat-progress-wrap">
              <div className="admin-stat-progress-bar">
                <div
                  className="admin-stat-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, stats.tingkatHunian))}%` }}
                />
              </div>
              <div className="admin-stat-progress-sub">Tingkat keterisian kamar</div>
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="admin-note-text">
        <Info size={14} className="muted" aria-hidden="true" />
        <span>Statistik dihitung dari kos TERVERIFIKASI, kecuali antrean verifikasi</span>
      </div>

      {/* ── Antrean Verifikasi Terbaru Card ── */}
      <section className="admin-antrean-card">
        <div className="admin-antrean-head">
          <div className="admin-antrean-head-left">
            <div className="admin-antrean-head-icon">
              <CheckSquare size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="admin-antrean-title">Antrean Verifikasi Terbaru</h2>
              <p className="admin-antrean-sub">Permohonan kos baru yang membutuhkan peninjauan</p>
            </div>
          </div>

          <div className="admin-antrean-count-badge">
            <span className="admin-antrean-count-dot" />
            <span>{latestQueue.length} Menunggu Verifikasi</span>
          </div>
        </div>

        {queueError ? (
          <div className="form-alert" role="alert">
            {queueError}
          </div>
        ) : queueLoading ? (
          <p className="muted" role="status" style={{ padding: '16px 0' }}>
            Memuat antrean verifikasi…
          </p>
        ) : latestQueue.length === 0 ? (
          <p className="muted" style={{ padding: '16px 0' }}>
            Tidak ada kos menunggu verifikasi.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>NAMA KOS</th>
                  <th>PEMILIK</th>
                  <th>TANGGAL PENGAJUAN</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {latestQueue.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <div className="admin-kos-cell">
                        <div className="admin-kos-icon">
                          <Building2 size={16} aria-hidden="true" />
                        </div>
                        <div>
                          <div className="admin-kos-name">{k.nama}</div>
                          <div className="admin-kos-loc">{k.alamat}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="admin-owner-cell">
                        <div className="admin-owner-avatar">
                          {getInitials(k.pemilikNama ?? 'P')}
                        </div>
                        <span className="admin-owner-name">{k.pemilikNama}</span>
                      </div>
                    </td>

                    <td>{tanggalAntrean.format(new Date(k.dibuatPada))}</td>

                    <td>
                      <span className="admin-status-pill">
                        <span className="admin-status-dot-amber" />
                        <span>Menunggu</span>
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <Link className="admin-btn-lihat" href={`/admin/verifikasi`}>
                        <span>Lihat</span>
                        <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
