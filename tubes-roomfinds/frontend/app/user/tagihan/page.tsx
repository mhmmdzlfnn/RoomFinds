'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, Clock, CreditCard, FileText, Hourglass, Info } from 'lucide-react';
import { get } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { pembayaranContoh, riwayatTagihan, tagihanAktif } from '@/lib/mock';
import type { ApiBill, ApiPayment, BillLike } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export default function DetailTagihanKamar() {
  const [bills, setBills] = useState<BillLike[]>(useMock ? riwayatTagihan : []);
  const [pays, setPays] = useState<ApiPayment[]>(useMock ? pembayaranContoh : []);
  const [loaded, setLoaded] = useState(useMock);
  const [error, setError] = useState('');

  useEffect(() => {
    if (useMock) return;
    get<ApiBill[]>('/api/tagihan/saya')
      .then(setBills)
      .catch((e) => setError(e instanceof Error ? e.message : 'Tagihan belum berhasil dimuat.'))
      .finally(() => setLoaded(true));
    get<ApiPayment[]>('/api/pembayaran/riwayat')
      .then(setPays)
      .catch(() => {});
  }, []);

  const aktif = bills.find((b) => b.status !== 'LUNAS') ?? bills[0] ?? tagihanAktif;
  const tagihanId = aktif?.id || 1;
  const invoiceNo = 'INV-2026-10-204';
  const invoiceCode = 'INV/202610/0204';

  return (
    <div className="tagihan-page-container">
      {/* Breadcrumb & Top Bar */}
      <div className="tagihan-breadcrumb">
        <span>TAGIHAN SAYA</span>
        <span>/</span>
        <span className="tagihan-breadcrumb-active">{invoiceNo}</span>
      </div>

      <div className="tagihan-header-row">
        <h1 className="tagihan-title">Detail Tagihan Kamar</h1>
        <div className="tagihan-period-pill">
          <Calendar size={13} aria-hidden="true" />
          <span>Periode: Oktober 2026</span>
        </div>
      </div>

      {error && <div className="form-alert mb-16" role="alert">{error}</div>}

      {/* Main 2-Column Grid */}
      <div className="tagihan-layout">
        {/* Left Column (Cards) */}
        <div className="tagihan-left-col">
          {/* Card 1: Jatuh Tempo & Total */}
          <section className="tagihan-card mb-20">
            <div className="tagihan-tempo-top">
              <div>
                <span className="tagihan-tempo-title">JATUH TEMPO</span>
                <div className="tagihan-tempo-date">
                  <Calendar size={16} aria-hidden="true" />
                  <span>5 November 2026</span>
                </div>
                <div className="tagihan-tempo-warn">
                  <Clock size={12} aria-hidden="true" />
                  <span>Jatuh tempo 3 hari lagi</span>
                </div>
              </div>

              <div className="badge-pill badge-menunggu" style={{ padding: '6px 12px' }}>
                <AlertTriangle size={13} aria-hidden="true" />
                <span>Belum Bayar</span>
              </div>
            </div>

            <div className="tagihan-total-bottom">
              <div>
                <span className="tagihan-total-lbl">TOTAL TAGIHAN</span>
                <div className="tagihan-total-amt">Rp1.668.750</div>
              </div>
              <div className="tagihan-total-sub">
                Sisa tagihan yang harus dibayar: <strong>Rp1.668.750</strong>
              </div>
            </div>
          </section>

          {/* Card 2: Rincian Tagihan */}
          <section className="tagihan-card">
            <div className="tagihan-rincian-header">
              <div className="tagihan-rincian-title-wrap">
                <div className="tagihan-rincian-icon">
                  <FileText size={17} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="tagihan-rincian-title">Rincian Tagihan</h2>
                  <div className="tagihan-rincian-sub">Kamar 204 • Lantai 2 • Tipe Deluxe</div>
                </div>
              </div>
              <span className="tagihan-rincian-inv">{invoiceCode}</span>
            </div>

            <div className="tagihan-items-list">
              <div className="tagihan-item-row">
                <div>
                  <div className="tagihan-item-title">Biaya Sewa Kamar 204</div>
                  <div className="tagihan-item-desc">Periode 1 Okt 2026 - 31 Okt 2026</div>
                </div>
                <span className="tagihan-item-price">Rp1.500.000</span>
              </div>

              <div className="tagihan-item-row">
                <div>
                  <div className="tagihan-item-title">Biaya Tetap WiFi</div>
                  <div className="tagihan-item-desc">Koneksi Unlimited 100Mbps</div>
                </div>
                <span className="tagihan-item-price">Rp50.000</span>
              </div>

              <div className="tagihan-item-row">
                <div>
                  <div className="tagihan-item-title">Biaya Tetap Kebersihan</div>
                  <div className="tagihan-item-desc">Area Bersama &amp; Kamar</div>
                </div>
                <span className="tagihan-item-price">Rp25.000</span>
              </div>

              <div className="tagihan-item-row tagihan-item-highlight">
                <div>
                  <div className="tagihan-item-title">Biaya Pemakaian Listrik</div>
                  <div className="tagihan-item-desc">
                    Meteran 1.240,0 ke 1.302,5 kwh = 62,5 kwh × Rp1.500
                  </div>
                </div>
                <span className="tagihan-item-price">Rp93.750</span>
              </div>
            </div>

            <div className="tagihan-divider-dotted" aria-hidden="true"></div>

            <div className="tagihan-grand-total">
              <span className="tagihan-grand-lbl">Total Tagihan</span>
              <span className="tagihan-grand-amt">Rp1.668.750</span>
            </div>
          </section>
        </div>

        {/* Right Column (Actions & Support) */}
        <div className="tagihan-right-col">
          {/* Card: Tindakan Pembayaran */}
          <section className="tagihan-card">
            <h2 className="tagihan-side-title">Tindakan Pembayaran</h2>
            <Link href={`/user/tagihan/${tagihanId}/bayar`} className="btn-tagihan-bayar">
              <CreditCard size={16} aria-hidden="true" />
              <span>Bayar Sekarang</span>
            </Link>

            <Link href={`/user/tagihan/${tagihanId}/penundaan`} className="btn-tagihan-delay">
              <Hourglass size={15} aria-hidden="true" />
              <span>Ajukan Penundaan</span>
            </Link>

            <div className="tagihan-notice-box">
              <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
              <span>Masih dalam masa tenggang, belum ada denda keterlambatan yang dikenakan.</span>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Wide Card: Riwayat Pembayaran */}
      <section className="tagihan-history-card">
        <div className="tagihan-history-top">
          <div>
            <h2 className="tagihan-history-title">Riwayat Pembayaran &amp; Cicilan</h2>
            <p className="tagihan-history-sub">Catatan transaksi untuk tagihan periode ini</p>
          </div>
          <span className="tagihan-history-count">0 dari 1 Pembayaran Selesai</span>
        </div>

        <div className="table-wrap">
          <table className="tagihan-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Metode Pembayaran</th>
                <th>Jumlah</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>-</td>
                <td>Belum ada transaksi</td>
                <td style={{ fontWeight: 700 }}>Rp0</td>
                <td>
                  <span className="badge-pill badge-selesai">
                    Menunggu Pembayaran
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
