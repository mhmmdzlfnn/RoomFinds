'use client';
import { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  CircleX,
  Eye,
  FileText,
  ShieldCheck,
  X,
} from 'lucide-react';
import { get, patch } from '@/lib/api';
import { rupiah, periodeLabel, tanggalWaktu } from '@/lib/format';
import { useKos } from '@/components/owner/useKos';
import { DemoNotice, demoTagihan } from '@/components/owner/demo';
import { PaymentProof } from '@/components/owner/PaymentProof';
import { Sukses } from '@/components/owner/DashboardModals';
import type { ApiBill, ApiDelay, ApiPayment } from '@/types';
import { NotifSukses } from '@/components/NotifSukses';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const mockPay: ApiPayment[] = [
  {
    id: 8,
    tagihanId: 1,
    penyewaNama: 'Zulfan',
    metode: 'TRANSFER',
    jumlah: 1668750,
    tanggal: '2026-10-26T14:25:00',
    status: 'MENUNGGU_VERIFIKASI',
    bankAsal: 'BCA',
    namaPengirim: 'Zulfan',
  },
  {
    id: 9,
    tagihanId: 5,
    penyewaNama: 'Rian Hidayat',
    metode: 'TRANSFER',
    jumlah: 1250000,
    tanggal: '2026-10-12T09:10:00',
    status: 'MENUNGGU_VERIFIKASI',
    bankAsal: 'Mandiri',
    namaPengirim: 'Rian Hidayat',
  },
];

const mockDelay: ApiDelay[] = [
  {
    id: 1,
    tagihanId: 4,
    tanggalDiminta: '2026-11-12',
    alasan: '"Kiriman dana bulanan dari orang tua baru masuk tanggal 12"',
    status: 'MENUNGGU',
    dibuatPada: '2026-10-26',
    periode: '2026-10-01',
    jatuhTempo: '2026-11-05',
    total: 1250000,
    sisa: 1250000,
    kamarNomor: '207',
    kosNama: 'Kos Melati Putri',
    penyewaNama: 'Siti Aminah',
  },
];

const mockBuktiFname: Record<number, { name: string; uploadTime: string }> = {
  8: { name: 'Bukti_Transfer_Zulfan.jpg', uploadTime: '26 Okt 2026, 14:25 WIB' },
  9: { name: 'Struk_Mandiri_Rian.png', uploadTime: '12 Okt 2026, 09:10 WIB' },
};

