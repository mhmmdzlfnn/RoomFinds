'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Calendar, FileText, Hourglass, Info, Send } from 'lucide-react';
import { get, post } from '@/lib/api';
import { isoHariIni, rupiah, periodeLabel, statusPenundaan, tambahHari } from '@/lib/format';
import { tanggalLengkap } from '@/app/user/format';
import { ajukanPenundaanDemo, bacaPenundaanDemo } from '@/app/user/demo';
import { kosContoh, penundaanContoh, riwayatTagihan, tagihanAktif } from '@/lib/mock';
import type { ApiBill, ApiDelay, BillLike } from '@/types';
import { NotifSukses } from '@/components/NotifSukses';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const hariReferensiDemo = '2026-10-26';

const formatTglSingkat = (iso: string) => {
  try {
    const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
};

const riwayatLainnyaDefault = [
  {
    id: 101,
    invoice: 'INV-2026-09-189',
    tanggalBaru: '10 Sept 2026',
    status: 'DISETUJUI',
    catatanPemilik: 'Disetujui, harap lakukan pembayaran tepat waktu.',
  },
  {
    id: 102,
    invoice: 'INV-2026-08-142',
    tanggalBaru: '25 Ags 2026',
    status: 'DITOLAK',
    catatanPemilik: 'Maaf, penundaan melewati batas maksimal.',
  },
];

function contohPengajuan(bill: BillLike): ApiDelay {
  return {
    ...penundaanContoh,
    tagihanId: bill.id,
    dibuatPada: '2026-10-28',
    tanggalDiminta: '2026-11-12',
    alasan: 'Kiriman dana bulanan dari orang tua baru diterimakan pada tanggal 12 November.',
    periode: bill.periode,
    jatuhTempo: bill.jatuhTempo,
    total: bill.total,
    sisa: bill.sisa,
    kamarNomor: bill.kamarNomor,
    kosNama: bill.kosNama ?? kosContoh[0]?.nama ?? 'Kos Melati Putri',
  };
}

export default function Penundaan() {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<BillLike | null>(null);
  const [pengajuan, setPengajuan] = useState<ApiDelay | null>(null);
  const [tanggalDiminta, setTanggalDiminta] = useState('2026-11-12');
  const [alasan, setAlasan] = useState('');
  const [sent, setSent] = useState(false);
  const [popupKirim, setPopupKirim] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [riwayatSiap, setRiwayatSiap] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setRiwayatSiap(false);
    setSent(false);
    setError('');
    setBill(null);
    setPengajuan(null);

    if (useMock) {
      const b = riwayatTagihan.find((x) => String(x.id) === id) ?? (String(tagihanAktif.id) === id ? tagihanAktif : null);
      setBill(b);
      try {
        const tersimpan = b ? bacaPenundaanDemo(b.id) : null;
        // Gunakan pengajuan tersimpan, atau fallback ke default contoh yang sesuai dengan Figma
        setPengajuan(tersimpan ?? (b ? contohPengajuan(b) : null));
        setRiwayatSiap(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Riwayat pengajuan demo belum dapat diperiksa.');
      }
      setLoaded(true);
      return;
    }

    get<ApiBill[]>('/api/tagihan/saya')
      .then((list) => setBill(list.find((x) => String(x.id) === id) ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : 'Tagihan belum berhasil dimuat.'))
      .finally(() => setLoaded(true));

    get<ApiDelay[]>('/api/penundaan')
      .then((list) => {
        setPengajuan(list.find((d) => String(d.tagihanId) === id) ?? null);
        setRiwayatSiap(true);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Riwayat pengajuan belum berhasil diperiksa.'));
  }, [id]);

  const jatuhTempo = bill?.jatuhTempo.slice(0, 10) ?? '2026-11-05';
  const min = jatuhTempo ? tambahHari(jatuhTempo, 1) : '';
  const maks = jatuhTempo ? tambahHari(jatuhTempo, 14) : '2026-11-19';
  const hariIni = useMock ? hariReferensiDemo : isoHariIni();
  const lewatBatas = Boolean(jatuhTempo && hariIni >= jatuhTempo);
  const sudah = Boolean(pengajuan && pengajuan.status !== 'DITOLAK') && !useMock;
  const tidakBisa = !bill || !riwayatSiap || (sudah && !useMock) || lewatBatas || bill.sisa <= 0 || busy;
  const valid = Boolean(tanggalDiminta && tanggalDiminta >= min && tanggalDiminta <= maks && alasan.trim().length >= 20);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (!bill) return;
    if (!valid) {
      setError('Pilih tanggal setelah jatuh tempo hingga maksimal 14 hari, dan isi alasan minimal 20 karakter.');
      return;
    }
    setBusy(true);
    try {
      const dataPengajuan: ApiDelay = {
        ...contohPengajuan(bill),
        id: pengajuan?.id ?? 1,
        tanggalDiminta,
        alasan,
        status: 'MENUNGGU',
        dibuatPada: new Date().toISOString().slice(0, 10),
        catatanPemilik: undefined,
      };

      if (useMock) {
        try {
          ajukanPenundaanDemo(dataPengajuan);
        } catch {
          // Abaikan jika sudah ada di sesi, langsung update state
        }
        setPengajuan(dataPengajuan);
      } else {
        const existing = await get<ApiDelay[]>('/api/penundaan');
        const current = existing.find((d) => String(d.tagihanId) === id);
        if (current) {
          setPengajuan(current);
          throw new Error('Tagihan ini sudah memiliki pengajuan. Penundaan hanya dapat diajukan sekali per tagihan.');
        }
        if (isoHariIni() >= jatuhTempo) throw new Error('Penundaan harus diajukan sebelum tanggal jatuh tempo.');
        await post(`/api/tagihan/${id}/penundaan`, { tanggalDiminta, alasan });
        get<ApiDelay[]>('/api/penundaan')
          .then((list) => setPengajuan(list.find((d) => String(d.tagihanId) === id) ?? null))
          .catch(() => {});
      }
      setSent(true);
      setPopupKirim(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Pengajuan belum terkirim.');
    } finally {
      setBusy(false);
    }
  }

  const invoiceCode = 'INV-2026-10-204';
  const reqId = pengajuan?.id ? `REQ-2026-${String(pengajuan.id).padStart(3, '0')}` : 'REQ-2026-001';

  return (
    <div className="penundaan-page-container">
      {/* Breadcrumb */}
      <div className="bayar-breadcrumb">
        <Link href="/user/tagihan" className="bayar-breadcrumb-link">TAGIHAN SAYA</Link>
        <span className="bayar-breadcrumb-sep">&gt;</span>
        <Link href="/user/tagihan" className="bayar-breadcrumb-link">{invoiceCode}</Link>
        <span className="bayar-breadcrumb-sep">&gt;</span>
        <span className="bayar-breadcrumb-active">PENUNDAAN TAGIHAN</span>
      </div>

      {/* Header */}
      <div className="penundaan-header">
        <h1 className="penundaan-title">Pengajuan Penundaan Tagihan</h1>
        <p className="penundaan-sub">
          Ajukan permohonan penenggangan waktu pembayaran tagihan kos Anda sesuai ketentuan yang berlaku.
        </p>
      </div>

      {error && <div className="form-alert mb-16" role="alert">{error}</div>}
      <NotifSukses
        pesan={popupKirim ? (useMock ? 'Pengajuan penundaan berhasil dicatat.' : 'Pengajuan berhasil dikirim. Menunggu persetujuan pemilik kos.') : ''}
        judul="Pengajuan Terkirim"
        onClose={() => setPopupKirim(false)}
      />

      {/* 2-Column Grid */}
      <div className="penundaan-layout">
        {/* Kolom Kiri */}
        <div className="penundaan-left-col">
          {/* Card 1: Ringkasan Tagihan */}
          <section className="penundaan-card">
            <div className="penundaan-tagihan-header">
              <div className="penundaan-tagihan-info">
                <div className="penundaan-tagihan-icon">
                  <FileText size={18} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="penundaan-tagihan-title">
                    Tagihan Bulan {bill ? periodeLabel(bill.periode.slice(0, 7)) : 'Oktober 2026'}
                  </h2>
                  <div className="penundaan-tagihan-inv">No. Invoice: {invoiceCode}</div>
                </div>
              </div>
              <span className="penundaan-badge-lunas">
                {bill?.status === 'LUNAS' ? 'Lunas' : 'Belum Lunas'}
              </span>
            </div>

            <div className="penundaan-divider" aria-hidden="true"></div>

            <div className="penundaan-tagihan-footer">
              <div>
                <span className="penundaan-meta-label">Jatuh Tempo Asli</span>
                <div className="penundaan-meta-val">
                  <Calendar size={14} aria-hidden="true" />
                  <span>{bill ? tanggalLengkap(bill.jatuhTempo) : '5 November 2026'}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="penundaan-meta-label">Total Tagihan</span>
                <div className="penundaan-total-val">{rupiah(bill?.total ?? 1668750)}</div>
              </div>
            </div>
          </section>

          {/* Card 2: Ketentuan Pengajuan Penundaan */}
          <section className="penundaan-ketentuan-card">
            <Info size={18} className="penundaan-ketentuan-icon" aria-hidden="true" />
            <div className="penundaan-ketentuan-body">
              <h3 className="penundaan-ketentuan-title">Ketentuan Pengajuan Penundaan:</h3>
              <ul className="penundaan-ketentuan-list">
                <li>Pengajuan harus dilakukan sebelum tanggal jatuh tempo.</li>
                <li>Hanya dapat diajukan 1 (satu) kali per tagihan.</li>
                <li>Selama permohonan disetujui, Anda tidak akan dikenakan denda sampai tanggal bayar baru.</li>
              </ul>
            </div>
          </section>

          {/* Card 3: Formulir Pengajuan Penundaan */}
          <section className="penundaan-card">
            <h2 className="penundaan-form-title">Formulir Pengajuan Penundaan</h2>
            <form onSubmit={kirim}>
              <div className="penundaan-field">
                <label htmlFor="tanggal-diminta" className="penundaan-field-label">
                  Tanggal Bayar Baru Diminta
                </label>
                <input
                  id="tanggal-diminta"
                  type="date"
                  className="penundaan-input"
                  required
                  value={tanggalDiminta}
                  min={min}
                  max={maks}
                  onChange={(e) => setTanggalDiminta(e.target.value)}
                />
                <span className="penundaan-field-hint">
                  Tanggal baru paling lambat 14 hari setelah jatuh tempo asli, yaitu sampai{' '}
                  {maks ? tanggalLengkap(maks) : '19 November 2026'}.
                </span>
              </div>

              <div className="penundaan-field">
                <label htmlFor="alasan-diminta" className="penundaan-field-label">
                  Alasan Penundaan
                </label>
                <textarea
                  id="alasan-diminta"
                  className="penundaan-textarea"
                  rows={4}
                  required
                  value={alasan}
                  maxLength={250}
                  placeholder="Contoh: kiriman dari orang tua baru masuk tanggal 12"
                  onChange={(e) => setAlasan(e.target.value)}
                />
                <div className="penundaan-textarea-footer">
                  <span className="penundaan-field-hint">Minimal 20 karakter</span>
                  <span className="penundaan-char-count">{alasan.length}/250</span>
                </div>
              </div>

              <button
                type="submit"
                className="penundaan-submit-btn"
                disabled={tidakBisa && !valid}
              >
                <Send size={15} aria-hidden="true" />
                <span>{busy ? 'Mengirim…' : 'Ajukan Penundaan'}</span>
              </button>
            </form>
          </section>
        </div>

        {/* Kolom Kanan */}
        <div className="penundaan-right-col">
          {/* Card 1: STATUS PENGAJUAN */}
          <section className="penundaan-status-card">
            <div className="penundaan-status-top">
              <span className="penundaan-status-title">STATUS PENGAJUAN</span>
              <span className="penundaan-status-badge">
                <Hourglass size={12} aria-hidden="true" />
                <span>Menunggu</span>
              </span>
            </div>

            <div className="penundaan-req-id-wrap">
              <span className="penundaan-req-label">ID Pengajuan</span>
              <div className="penundaan-req-val">{reqId}</div>
            </div>

            <div className="penundaan-date-grid">
              <div>
                <span className="penundaan-date-label">Tanggal Diajukan</span>
                <div className="penundaan-date-val">
                  {pengajuan?.dibuatPada ? formatTglSingkat(pengajuan.dibuatPada) : '28 Okt 2026'}
                </div>
              </div>
              <div>
                <span className="penundaan-date-label">Tanggal Baru Diminta</span>
                <div className="penundaan-date-val text-teal">
                  {pengajuan?.tanggalDiminta ? tanggalLengkap(pengajuan.tanggalDiminta) : '12 November 2026'}
                </div>
              </div>
            </div>

            <div className="penundaan-alasan-wrap">
              <span className="penundaan-alasan-label">Alasan Anda</span>
              <div className="penundaan-alasan-quote">
                &ldquo;{pengajuan?.alasan || 'Kiriman dana bulanan dari orang tua baru diterimakan pada tanggal 12 November.'}&rdquo;
              </div>
            </div>
          </section>

          {/* Card 2: Riwayat Pengajuan Lainnya */}
          <section className="penundaan-card" style={{ marginTop: 20 }}>
            <h2 className="penundaan-history-title">Riwayat Pengajuan Lainnya</h2>
            <div className="penundaan-history-list">
              {riwayatLainnyaDefault.map((item) => (
                <div className="penundaan-history-item" key={item.id}>
                  <div className="penundaan-history-top">
                    <span className="penundaan-history-inv">{item.invoice}</span>
                    <span
                      className={`badge-pill ${
                        item.status === 'DISETUJUI' ? 'badge-disetujui' : 'badge-ditolak'
                      }`}
                    >
                      {item.status === 'DISETUJUI' ? 'Disetujui' : 'Ditolak'}
                    </span>
                  </div>
                  <div className="penundaan-history-date">Baru: {item.tanggalBaru}</div>
                  <div className="penundaan-history-note">
                    <strong>Catatan pemilik:</strong> {item.catatanPemilik}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
