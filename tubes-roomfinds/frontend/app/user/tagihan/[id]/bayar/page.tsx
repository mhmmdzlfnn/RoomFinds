'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Banknote, Camera, CloudUpload, Copy, FileText, Landmark } from 'lucide-react';
import { get, upload } from '@/lib/api';
import { rupiah, periodeLabel } from '@/lib/format';
import { tanggalLengkap } from '@/app/user/format';
import { kosContoh, pembayaranContoh, riwayatTagihan, tagihanAktif } from '@/lib/mock';
import type { ApiBill, ApiPayment, BillLike } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const contohRiwayat: ApiPayment[] = [
  { id: -1, tagihanId: tagihanAktif.id, metode: 'TRANSFER', jumlah: 500000, tanggal: '2026-10-28', status: 'MENUNGGU_VERIFIKASI', bankAsal: 'BCA', namaPengirim: tagihanAktif.penyewaNama, catatanVerifikasi: 'Bukti transfer terlampir.' },
  { id: -2, tagihanId: tagihanAktif.id, metode: 'TRANSFER', jumlah: 1500000, tanggal: '2026-10-01', status: 'DITERIMA', bankAsal: 'BCA', namaPengirim: tagihanAktif.penyewaNama, catatanVerifikasi: 'Diverifikasi oleh Pemilik Kos.' },
  { id: -3, tagihanId: tagihanAktif.id, metode: 'TUNAI', jumlah: 1500000, tanggal: '2026-09-15', status: 'DITOLAK', bankAsal: '', namaPengirim: tagihanAktif.penyewaNama, catatanVerifikasi: 'Bukti transfer tidak jelas / nominal tidak sesuai.' },
];

const tanggalPendek = (iso: string) => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
};

