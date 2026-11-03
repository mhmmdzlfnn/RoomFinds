'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bed,
  Bell,
  CreditCard,
  Download,
  FileText,
  Hourglass,
  LayoutGrid,
  Lightbulb,
  PlusCircle,
  Receipt,
  Send,
  UserPlus,
  Users,
  Wallet,
  Wrench,
  Zap,
} from 'lucide-react';
import { rupiah } from '@/lib/format';

interface MenunggakItem {
  id: number;
  nama: string;
  email: string;
  inisial: string;
  avatarBg: string;
  avatarColor: string;
  kamar: string;
  lantai: string;
  periode: string;
  sisaTagihan: number;
}

const daftarMenunggak: MenunggakItem[] = [
  {
    id: 1,
    nama: 'Budi Santoso',
    email: 'budi.santoso@email.com',
    inisial: 'BS',
    avatarBg: '#E6F7F5',
    avatarColor: '#2A5B53',
    kamar: 'Kamar 204',
    lantai: '(Lt 2)',
    periode: 'Oktober 2026',
    sisaTagihan: 1668750,
  },
  {
    id: 2,
    nama: 'Rian Hidayat',
    email: 'rian.h@email.com',
    inisial: 'RH',
    avatarBg: '#FEE2E2',
    avatarColor: '#DC2626',
    kamar: 'Kamar 102',
    lantai: '(Lt 1)',
    periode: 'Oktober 2026',
    sisaTagihan: 1668750,
  },
];

const dataChart = [
  { bulan: 'Mei', nilai: '24.2M', tinggi: 60, aktif: false },
  { bulan: 'Jun', nilai: '25.5M', tinggi: 66, aktif: false },
  { bulan: 'Jul', nilai: '27.0M', tinggi: 74, aktif: false },
  { bulan: 'Agu', nilai: '26.8M', tinggi: 72, aktif: false },
  { bulan: 'Sep', nilai: '27.6M', tinggi: 77, aktif: false },
  { bulan: 'Okt', nilai: '28.4M', tinggi: 86, aktif: true },
];