function getInitials(nama: string) {
  return nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

// Warna avatar tetap per penghuni. Palet dibatasi hitam, abu tua, dan limau (aksen).
const avatarPalette: Record<string, { bg: string; color: string }> = {
  Z: { bg: '#111111', color: '#C6F432' },
  BS: { bg: '#2B2B2B', color: '#fff' },
  RH: { bg: '#4A4A4A', color: '#fff' },
  SA: { bg: '#C6F432', color: '#111111' },
};
function getAvatarStyle(nama: string): { bg: string; color: string } {
  const initials = nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  if (avatarPalette[initials]) return avatarPalette[initials];
  const fallbacks = [
    { bg: '#111111', color: '#C6F432' },
    { bg: '#2B2B2B', color: '#fff' },
    { bg: '#4A4A4A', color: '#fff' },
    { bg: '#C6F432', color: '#111111' },
    { bg: '#E5E5E0', color: '#111111' },
  ];
  return fallbacks[nama.charCodeAt(0) % fallbacks.length];
}

export function PembayaranSection() {
  const { kosId, error: kosError } = useKos();
  const [pays, setPays] = useState<ApiPayment[]>(useMock ? mockPay : []);
  const [delays, setDelays] = useState<ApiDelay[]>(useMock ? mockDelay : []);
  const [bills, setBills] = useState<ApiBill[]>(useMock ? demoTagihan : []);
  const [catatanPay, setCatatanPay] = useState<Record<number, string>>({});
  const [catatanDelay, setCatatanDelay] = useState<Record<number, string>>({});
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [hasil, setHasil] = useState<{ diterima: boolean; penyewa: string; kamar: string; jumlah: number; alasan: string } | null>(null);

  const flash = (msg: string) => {
    setOk(msg);
    setTimeout(() => setOk(''), 4000);
  };

  const muat = () => {
    if (useMock) return;
    get<ApiPayment[]>('/api/pembayaran/riwayat')
      .then(setPays)
      .catch((e) => setError(e instanceof Error ? e.message : 'Pembayaran belum berhasil dimuat.'));
    get<ApiDelay[]>('/api/penundaan')
      .then(setDelays)
      .catch((e) => setError(e instanceof Error ? e.message : 'Pengajuan penundaan belum berhasil dimuat.'));
  };

  useEffect(muat, []);
  useEffect(() => {
    if (useMock || !kosId) return;
    get<ApiBill[]>(`/api/kos/${kosId}/tagihan?periode=2026-10`)
      .then(setBills)
      .catch(() => {});
  }, [kosId]);

  async function verifikasi(p: ApiPayment, diterima: boolean) {
    const catatan = (catatanPay[p.id] ?? '').trim();
    if (!diterima && !catatan) {
      setError('Isi catatan penolakan terlebih dahulu.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = diterima ? { diterima: true } : { diterima: false, catatan };
      if (!useMock) await patch(`/api/pembayaran/${p.id}/verifikasi`, body);
      else
        setPays((list) =>
          list.map((x) =>
            x.id === p.id
              ? { ...x, status: diterima ? 'DITERIMA' : 'DITOLAK', catatanVerifikasi: diterima ? null : catatan }
              : x
          )
        );
      const tagihan = bills.find((b) => b.id === p.tagihanId);
      const kamarNo = tagihan?.kamarNomor ?? (p.tagihanId === 1 ? '204' : p.tagihanId === 2 ? '102' : '305');
      setHasil({ diterima, penyewa: p.penyewaNama ?? 'User', kamar: kamarNo, jumlah: p.jumlah, alasan: catatan });
      muat();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verifikasi pembayaran gagal.');
    } finally {
      setBusy(false);
    }
  }

  async function putuskanPenundaan(d: ApiDelay, status: 'DISETUJUI' | 'DITOLAK') {
    if (busy) return;
    setBusy(true);
    setError('');
    const catatanPemilik = (catatanDelay[d.id] ?? '').trim();
    try {
      if (!useMock) await patch(`/api/penundaan/${d.id}`, { status, catatanPemilik });
      else setDelays((list) => list.map((x) => (x.id === d.id ? { ...x, status, catatanPemilik } : x)));
      flash(`Penundaan ${status === 'DISETUJUI' ? 'disetujui' : 'ditolak'}.`);
      muat();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Keputusan penundaan gagal disimpan.');
    } finally {
      setBusy(false);
    }
  }

  const menungguPay = pays.filter((p) => p.status === 'MENUNGGU_VERIFIKASI');
  const riwayatPay = pays.filter((p) => p.status !== 'MENUNGGU_VERIFIKASI');
  const menungguDelay = delays.filter((d) => d.status === 'MENUNGGU');
  const riwayatDelay = delays.filter((d) => d.status !== 'MENUNGGU');

  return (
    <div className="vp-container">
      {/* ── Page Header ── */}
      <header className="vp-header">
        <div className="vp-header-left">
          <div className="vp-page-tag">VERIFIKASI &amp; KEUANGAN</div>
          <h1 className="vp-page-title">Verifikasi Pembayaran &amp; Pengajuan</h1>
          <p className="vp-page-sub">
            Kelola bukti transfer penghuni dan pengajuan penundaan tepat waktu dengan mudah.
          </p>
        </div>
        <div className="vp-auto-pill">
          <ShieldCheck size={15} className="vp-auto-icon" aria-hidden="true" />
          <span>Sistem Verifikasi Otomatis Aktif</span>
        </div>
      </header>

      {/* Alerts */}
      {(error || kosError) && (
        <div className="form-alert" role="alert">
          {error || kosError}
        </div>
      )}
      <NotifSukses pesan={ok} onClose={() => setOk('')} />

      <DemoNotice />

      {/* ── Menunggu Verifikasi ── */}
      <section>
        <div className="vp-section-head">
          <h2 className="vp-section-title">Menunggu Verifikasi</h2>
          {menungguPay.length > 0 && (
            <span className="vp-count-badge vp-count-teal">{menungguPay.length} Pembayaran</span>
          )}
        </div>

        {menungguPay.length === 0 ? (
          <p className="muted" style={{ marginTop: 8 }}>
            Tidak ada pembayaran yang menunggu verifikasi.
          </p>
        ) : (
          <div className="vp-pay-grid">
            {menungguPay.map((p) => {
              const bill = bills.find((b) => b.id === p.tagihanId);
              const initials = getInitials(p.penyewaNama ?? 'User');
              const avatarStyle = getAvatarStyle(p.penyewaNama ?? 'User');
              const bukti = mockBuktiFname[p.id];
              const kamarNomor = bill?.kamarNomor ?? (p.tagihanId === 1 ? '204' : p.tagihanId === 2 ? '102' : '305');
              const periode = bill?.periode
                ? periodeLabel(bill.periode.slice(0, 7))
                : 'Oktober 2026';

              return (
                <div className="vp-pay-card" key={`pay-${p.id}`}>
                  {/* Card Header */}
                  <div className="vp-pay-card-head">
                    <div className="vp-pay-avatar" style={{ background: avatarStyle.bg, color: avatarStyle.color }}>
                      {initials}
                    </div>
                    <div className="vp-pay-meta">
                      <div className="vp-pay-name">{p.penyewaNama}</div>
                      <div className="vp-pay-room">
                        Kamar {kamarNomor} • Periode {periode}
                      </div>
                    </div>
                    <span className="vp-menunggu-badge">Menunggu Verifikasi</span>
                  </div>

                  {/* Payment Info Row */}
                  <div className="vp-pay-info-row">
                    <div className="vp-pay-info-cell">
                      <div className="vp-pay-info-label">Jumlah Transfer</div>
                      <div className="vp-pay-info-amount">{rupiah(p.jumlah)}</div>
                    </div>
                    <div className="vp-pay-info-cell">
                      <div className="vp-pay-info-label">Bank Pengirim</div>
                      <div className="vp-pay-info-val">
                        Bank {p.bankAsal ?? 'BCA'} a.n. {p.namaPengirim ?? p.penyewaNama}
                      </div>
                    </div>
                  </div>

                  {/* Bukti File Row */}
                  <div className="vp-bukti-row">
                    <div className="vp-bukti-icon-wrap">
                      <FileText size={18} className="vp-bukti-icon" aria-hidden="true" />
                    </div>
                    <div className="vp-bukti-meta">
                      <div className="vp-bukti-name">{bukti?.name ?? 'Bukti_Transfer.jpg'}</div>
                      <div className="vp-bukti-time">
                        Unggah {bukti?.uploadTime ?? tanggalWaktu(p.tanggal)}
                      </div>
                    </div>
                    {useMock && p.id === 8 ? (
                      <PaymentProof />
                    ) : (
                      <button
                        type="button"
                        className="vp-lihat-btn"
                        onClick={() => alert('Bukti transfer tidak tersedia dalam demo.')}
                      >
                        <Eye size={13} aria-hidden="true" />
                        <span>Lihat Detail</span>
                      </button>
                    )}
                  </div>

                  {/* Catatan Penolakan */}
                  <div className="vp-catatan-field">
                    <label className="vp-catatan-label">
                      Catatan penolakan (wajib diisi jika menolak)
                    </label>
                    <input
                      type="text"
                      className="vp-catatan-input"
                      value={catatanPay[p.id] ?? ''}
                      onChange={(e) => setCatatanPay((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Contoh: Nominal transfer tidak sesuai dengan tagihan"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="vp-action-row">
                    <button
                      type="button"
                      className="vp-btn-terima"
                      disabled={busy}
                      onClick={() => verifikasi(p, true)}
                    >
                      <Check size={15} strokeWidth={3} aria-hidden="true" />
                      <span>Terima</span>
                    </button>
                    <button
                      type="button"
                      className="vp-btn-tolak"
                      disabled={busy}
                      onClick={() => verifikasi(p, false)}
                    >
                      <X size={15} strokeWidth={3} aria-hidden="true" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Riwayat Verifikasi ── */}
      {riwayatPay.length > 0 && (
        <section className="vp-riwayat-section">
          <h3 className="vp-riwayat-title">Riwayat Verifikasi Pembayaran</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Tagihan</th>
                  <th>Jumlah</th>
                  <th>Metode</th>
                  <th>Status</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {riwayatPay.map((p) => (
                  <tr key={`rp-${p.id}`}>
                    <td className="bold">{p.penyewaNama ?? 'User'}</td>
                    <td>#{p.tagihanId}</td>
                    <td className="num">{rupiah(p.jumlah)}</td>
                    <td>{p.metode === 'TRANSFER' ? `Transfer ${p.bankAsal ?? ''}` : 'Tunai'}</td>
                    <td>
                      <span className={`vp-status-pill ${p.status === 'DITERIMA' ? 'pill-diterima' : 'pill-ditolak'}`}>
                        {p.status === 'DITERIMA' ? 'Diterima' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="muted">{p.catatanVerifikasi ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Pengajuan Penundaan ── */}
      <section>
        <div className="vp-section-head">
          <h2 className="vp-section-title">Pengajuan Penundaan Masuk</h2>
          {menungguDelay.length > 0 && (
            <span className="vp-count-badge vp-count-amber">{menungguDelay.length} Pengajuan</span>
          )}
        </div>

        {menungguDelay.length === 0 ? (
          <p className="muted" style={{ marginTop: 8 }}>
            Tidak ada pengajuan penundaan yang masuk.
          </p>
        ) : (
          <div className="vp-delay-stack">
            {menungguDelay.map((d) => {
              const initials = getInitials(d.penyewaNama ?? 'User');
              const avatarStyle = getAvatarStyle(d.penyewaNama ?? 'S');

              return (
                <div className="vp-delay-card" key={`delay-${d.id}`}>
                  {/* Card Header */}
                  <div className="vp-pay-card-head">
                    <div
                      className="vp-pay-avatar"
                      style={{
                        background: avatarStyle.bg,
                        color: avatarStyle.color,
                      }}
                    >
                      {initials}
                    </div>
                    <div className="vp-pay-meta">
                      <div className="vp-pay-name">{d.penyewaNama}</div>
                      <div className="vp-pay-room">Kamar {d.kamarNomor}</div>
                    </div>
                    <span className="vp-pending-badge">Pending Pengajuan</span>
                  </div>

                  {/* Date Info */}
                  <div className="vp-delay-dates">
                    <div className="vp-delay-date-cell">
                      <div className="vp-pay-info-label">Jatuh Tempo Asli</div>
                      <div className="vp-delay-date-val text-red">
                        {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(
                          new Date(d.jatuhTempo)
                        )}
                      </div>
                    </div>
                    <div className="vp-delay-date-cell">
                      <div className="vp-pay-info-label">Pengajuan Tanggal Baru</div>
                      <div className="vp-delay-date-val" style={{ color: '#1E293B' }}>
                        {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(
                          new Date(d.tanggalDiminta)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alasan */}
                  <div className="vp-alasan-box">
                    <div className="vp-alasan-label">Alasan Penghuni:</div>
                    <div className="vp-alasan-text">{d.alasan}</div>
                  </div>

                  {/* Catatan Pemilik */}
                  <div className="vp-catatan-field">
                    <label className="vp-catatan-label">Catatan (opsional)</label>
                    <input
                      type="text"
                      className="vp-catatan-input"
                      value={catatanDelay[d.id] ?? ''}
                      onChange={(e) => setCatatanDelay((prev) => ({ ...prev, [d.id]: e.target.value }))}
                      placeholder="Tambahkan catatan untuk penghuni..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="vp-action-row">
                    <button
                      type="button"
                      className="vp-btn-terima"
                      disabled={busy}
                      onClick={() => putuskanPenundaan(d, 'DISETUJUI')}
                    >
                      <Check size={15} strokeWidth={3} aria-hidden="true" />
                      <span>Setujui</span>
                    </button>
                    <button
                      type="button"
                      className="vp-btn-tolak"
                      disabled={busy}
                      onClick={() => putuskanPenundaan(d, 'DITOLAK')}
                    >
                      <X size={15} strokeWidth={3} aria-hidden="true" />
                      <span>Tolak</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Riwayat Penundaan */}
      {riwayatDelay.length > 0 && (
        <section className="vp-riwayat-section">
          <h3 className="vp-riwayat-title">Riwayat Penundaan</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Periode</th>
                  <th>Tanggal Baru</th>
                  <th>Status</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {riwayatDelay.map((d) => (
                  <tr key={`rd-${d.id}`}>
                    <td className="bold">{d.penyewaNama ?? 'User'}</td>
                    <td>{periodeLabel(d.periode.slice(0, 7))}</td>
                    <td>
                      {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(
                        new Date(d.tanggalDiminta)
                      )}
                    </td>
                    <td>
                      <span className={`vp-status-pill ${d.status === 'DISETUJUI' ? 'pill-diterima' : 'pill-ditolak'}`}>
                        {d.status === 'DISETUJUI' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="muted">{d.catatanPemilik || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {hasil && (
        <Sukses
          judul={hasil.diterima ? 'Pembayaran Diterima' : 'Pembayaran Ditolak'}
          sub={hasil.diterima ? 'Bukti transfer sudah diverifikasi dan tagihan dinyatakan lunas.' : 'Bukti transfer ditolak dan penyewa diminta mengunggah ulang bukti yang sesuai.'}
          ikon={hasil.diterima ? <CheckCircle2 size={28} aria-hidden="true" /> : <X size={28} strokeWidth={2.5} aria-hidden="true" />}
          lembut={hasil.diterima}
          merah={!hasil.diterima}
          onClose={() => setHasil(null)}
        >
          <dl className="fx-modal-summary">
            <div><dt>Penyewa:</dt><dd>{hasil.penyewa}, Kamar {hasil.kamar}</dd></div>
            <div><dt>Jumlah:</dt><dd><b className="fx-modal-teal">{rupiah(hasil.jumlah)}</b></dd></div>
            {hasil.diterima
              ? <div><dt>Status Tagihan:</dt><dd><b className="fx-modal-teal">LUNAS</b></dd></div>
              : <div><dt>Alasan Penolakan:</dt><dd className="fx-modal-red">{hasil.alasan}</dd></div>}
          </dl>
        </Sukses>
      )}
    </div>
  );
}