export default function Pembayaran() {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<BillLike | null>(null);
  const [riwayat, setRiwayat] = useState<ApiPayment[]>([]);
  const [metode, setMetode] = useState<'TRANSFER' | 'TUNAI'>('TRANSFER');
  const [jumlah, setJumlah] = useState('');
  const [bankAsal, setBankAsal] = useState('');
  const [namaPengirim, setNamaPengirim] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [drag, setDrag] = useState(false);
  const inputFile = useRef<HTMLInputElement>(null);
  const [tersalin, setTersalin] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false); setSent(false); setError(''); setHistoryError(''); setFile(null);
    if (useMock) {
      const b = riwayatTagihan.find(x => String(x.id) === id) ?? (String(tagihanAktif.id) === id ? tagihanAktif : null);
      setBill(b);
      setJumlah(b ? `Rp ${Number(b.sisa).toLocaleString('id-ID')}` : '');
      setRiwayat(b ? riwayatDemoUntukTagihan(b.id) : []);
      setLoaded(true);
      return;
    }
    get<ApiBill[]>('/api/tagihan/saya').then(list => { const b = list.find(x => String(x.id) === id) ?? null; setBill(b); setJumlah(b ? `Rp ${Number(b.sisa).toLocaleString('id-ID')}` : ''); }).catch(e => setError(e instanceof Error ? e.message : 'Tagihan belum berhasil dimuat.')).finally(() => setLoaded(true));
    get<ApiPayment[]>('/api/pembayaran/riwayat').then(l => setRiwayat(l.filter(p => String(p.tagihanId) === id))).catch(e => setHistoryError(e instanceof Error ? e.message : 'Riwayat pembayaran belum berhasil dimuat.'));
  }, [id]);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pilihFile(value: File | null) {
    setError(''); setSent(false);
    if (!value) return;
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(value.type) || value.size === 0 || value.size > 5 * 1024 * 1024) {
      setFile(null); if (inputFile.current) inputFile.current.value = '';
      setError('Bukti transfer harus berupa JPG, PNG, atau PDF yang tidak kosong, maksimal 5 MB.'); return;
    }
    setFile(value);
  }

  async function salin() {
    setCopyError(''); setTersalin(false);
    try { await navigator.clipboard.writeText('1234567890'); setTersalin(true); }
    catch { setCopyError('Nomor rekening belum tersalin. Salin manual: 1234567890'); }
  }

  const rawJumlah = Number(jumlah.replace(/[^\d]/g, ''));
  const valid = Boolean(bill && bill.sisa > 0 && file && Number.isSafeInteger(rawJumlah) && rawJumlah > 0 && rawJumlah <= bill.sisa && (metode === 'TUNAI' || (bankAsal.trim() && namaPengirim.trim())));

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bill || !valid || busy || sent) return;
    setBusy(true); setError('');
    try {
      const data = new FormData();
      data.set('jumlah', String(rawJumlah));
      data.set('metode', metode);
      data.set('bankAsal', bankAsal);
      data.set('namaPengirim', namaPengirim);
      if (file) data.set('bukti', file);
      if (useMock) {
        setRiwayat(items => [{ id: Date.now(), tagihanId: bill.id, metode, jumlah: rawJumlah, tanggal: new Date().toISOString().slice(0, 10), status: 'MENUNGGU_VERIFIKASI', bankAsal, namaPengirim }, ...items]);
      } else {
        await upload(`/api/tagihan/${bill.id}/pembayaran`, data);
        get<ApiPayment[]>('/api/pembayaran/riwayat').then(l => setRiwayat(l.filter(p => String(p.tagihanId) === id))).catch(e => setHistoryError(e instanceof Error ? e.message : 'Pembayaran terkirim, tetapi riwayat belum dapat dimuat ulang.'));
      }
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Pembayaran belum terkirim. Coba lagi.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="bayar-page-container">
      {/* Breadcrumb */}
      <div className="bayar-breadcrumb">
        <Link href="/user/tagihan" className="bayar-breadcrumb-link">TAGIHAN SAYA</Link>
        <span className="bayar-breadcrumb-sep">&gt;</span>
        <Link href="/user/tagihan" className="bayar-breadcrumb-link">INV-2026-10-204</Link>
        <span className="bayar-breadcrumb-sep">&gt;</span>
        <span className="bayar-breadcrumb-active">PEMBAYARAN</span>
      </div>

      {/* Header */}
      <div className="bayar-header-row">
        <div>
          <h1 className="bayar-title">Konfirmasi Pembayaran Tagihan</h1>
          <p className="bayar-sub">Selesaikan pembayaran kos Anda dengan mudah dan aman melalui berbagai metode yang tersedia.</p>
        </div>
        <div className="bayar-total-pill">
          <div className="bayar-total-icon">
            <FileText size={18} aria-hidden="true" />
          </div>
          <div>
            <div className="bayar-total-label">TOTAL TAGIHAN AKTIF</div>
            <div className="bayar-total-amount">{rupiah(bill?.sisa ?? 1668750)}</div>
          </div>
        </div>
      </div>

      {!loaded && <div className="info-box mb-16" role="status">Memuat tagihan…</div>}
      {loaded && !bill && <div className="form-alert" role="alert">{error || 'Tagihan tidak ditemukan.'}</div>}

      {/* Main 2-Column Layout */}
      <div className="bayar-layout">
        {/* Left Column — Form */}
        <div className="bayar-left-col">
          <h2 className="bayar-section-title">Pilih Metode Pembayaran</h2>

          {/* Transfer Bank Option */}
          <div
            className={`bayar-method-card${metode === 'TRANSFER' ? ' bayar-method-active' : ''}`}
            onClick={() => setMetode('TRANSFER')}
            role="button"
            tabIndex={0}
          >
            <div className="bayar-method-top">
              <div className="bayar-method-radio">
                <input type="radio" name="metode" checked={metode === 'TRANSFER'} onChange={() => setMetode('TRANSFER')} />
              </div>
              <div className="bayar-method-info">
                <div className="bayar-method-name">Transfer Bank</div>
                <div className="bayar-method-desc">Kirim ke rekening pemilik kos</div>
              </div>
              <Landmark size={20} className="bayar-method-icon" aria-hidden="true" />
            </div>

            {metode === 'TRANSFER' && (
              <div className="bayar-transfer-details">
                {/* Bank account info */}
                <div className="bayar-bank-info">
                  <div>
                    <div className="bayar-bank-label">Bank BCA</div>
                    <div className="bayar-bank-number">1234567890</div>
                    <div className="bayar-bank-name">a.n. Fariz</div>
                  </div>
                  <button type="button" className="bayar-copy-btn" onClick={salin}>
                    {tersalin ? '✓ Tersalin' : 'Salin'}
                  </button>
                </div>
                {copyError && <div className="note mt-8" style={{ color: 'var(--red)' }}>{copyError}</div>}

                {/* Bank Asal & Nama Pengirim */}
                <div className="bayar-sender-grid">
                  <div className="bayar-field">
                    <label className="bayar-field-label">Bank Asal</label>
                    <select
                      className="bayar-select"
                      value={bankAsal}
                      onChange={e => setBankAsal(e.target.value)}
                    >
                      <option value="">Pilih Bank Anda</option>
                      <option value="BCA">BCA</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="CIMB">CIMB Niaga</option>
                      <option value="Permata">Permata</option>
                      <option value="Danamon">Danamon</option>
                    </select>
                  </div>
                  <div className="bayar-field">
                    <label className="bayar-field-label">Nama Pengirim (Sesuai Rekening)</label>
                    <input
                      type="text"
                      className="bayar-input"
                      value={namaPengirim}
                      onChange={e => setNamaPengirim(e.target.value)}
                      placeholder="cth. Zulfan"
                    />
                  </div>
                </div>

                {/* Upload area */}
                <div className="bayar-upload-label">Unggah Bukti Transfer</div>
                <div
                  className={`bayar-upload-area${drag ? ' bayar-upload-drag' : ''}`}
                  onDragOver={e => { e.preventDefault(); if (!busy && !sent) setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={e => { e.preventDefault(); setDrag(false); if (bill && bill.sisa > 0 && !busy && !sent) pilihFile(e.dataTransfer.files[0] ?? null); }}
                  onClick={() => inputFile.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <CloudUpload size={28} className="bayar-upload-icon" aria-hidden="true" />
                  <p className="bayar-upload-text">
                    {file ? file.name : <><b>Klik untuk unggah</b> atau seret file ke sini</>}
                  </p>
                  <p className="bayar-upload-hint">Format: JPG, PNG, atau PDF (Maks. 5MB)</p>
                  <input ref={inputFile} type="file" aria-label="Bukti transfer" accept="image/png,image/jpeg,application/pdf" style={{ display: 'none' }} onChange={e => pilihFile(e.target.files?.[0] ?? null)} />
                </div>
                {file && preview && (
                  <div className="mt-8">
                    {file.type === 'application/pdf'
                      ? <div><iframe title="Pratinjau" src={preview} style={{ width: '100%', height: 180, border: '1px solid var(--line)', borderRadius: 10 }} /></div>
                      : <img src={preview} alt="Pratinjau bukti" style={{ maxHeight: 180, width: 'auto', borderRadius: 10 }} />}
                    <p className="note mt-8">{(file.size / 1024).toLocaleString('id-ID', { maximumFractionDigits: 0 })} KB</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tunai / Cash Option */}
          <div
            className={`bayar-method-card${metode === 'TUNAI' ? ' bayar-method-active' : ''}`}
            onClick={() => setMetode('TUNAI')}
            role="button"
            tabIndex={0}
          >
            <div className="bayar-method-top">
              <div className="bayar-method-radio">
                <input type="radio" name="metode" checked={metode === 'TUNAI'} onChange={() => setMetode('TUNAI')} />
              </div>
              <div className="bayar-method-info">
                <div className="bayar-method-name">Tunai / Cash</div>
                <div className="bayar-method-desc">Bayar langsung kepada pemilik atau pengelola kos</div>
              </div>
              <Camera size={20} className="bayar-method-icon" aria-hidden="true" />
            </div>
          </div>

          {/* Jumlah Bayar */}
          <div className="bayar-jumlah-section">
            <div className="bayar-jumlah-header">
              <label className="bayar-jumlah-label">Jumlah Bayar</label>
              <span className="bayar-jumlah-hint">Pembayaran sebagian diperbolehkan</span>
            </div>
            <input
              type="text"
              className="bayar-jumlah-input"
              value={jumlah}
              onChange={e => setJumlah(e.target.value)}
              placeholder={`Rp ${Number(bill?.sisa ?? 0).toLocaleString('id-ID')}`}
            />
          </div>

          {error && bill && <div className="form-alert mt-16" role="alert">{error}</div>}
          {sent && <div className="success-inline mt-16" role="status">✓ {useMock ? 'Bukti dicatat secara lokal pada demo ini.' : 'Pembayaran terkirim dan menunggu verifikasi pemilik.'}</div>}

          {/* Submit */}
          <form onSubmit={kirim}>
            <fieldset disabled={!bill || (bill?.sisa ?? 0) <= 0 || busy || sent} style={{ border: 0, minWidth: 0, padding: 0 }}>
              <button type="submit" className="bayar-submit-btn" disabled={!valid}>
                {busy ? 'Mengirim…' : 'Kirim Pembayaran'} {!busy && <ArrowRight size={16} aria-hidden="true" />}
              </button>
            </fieldset>
          </form>
        </div>

        {/* Right Column — Riwayat */}
        <div className="bayar-right-col">
          <section className="bayar-riwayat-card">
            <div className="bayar-riwayat-header">
              <h2 className="bayar-riwayat-title">Riwayat Pembayaran</h2>
              <span className="bayar-riwayat-inv">INV-2026-10-204</span>
            </div>
            {historyError && <div className="form-alert" role="alert">{historyError}</div>}
            {!historyError && loaded && riwayat.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Belum ada pembayaran.</p>}
            <div className="bayar-riwayat-list">
              {riwayat.map(p => {
                const dotColor = p.status === 'DITERIMA' ? '#00A878' : p.status === 'DITOLAK' ? '#BA1A1A' : '#005C55';
                const statusLabel = p.status === 'DITERIMA' ? 'Diterima' : p.status === 'DITOLAK' ? 'Ditolak' : 'Menunggu Verifikasi';
                const statusClass = p.status === 'DITERIMA' ? 'riwayat-status-diterima' : p.status === 'DITOLAK' ? 'riwayat-status-ditolak' : 'riwayat-status-menunggu';
                return (
                  <div className="bayar-riwayat-item" key={p.id}>
                    <div className="bayar-riwayat-dot-row">
                      <span className="bayar-riwayat-dot" style={{ background: dotColor }} />
                      <span className="bayar-riwayat-date">{tanggalPendek(p.tanggal)}</span>
                      <span className={`bayar-riwayat-status ${statusClass}`}>{statusLabel}</span>
                    </div>
                    <div className="bayar-riwayat-detail-card">
                      <div className="bayar-riwayat-detail-top">
                        <div className="bayar-riwayat-metode">{p.metode === 'TRANSFER' ? `Transfer ${p.bankAsal ?? 'BCA'}` : 'Tunai'}</div>
                        <div className={`bayar-riwayat-amount bayar-riwayat-amount-${p.status === 'DITERIMA' ? 'ok' : p.status === 'DITOLAK' ? 'no' : 'wait'}`}>{rupiah(p.jumlah)}</div>
                      </div>
                      {p.catatanVerifikasi && (
                        <div className={`bayar-riwayat-note${p.status === 'DITOLAK' ? ' bayar-riwayat-note-reject' : ''}`}>
                          {p.status === 'DITOLAK' ? (
                            <><span className="bayar-note-label">Catatan Pemilik:</span> {p.catatanVerifikasi}</>
                          ) : (
                            p.catatanVerifikasi
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function riwayatDemoUntukTagihan(id: number) {
  void id;
  return [...contohRiwayat].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
