'use client';
import { useEffect, useRef, useState } from 'react';
import { Building2, Camera, Check, CheckCircle2, FileEdit, Send, Trash2 } from 'lucide-react';
import { del, get, post } from '@/lib/api';
import { tagihanAktif } from '@/lib/mock';
import type { ApiBooking, ApiComplaint } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const KATEGORI = ['Fasilitas', 'Listrik', 'Air', 'Internet', 'Kebersihan', 'Lainnya'];

interface KeluhanItem extends ApiComplaint {
  kode?: string;
  penyelesaian?: string;
}

const mockDefault: KeluhanItem[] = [
  {
    id: 1,
    kode: '#KLS-8921',
    kategori: 'FASILITAS',
    deskripsi: 'AC kamar meneteskan air sejak kemarin malam',
    status: 'DIPROSES',
    tanggapanPemilik: 'Teknisi akan datang besok pukul 10.00, mohon kamarnya bisa diakses',
    dibuatPada: '2023-10-12',
    diperbaruiPada: '2023-10-12',
    kamarNomor: '204',
  },
  {
    id: 2,
    kode: '#KLS-8945',
    kategori: 'INTERNET',
    deskripsi: 'WiFi lantai 2 putus-putus',
    status: 'DILAPORKAN',
    dibuatPada: '2023-10-14',
    diperbaruiPada: '2023-10-14',
    kamarNomor: '204',
  },
  {
    id: 3,
    kode: '#KLS-8812',
    kategori: 'LISTRIK',
    deskripsi: 'Lampu kamar mandi luar mati',
    status: 'SELESAI',
    penyelesaian: 'Laporan telah diselesaikan pada 09 Oktober 2023. Bola lampu telah diganti baru.',
    dibuatPada: '2023-10-08',
    diperbaruiPada: '2023-10-09',
    kamarNomor: '204',
  },
];