export default function DashboardPemilik() {
  const [notifSent, setNotifSent] = useState(false);

  function kirimUlangNotifikasi() {
    setNotifSent(true);
    setTimeout(() => setNotifSent(false), 4000);
  }

  return (
    <div className="owner-dash-container">
      {/* 1. Welcome Banner */}
      <section className="owner-welcome-card">
        <div className="owner-welcome-left">
          <div className="owner-welcome-icon">
            <LayoutGrid size={22} aria-hidden="true" />
          </div>
          <div>
            <div className="owner-welcome-title-row">
              <h1 className="owner-welcome-title">Selamat Datang, Fariz</h1>
              <span className="owner-welcome-badge">Akun Terverifikasi</span>
            </div>
            <p className="owner-welcome-sub">
              Berikut ringkasan performa operasional Kos Melati Putri untuk periode berjalan.
            </p>
          </div>
        </div>

        <div className="owner-welcome-actions">
          <button type="button" className="owner-btn-secondary" onClick={() => alert('Mengunduh laporan bulanan…')}>
            <Download size={15} aria-hidden="true" />
            <span>Unduh Laporan</span>
          </button>
          <button type="button" className="owner-btn-primary" onClick={() => alert('Membuka formulir pencatatan pemasukan…')}>
            <PlusCircle size={15} aria-hidden="true" />
            <span>Catat Pemasukan</span>
          </button>
        </div>
      </section>

      {/* 2. 4 Stat Cards */}
      <div className="owner-stats-grid">
        {/* Card 1: Pendapatan */}
        <div className="owner-stat-card">
          <div className="owner-stat-top">
            <span className="owner-stat-label">Total Pendapatan Bulan Ini</span>
            <div className="owner-stat-icon-wrap icon-teal">
              <Wallet size={16} aria-hidden="true" />
            </div>
          </div>
          <div className="owner-stat-value">Rp28.400.000</div>
          <div className="owner-stat-bottom">
            <span className="owner-stat-pill pill-green">
              <ArrowUpRight size={13} aria-hidden="true" /> +8.5%
            </span>
            <span className="owner-stat-hint">dari bulan lalu</span>
          </div>
        </div>

        {/* Card 2: Tunggakan */}
        <div className="owner-stat-card">
          <div className="owner-stat-top">
            <span className="owner-stat-label">Total Tunggakan</span>
            <div className="owner-stat-icon-wrap icon-red">
              <FileText size={16} aria-hidden="true" />
            </div>
          </div>
          <div className="owner-stat-value text-red">Rp3.337.500</div>
          <div className="owner-stat-bottom">
            <span className="owner-stat-pill pill-amber">
              <AlertTriangle size={12} aria-hidden="true" /> 2 tagihan
            </span>
            <span className="owner-stat-hint">belum lunas</span>
          </div>
        </div>

        {/* Card 3: Hunian */}
        <div className="owner-stat-card">
          <div className="owner-stat-top">
            <span className="owner-stat-label">Tingkat Hunian</span>
            <div className="owner-stat-icon-wrap icon-teal">
              <Bed size={16} aria-hidden="true" />
            </div>
          </div>
          <div className="owner-stat-hunian-row">
            <span className="owner-stat-value">86%</span>
            <span className="owner-stat-hunian-sub">19/22 Terisi</span>
          </div>
          <div className="owner-progress-bar">
            <div className="owner-progress-fill" style={{ width: '86%' }} />
          </div>
          <div className="owner-stat-hint mt-4">3 kamar kosong siap disewa</div>
        </div>

        {/* Card 4: Penyewa Menunggak */}
        <div className="owner-stat-card">
          <div className="owner-stat-top">
            <span className="owner-stat-label">Penyewa Menunggak</span>
            <div className="owner-stat-icon-wrap icon-amber">
              <Bell size={16} aria-hidden="true" />
            </div>
          </div>
          <div className="owner-stat-value">2 Orang</div>
          <div className="owner-stat-bottom">
            <span className="owner-stat-pill pill-gray">Kamar 102 &amp; 204</span>
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Content */}
      <div className="owner-main-grid">
        {/* Kolom Kiri: Perlu Tindakan */}
        <section className="owner-card">
          <div className="owner-action-header">
            <div className="owner-action-title-wrap">
              <h2 className="owner-card-title">Perlu Tindakan</h2>
              <span className="owner-badge-count">5</span>
            </div>
            <p className="owner-card-sub">
              Daftar hal mendesak yang memerlukan konfirmasi Anda hari ini
            </p>
          </div>

          <div className="owner-action-list">
            {/* Item 1: Booking */}
            <div className="owner-action-item">
              <div className="owner-action-icon-wrap icon-teal">
                <UserPlus size={16} aria-hidden="true" />
              </div>
              <div className="owner-action-meta">
                <div className="owner-action-item-title">2 booking menunggu persetujuan</div>
                <div className="owner-action-item-sub">Calon penyewa baru di Kamar 204 &amp; 305</div>
              </div>
              <Link href="/pemilik/booking" className="owner-action-btn btn-secondary">
                Tinjau
              </Link>
            </div>

            {/* Item 2: Pembayaran */}
            <div className="owner-action-item">
              <div className="owner-action-icon-wrap icon-teal">
                <Receipt size={16} aria-hidden="true" />
              </div>
              <div className="owner-action-meta">
                <div className="owner-action-item-title">2 pembayaran menunggu verifikasi</div>
                <div className="owner-action-item-sub">Transfer bank via BCA &amp; Mandiri</div>
              </div>
              <Link href="/pemilik/pembayaran" className="owner-action-btn btn-primary">
                Verifikasi
              </Link>
            </div>

            {/* Item 3: Penundaan */}
            <div className="owner-action-item">
              <div className="owner-action-icon-wrap icon-amber">
                <Hourglass size={16} aria-hidden="true" />
              </div>
              <div className="owner-action-meta">
                <div className="owner-action-item-title">1 pengajuan penundaan</div>
                <div className="owner-action-item-sub">Kamar 204 (Budi Santoso) - jatuh tempo 5 Nov</div>
              </div>
              <Link href="/pemilik/pembayaran" className="owner-action-btn btn-secondary">
                Lihat
              </Link>
            </div>

            {/* Item 4: Meteran */}
            <div className="owner-action-item">
              <div className="owner-action-icon-wrap icon-gray">
                <Zap size={16} aria-hidden="true" />
              </div>
              <div className="owner-action-meta">
                <div className="owner-action-item-title">3 meteran bulan ini belum diisi</div>
                <div className="owner-action-item-sub">Meteran listrik kamar 101, 102, 204</div>
              </div>
              <Link href="/pemilik/tagihan" className="owner-action-btn btn-secondary">
                Isi Meteran
              </Link>
            </div>

            {/* Item 5: Keluhan */}
            <div className="owner-action-item">
              <div className="owner-action-icon-wrap icon-red">
                <Wrench size={16} aria-hidden="true" />
              </div>
              <div className="owner-action-meta">
                <div className="owner-action-item-title">1 keluhan berstatus Dilaporkan</div>
                <div className="owner-action-item-sub">Kamar 204: AC meneteskan air sejak semalam</div>
              </div>
              <Link href="/pemilik/keluhan" className="owner-action-btn btn-amber">
                Tanggapi
              </Link>
            </div>
          </div>

          <div className="owner-action-footer">
            <span className="owner-action-footer-text">Semua notifikasi terintegrasi real-time</span>
            <Link href="/pemilik/pembayaran" className="owner-action-footer-link">
              <span>Buka Log Aktivitas</span>
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Kolom Kanan: Chart Pendapatan & Tabel Menunggak */}
        <div className="owner-right-stack">
          {/* Card 1: Pendapatan 6 Bulan Terakhir */}
          <section className="owner-card">
            <div className="owner-chart-header">
              <div>
                <h2 className="owner-card-title">Pendapatan 6 Bulan Terakhir</h2>
                <p className="owner-card-sub">Periode Mei 2026 - Oktober 2026</p>
              </div>
              <div className="owner-chart-avg-pill">
                <span className="owner-chart-avg-label">Rata-rata:</span>
                <span className="owner-chart-avg-val">Rp26.583.333/bln</span>
              </div>
            </div>

            {/* Chart Bars */}
            <div className="owner-chart-wrap" role="img" aria-label="Grafik pendapatan 6 bulan">
              <div className="owner-chart-grid-lines" aria-hidden="true">
                <div className="chart-line" />
                <div className="chart-line" />
                <div className="chart-line" />
              </div>

              <div className="owner-chart-bars">
                {dataChart.map((item) => (
                  <div className="owner-chart-col" key={item.bulan}>
                    <span className={`owner-bar-val ${item.aktif ? 'val-active' : ''}`}>
                      {item.nilai}
                    </span>
                    <div className="owner-bar-track">
                      <div
                        className={`owner-bar-fill ${item.aktif ? 'bar-active' : 'bar-idle'}`}
                        style={{ height: `${item.tinggi}%` }}
                      />
                    </div>
                    <span className={`owner-bar-label ${item.aktif ? 'label-active' : ''}`}>
                      {item.bulan}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="owner-chart-footer">
              <div className="owner-chart-status">
                <span className="owner-dot-active" aria-hidden="true" />
                <span>Bulan berjalan (Target tercapai 102%)</span>
              </div>
              <span className="owner-chart-cutoff">Estimasi tutup buku: 31 Okt</span>
            </div>
          </section>

          {/* Card 2: Penyewa Menunggak */}
          <section className="owner-card">
            <div className="owner-chart-header">
              <div>
                <h2 className="owner-card-title">Penyewa Menunggak</h2>
                <p className="owner-card-sub">Perlu konfirmasi pembayaran atau verifikasi komitmen</p>
              </div>
              <span className="owner-overdue-badge">2 Kasus Perlu Tindak Lanjut</span>
            </div>

            <div className="owner-table-wrap">
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Nama Penyewa</th>
                    <th>Kamar</th>
                    <th>Periode</th>
                    <th>Sisa Tagihan</th>
                  </tr>
                </thead>
                <tbody>
                  {daftarMenunggak.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="owner-user-cell">
                          <div
                            className="owner-user-avatar"
                            style={{ background: p.avatarBg, color: p.avatarColor }}
                          >
                            {p.inisial}
                          </div>
                          <div>
                            <div className="owner-user-name">{p.nama}</div>
                            <div className="owner-user-email">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="owner-room-name">{p.kamar}</span>{' '}
                        <span className="owner-room-sub">{p.lantai}</span>
                      </td>
                      <td>{p.periode}</td>
                      <td className="owner-amount-cell">{rupiah(p.sisaTagihan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="owner-overdue-footer">
              <span className="owner-overdue-footer-text">
                Peringatan otomatis via WhatsApp telah dikirimkan ke 2 penyewa ini pada 5 Oktober 2026.
              </span>
              <button
                type="button"
                className="owner-overdue-resend-btn"
                onClick={kirimUlangNotifikasi}
              >
                <span>{notifSent ? 'Terkirim ✓' : 'Kirim Ulang Notifikasi'}</span>
                <Send size={13} aria-hidden="true" />
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* 4. Bottom Banner: Tips Manajemen */}
      <section className="owner-tips-card">
        <div className="owner-tips-left">
          <div className="owner-tips-icon">
            <Lightbulb size={18} aria-hidden="true" />
          </div>
          <div className="owner-tips-text">
            <strong>Tips Manajemen:</strong> Kos Melati Putri memiliki 3 kamar kosong. Aktifkan diskon sewa
            bulan pertama untuk meningkatkan okupansi hingga 100%.
          </div>
        </div>
        <Link href="/pemilik/kos" className="owner-tips-link">
          <span>Pasang Promo Kamar</span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
