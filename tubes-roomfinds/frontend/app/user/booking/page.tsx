'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Ban, Calendar, Check, Clock, FileText, Info, MapPin, ShieldCheck } from 'lucide-react';
import { get, patch } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { fotoKamarBerdasarkanNomor } from '@/lib/gambar';
import { bacaBookingDemo, batalkanBookingDemo } from '@/app/user/demo';
import type { ApiBooking } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const formatBulanFigma: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'Mei', '06': 'Jun',
  '07': 'Jul', '08': 'Agu', '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des'
};

function formatTanggalFigma(isoDate?: string | null) {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length < 3) return isoDate;
  const year = parts[0];
  const month = formatBulanFigma[parts[1]] ?? parts[1];
  const day = parts[2].slice(0, 2);
  return `${day} ${month} ${year}`;
}

const formatTanggalBukti = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatJamBukti = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const waktuPersetujuan = (value: string) => `${formatTanggalBukti.format(new Date(value))}, ${formatJamBukti.format(new Date(value)).replace(':', '.')}`;

export default function BookingSaya() {
  const [list, setList] = useState<ApiBooking[]>([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const muat = () => {
    if (useMock) {
      try {
        setList(bacaBookingDemo());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Booking demo belum berhasil dimuat.');
      } finally {
        setLoaded(true);
      }
      return;
    }
    get<ApiBooking[]>('/api/booking/saya')
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Booking belum berhasil dimuat.'))
      .finally(() => setLoaded(true));
  };

  useEffect(muat, []);

  async function batalkan(id: number) {
    if (!window.confirm('Batalkan booking ini?')) return;
    setBusyId(id);
    setError('');
    try {
      if (useMock) {
        setList(batalkanBookingDemo(id));
      } else {
        await patch(`/api/booking/${id}/batal`);
        muat();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pembatalan belum berhasil.');
    } finally {
      setBusyId(null);
    }
  }

  const filteredList = filterStatus === 'ALL'
    ? list
    : list.filter((b) => b.status === filterStatus);

  return (
    <div className="booking-page-container">
      {/* Category tag */}
      <div className="booking-page-badge">
        <span className="booking-badge-square" aria-hidden="true"></span>
        <span>MANAJEMEN SEWA</span>
      </div>

      {/* Header title & Filter */}
      <div className="booking-page-header">
        <div>
          <h1 className="booking-page-title">Booking Saya</h1>
          <p className="booking-page-sub">Kelola dan pantau status pengajuan sewa kos Anda</p>
        </div>
        <div className="booking-filter-wrap">
          <label htmlFor="filterStatus" className="booking-filter-label">Filter Status:</label>
          <select
            id="filterStatus"
            className="booking-filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Semua Status ({list.length})</option>
            <option value="MENUNGGU">Menunggu Konfirmasi</option>
            <option value="DISETUJUI">Disetujui</option>
            <option value="DITOLAK">Ditolak</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </div>
      </div>

      {error && <div className="form-alert mb-16" role="alert">{error}</div>}

      {/* Booking cards list */}
      <div className="figma-booking-list">
        {filteredList.map((b) => (
          <article className="figma-booking-card" key={b.id}>
            {/* Left: Building photo */}
            <div className="figma-booking-img-wrap">
              <img
                src={b.foto || fotoKamarBerdasarkanNomor(b.kamarNomor, b.tipe, b.totalSewa)}
                alt={b.kosNama}
                className={`figma-booking-img${b.status === 'SELESAI' ? ' grayscale' : ''}`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/kamar/eksterior-kos.svg';
                }}
              />
            </div>

            {/* Right: Content details */}
            <div className="figma-booking-content">
              <div className="figma-booking-top">
                <div className="figma-status-badge">
                  {b.status === 'MENUNGGU' && (
                    <span className="badge-pill badge-menunggu">
                      <Clock size={12} aria-hidden="true" /> Menunggu Konfirmasi
                    </span>
                  )}
                  {b.status === 'DISETUJUI' && (
                    <span className="badge-pill badge-disetujui">
                      <Check size={12} aria-hidden="true" /> Disetujui
                    </span>
                  )}
                  {b.status === 'DITOLAK' && (
                    <span className="badge-pill badge-ditolak">
                      <Ban size={12} aria-hidden="true" /> Ditolak
                    </span>
                  )}
                  {b.status === 'SELESAI' && (
                    <span className="badge-pill badge-selesai">
                      <Check size={12} aria-hidden="true" /> Selesai
                    </span>
                  )}
                  {b.status === 'DIBATALKAN' && (
                    <span className="badge-pill badge-ditolak">
                      <Ban size={12} aria-hidden="true" /> Dibatalkan
                    </span>
                  )}
                </div>
                <span className="figma-booking-id">ID: {b.bookingCode || `BK-2024-${String(b.id).padStart(4, '0')}`}</span>
              </div>

              <h3 className="figma-booking-kos">
                {b.kosNama} - Kamar {b.kamarNomor}{b.tipe === 'EKSKLUSIF' ? ' Eksklusif' : ''}
              </h3>
              <div className="figma-booking-location">
                <MapPin size={13} aria-hidden="true" /> {b.lokasi || 'Setiabudi, Jakarta Selatan'}
              </div>

              {/* 3-Column Info Box */}
              <div className="figma-booking-infobox">
                <div className="infobox-col">
                  <span className="infobox-label">Paket Sewa</span>
                  <span className="infobox-value">{b.paketNama}</span>
                </div>
                <div className="infobox-col">
                  {b.status === 'SELESAI' && b.statusKontrak ? (
                    <>
                      <span className="infobox-label">Status Kontrak</span>
                      <span className="infobox-value text-green">{b.statusKontrak}</span>
                    </>
                  ) : (
                    <>
                      <span className="infobox-label">Tanggal Masuk</span>
                      <span className="infobox-value">{formatTanggalFigma(b.tanggalMasuk)}</span>
                    </>
                  )}
                </div>
                <div className="infobox-col">
                  <span className="infobox-label">Total Biaya</span>
                  <span className="infobox-value text-teal-bold">{rupiah(b.totalSewa)}</span>
                </div>
              </div>

              {/* Extra details for Approved status */}
              {b.status === 'DISETUJUI' && (
                <div className="figma-booking-extra">
                  <div className="extra-item">
                    <Calendar size={13} aria-hidden="true" /> Check-out: {b.checkOut || formatTanggalFigma(b.tanggalSelesai)}
                  </div>
                  {b.waktuSetujuAturan && (
                    <div className="extra-item">
                      <ShieldCheck size={13} aria-hidden="true" /> Aturan kos disetujui pada {waktuPersetujuan(b.waktuSetujuAturan)}
                    </div>
                  )}
                </div>
              )}

              {/* Rejection note */}
              {b.status === 'DITOLAK' && (
                <div className="figma-booking-rejection">
                  <Info size={14} className="rejection-icon" aria-hidden="true" />
                  <span><strong>Catatan Pemilik Kos:</strong> {b.alasanTolak || 'Maaf, kamar tersebut sudah dipesan oleh calon penyewa lain pada tanggal yang sama.'}</span>
                </div>
              )}

              {/* Bottom right action button */}
              <div className="figma-booking-action">
                {b.status === 'MENUNGGU' && (
                  <button
                    type="button"
                    className="btn-figma-cancel"
                    disabled={busyId === b.id}
                    onClick={() => batalkan(b.id)}
                  >
                    <Ban size={13} aria-hidden="true" /> {busyId === b.id ? 'Membatalkan…' : 'Batalkan Booking'}
                  </button>
                )}
                {b.status === 'DISETUJUI' && (
                  <Link href="/user/tagihan" className="btn-figma-primary">
                    <FileText size={14} aria-hidden="true" /> Lihat Tagihan
                  </Link>
                )}
                {b.status === 'DITOLAK' && (
                  <Link href="/" className="btn-figma-secondary">
                    Cari Kamar Lain
                  </Link>
                )}
                {b.status === 'SELESAI' && (
                  <Link href="/" className="btn-figma-muted">
                    Pesan Kembali
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {loaded && !error && filteredList.length === 0 && (
        <div className="card card-pad" style={{ textAlign: 'center', padding: '40px 20px', marginTop: 20 }}>
          <p className="muted">Tidak ada data booking dengan status ini.</p>
        </div>
      )}
    </div>
  );
}