const formatTgl = (iso: string) => {
  try {
    const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
    const bulan = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
};

export default function KeluhanSaya() {
  const [list, setList] = useState<KeluhanItem[]>(useMock ? mockDefault : []);
  const [loaded, setLoaded] = useState(useMock);
  const [kategori, setKategori] = useState('Fasilitas');
  const [deskripsi, setDeskripsi] = useState('');
  const [kamar, setKamar] = useState('Kamar 204 - Kos Melati');
  const [kamarError, setKamarError] = useState('');
  const [foto, setFoto] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [hapusId, setHapusId] = useState<number | null>(null);

  const muat = () => {
    if (useMock) return;
    get<ApiComplaint[]>('/api/keluhan')
      .then((res) => {
        const mapped: KeluhanItem[] = res.map((k, idx) => ({
          ...k,
          kode: `#KLS-${String(8900 + idx)}`,
        }));
        setList(mapped);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Keluhan belum berhasil dimuat.'))
      .finally(() => setLoaded(true));
  };

  useEffect(() => {
    muat();
    if (useMock) return;
    get<ApiBooking[]>('/api/booking/saya')
      .then((items) => {
        const aktif = items.find((b) => b.status === 'DISETUJUI');
        if (aktif) {
          setKamar(`Kamar ${aktif.kamarNomor} - ${aktif.kosNama}`);
        } else {
          setKamarError('Belum ada kamar aktif.');
        }
      })
      .catch(() => setKamarError('Kamar aktif belum berhasil dimuat.'));
  }, []);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!deskripsi.trim() || busy) return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      if (!useMock) {
        await post('/api/keluhan', { kategori: kategori.toUpperCase(), deskripsi });
        muat();
      } else {
        const newItem: KeluhanItem = {
          id: Date.now(),
          kode: `#KLS-${Math.floor(8900 + Math.random() * 99)}`,
          kategori: kategori.toUpperCase(),
          deskripsi,
          status: 'DILAPORKAN',
          dibuatPada: new Date().toISOString().slice(0, 10),
          diperbaruiPada: new Date().toISOString().slice(0, 10),
          kamarNomor: '204',
        };
        setList((items) => [newItem, ...items]);
      }
      setOk('Laporan kendala Anda berhasil dikirim.');
      setDeskripsi('');
      setFoto(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laporan belum terkirim.');
    } finally {
      setBusy(false);
    }
  }

  async function hapus(id: number) {
    if (hapusId !== null) return;
    if (!window.confirm('Hapus laporan keluhan ini?')) return;
    setError('');
    setOk('');
    setHapusId(id);
    try {
      if (!useMock) await del(`/api/keluhan/${id}`);
      setList((items) => items.filter((q) => q.id !== id));
      setOk('Laporan keluhan berhasil dihapus.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Keluhan tidak dapat dihapus.');
    } finally {
      setHapusId(null);
    }
  }

  return (
    <div className="keluhan-page-container">
      {/* Category header */}
      <div className="keluhan-category-tag">PUSAT BANTUAN &amp; LAYANAN</div>

      {/* Main Title & Response time pill */}
      <div className="keluhan-header-row">
        <h1 className="keluhan-title">Keluhan &amp; Laporan</h1>
        <div className="keluhan-response-pill">
          <img src="/figma/shell/respon.svg" width="20" height="18" alt="" />
          <span>
            Respon Rata-rata: <strong>2 Jam</strong>
          </span>
        </div>
      </div>

      {ok && <div className="success-inline mb-16" role="status">✓ {ok}</div>}
      {error && <div className="form-alert mb-16" role="alert">{error}</div>}

      {/* 2-Column Grid */}
      <div className="keluhan-layout">
        {/* Kolom Kiri: Form Buat Laporan */}
        <div className="keluhan-left-col">
          <section className="keluhan-card">
            <div className="keluhan-form-header">
              <div className="keluhan-form-icon">
                <FileEdit size={18} aria-hidden="true" />
              </div>
              <div>
                <h2 className="keluhan-form-title">Buat Laporan Keluhan</h2>
                <p className="keluhan-form-sub">Laporkan kendala fasilitas kamar Anda</p>
              </div>
            </div>

            <form onSubmit={kirim}>
              {/* Field: Informasi Kamar */}
              <div className="keluhan-field">
                <label className="keluhan-label">Informasi Kamar</label>
                <div className="keluhan-room-box">
                  <Building2 size={16} aria-hidden="true" />
                  <span>{kamar || (kamarError ? 'Kamar belum tersedia' : 'Memuat kamar…')}</span>
                </div>
              </div>

              {/* Field: Kategori Kendala */}
              <div className="keluhan-field">
                <label htmlFor="kategori-select" className="keluhan-label">
                  Kategori Kendala
                </label>
                <select
                  id="kategori-select"
                  className="keluhan-select"
                  value={kategori}
                  disabled={busy}
                  onChange={(e) => setKategori(e.target.value)}
                >
                  {KATEGORI.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field: Deskripsi Masalah */}
              <div className="keluhan-field">
                <label htmlFor="deskripsi-input" className="keluhan-label">
                  Deskripsi Masalah
                </label>
                <textarea
                  id="deskripsi-input"
                  className="keluhan-textarea"
                  rows={4}
                  required
                  value={deskripsi}
                  disabled={busy}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Ceritakan masalahnya di sini..."
                />
              </div>

              {/* Field: Lampiran Foto */}
              <div className="keluhan-field">
                <label className="keluhan-label">Lampiran Foto (Opsional)</label>
                <div
                  className="keluhan-upload-box"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <Camera size={22} className="keluhan-upload-icon" aria-hidden="true" />
                  <span className="keluhan-upload-text">
                    {foto ? foto.name : 'Klik untuk unggah foto kendala'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="keluhan-submit-btn"
                disabled={busy || !deskripsi.trim()}
              >
                <Send size={15} aria-hidden="true" />
                <span>{busy ? 'Mengirim…' : 'Kirim Laporan'}</span>
              </button>
            </form>
          </section>
        </div>

        {/* Kolom Kanan: Riwayat Keluhan */}
        <div className="keluhan-right-col">
          <div className="keluhan-history-head">
            <h2 className="keluhan-history-title">Riwayat Keluhan Saya</h2>
            <span className="keluhan-history-total">Total: {list.length} Laporan</span>
          </div>

          <div className="keluhan-list">
            {list.map((item) => {
              const kat = item.kategori.toLowerCase();
              let badgeClass = 'badge-fasilitas';
              if (kat === 'internet') badgeClass = 'badge-internet';
              else if (kat === 'listrik') badgeClass = 'badge-listrik';
              else if (kat === 'air') badgeClass = 'badge-air';

              const isDilaporkan = item.status === 'DILAPORKAN';
              const isDiproses = item.status === 'DIPROSES';
              const isSelesai = item.status === 'SELESAI';

              return (
                <article className="keluhan-card keluhan-item-card" key={item.id}>
                  {/* Top Bar: Category badge, Date, and Code */}
                  <div className="keluhan-item-top">
                    <div className="keluhan-item-badge-wrap">
                      <span className={`keluhan-badge ${badgeClass}`}>
                        {item.kategori.charAt(0).toUpperCase() + item.kategori.slice(1).toLowerCase()}
                      </span>
                      <span className="keluhan-item-date">{formatTgl(item.dibuatPada)}</span>
                    </div>
                    <span className="keluhan-item-code">{item.kode || `#KLS-${item.id}`}</span>
                  </div>

                  {/* Description Title */}
                  <h3 className="keluhan-item-desc">{item.deskripsi}</h3>

                  {/* Stepper Progress Bar */}
                  <div className="keluhan-stepper">
                    <div className="keluhan-stepper-line" aria-hidden="true">
                      <div
                        className="keluhan-stepper-progress"
                        style={{
                          width: isSelesai ? '100%' : isDiproses ? '50%' : '0%',
                        }}
                      />
                    </div>

                    {/* Step 1: Dilaporkan */}
                    <div className="keluhan-step">
                      <div
                        className={`keluhan-step-circle ${
                          isDiproses || isSelesai
                            ? 'step-circle-done'
                            : 'step-circle-active'
                        }`}
                      >
                        {isDiproses || isSelesai ? <Check size={13} /> : '1'}
                      </div>
                      <span
                        className={`keluhan-step-label ${
                          isDilaporkan ? 'step-label-active' : ''
                        }`}
                      >
                        Dilaporkan
                      </span>
                    </div>

                    {/* Step 2: Diproses */}
                    <div className="keluhan-step">
                      <div
                        className={`keluhan-step-circle ${
                          isSelesai
                            ? 'step-circle-done'
                            : isDiproses
                            ? 'step-circle-active'
                            : 'step-circle-idle'
                        }`}
                      >
                        {isSelesai ? <Check size={13} /> : '2'}
                      </div>
                      <span
                        className={`keluhan-step-label ${
                          isDiproses ? 'step-label-active' : ''
                        }`}
                      >
                        Diproses
                      </span>
                    </div>

                    {/* Step 3: Selesai */}
                    <div className="keluhan-step">
                      <div
                        className={`keluhan-step-circle ${
                          isSelesai ? 'step-circle-done' : 'step-circle-idle'
                        }`}
                      >
                        {isSelesai ? <Check size={13} /> : '3'}
                      </div>
                      <span
                        className={`keluhan-step-label ${
                          isSelesai ? 'step-label-active' : ''
                        }`}
                      >
                        Selesai
                      </span>
                    </div>
                  </div>

                  {/* Tanggapan Pemilik Kos (Jika ada / status Diproses) */}
                  {item.tanggapanPemilik && (
                    <div className="keluhan-response-box">
                      <span className="keluhan-quote-mark" aria-hidden="true">&ldquo;</span>
                      <div>
                        <div className="keluhan-response-title">Tanggapan Pemilik Kos</div>
                        <p className="keluhan-response-text">
                          &ldquo;{item.tanggapanPemilik}&rdquo;
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pesan Selesai (Jika status Selesai) */}
                  {isSelesai && (
                    <div className="keluhan-completed-box">
                      <CheckCircle2 size={16} className="keluhan-completed-icon" aria-hidden="true" />
                      <span>
                        {item.penyelesaian ||
                          `Laporan telah diselesaikan pada ${formatTgl(
                            item.diperbaruiPada
                          )}. Kendala telah ditangani.`}
                      </span>
                    </div>
                  )}

                  {/* Tombol Hapus (Jika status masih Dilaporkan) */}
                  {isDilaporkan && (
                    <div className="keluhan-item-footer">
                      <button
                        type="button"
                        className="keluhan-delete-btn"
                        disabled={hapusId === item.id}
                        onClick={() => hapus(item.id)}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        <span>{hapusId === item.id ? 'Menghapus…' : 'Hapus'}</span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })}

            {loaded && list.length === 0 && (
              <div className="keluhan-card center muted" style={{ padding: '40px 20px' }}>
                Belum ada keluhan yang dilaporkan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
