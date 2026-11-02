'use client';
import { useEffect, useState } from 'react';
import { Badge, PageHead } from '@/components/ui';
import { get, patch } from '@/lib/api';
import { rupiah, tanggal, periodeLabel, statusPenundaan } from '@/lib/format';
import { useKos } from '@/components/owner/useKos';
import { DemoNotice, demoTagihan } from '@/components/owner/demo';
import { PaymentProof } from '@/components/owner/PaymentProof';
import type { ApiBill, ApiDelay, ApiPayment } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const mockPay: ApiPayment[] = [
  { id: 8, tagihanId: 1, penyewaNama: 'Zulfan', metode: 'TRANSFER', jumlah: 1668750, tanggal: '2026-10-27T10:00:00', status: 'MENUNGGU_VERIFIKASI', bankAsal: 'BCA', namaPengirim: 'Zulfan' },
  { id: 9, tagihanId: 3, penyewaNama: 'Dimas Pratama', metode: 'TUNAI', jumlah: 1668750, tanggal: '2026-10-27T11:00:00', status: 'MENUNGGU_VERIFIKASI' },
];
const mockDelay: ApiDelay[] = [{ id: 1, tagihanId: 1, tanggalDiminta: '2026-11-12', alasan: 'Dana dari orang tua baru masuk tanggal 12, mohon penundaan pembayarannya.', status: 'MENUNGGU', dibuatPada: '2026-10-26', periode: '2026-10-01', jatuhTempo: '2026-11-05', total: 1668750, sisa: 1668750, kamarNomor: '204', kosNama: 'Kos Melati Putri', penyewaNama: 'Zulfan' }];

export function PembayaranSection() {
  const { kosId, error: kosError } = useKos();
  const [pays, setPays] = useState<ApiPayment[]>(useMock ? mockPay : []);
  const [delays, setDelays] = useState<ApiDelay[]>(useMock ? mockDelay : []);
  const [bills, setBills] = useState<ApiBill[]>(useMock ? demoTagihan : []);
  const [tolakPay, setTolakPay] = useState<number | null>(null);
  const [catatanPay, setCatatanPay] = useState('');
  const [catatanDelay, setCatatanDelay] = useState<Record<number, string>>({});
  const [ok, setOk] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  const muat = () => {
    if (useMock) return;
    get<ApiPayment[]>('/api/pembayaran/riwayat').then(setPays).catch(e => setError(e instanceof Error ? e.message : 'Pembayaran belum berhasil dimuat.'));
    get<ApiDelay[]>('/api/penundaan').then(setDelays).catch(e => setError(e instanceof Error ? e.message : 'Pengajuan penundaan belum berhasil dimuat.'));
  };
  useEffect(muat, []);
  useEffect(() => {
    if (useMock || !kosId) return;
    get<ApiBill[]>(`/api/kos/${kosId}/tagihan?periode=2026-10`).then(setBills).catch(e => setError(e instanceof Error ? e.message : 'Rincian tagihan belum berhasil dimuat.'));
  }, [kosId]);

  async function verifikasi(p: ApiPayment, diterima: boolean) {
    if (busy || (!diterima && !catatanPay.trim())) return;
    setBusy(true); setError(''); setOk('');
    try {
      const body = diterima ? { diterima: true } : { diterima: false, catatan: catatanPay.trim() };
      if (!useMock) await patch(`/api/pembayaran/${p.id}/verifikasi`, body);
      else setPays(list => list.map(x => x.id === p.id ? { ...x, status: diterima ? 'DITERIMA' : 'DITOLAK', catatanVerifikasi: diterima ? null : catatanPay.trim() } : x));
      setOk(`Pembayaran ${diterima ? 'diterima' : 'ditolak'}${useMock ? ' dalam demo' : ''}.`); setTolakPay(null); setCatatanPay(''); muat();
    } catch (e) { setError(e instanceof Error ? e.message : 'Verifikasi pembayaran belum berhasil.'); } finally { setBusy(false); }
  }
  async function putuskanPenundaan(d: ApiDelay, status: 'DISETUJUI' | 'DITOLAK') {
    if (busy) return;
    setBusy(true); setError(''); setOk('');
    const catatanPemilik = (catatanDelay[d.id] ?? '').trim();
    try {
      if (!useMock) await patch(`/api/penundaan/${d.id}`, { status, catatanPemilik });
      else setDelays(list => list.map(x => x.id === d.id ? { ...x, status, catatanPemilik } : x));
      setOk(`Penundaan ${status === 'DISETUJUI' ? 'disetujui' : 'ditolak'}${useMock ? ' dalam demo' : ''}.`); muat();
    } catch (e) { setError(e instanceof Error ? e.message : 'Keputusan penundaan belum berhasil disimpan.'); } finally { setBusy(false); }
  }

  const menungguPay = pays.filter(p => p.status === 'MENUNGGU_VERIFIKASI');
  const riwayatPay = pays.filter(p => p.status !== 'MENUNGGU_VERIFIKASI');
  const menungguDelay = delays.filter(d => d.status === 'MENUNGGU');
  const riwayatDelay = delays.filter(d => d.status !== 'MENUNGGU');

  return <div>
    <PageHead title="Verifikasi Pembayaran dan Penundaan" sub="Periksa bukti transfer dan pengajuan penundaan dari User."/>
    <DemoNotice/>
    {(error || kosError) && <div className="form-alert" role="alert">{error || kosError}</div>}
    {ok && <div className="success-inline" role="status">✅ {ok}</div>}
    <h3 className="card-title" style={{ margin: '6px 0 12px' }}>Menunggu Verifikasi</h3>
    {menungguPay.length === 0 && <p className="muted" style={{ marginBottom: 12 }}>Tidak ada pembayaran menunggu verifikasi.</p>}
    <div className="stack">
      {menungguPay.map(p => { const bill = bills.find(b => b.id === p.tagihanId); return <section className="card card-pad" key={`pay-${p.id}`}>
        <div className="card-head"><div><h3 className="card-title">{p.penyewaNama ?? bill?.penyewaNama ?? 'User'}{bill ? ` — Kamar ${bill.kamarNomor}` : ''}</h3><p className="card-sub">{bill ? `${periodeLabel(bill.periode.slice(0, 7))} · ` : ''}{tanggal(p.tanggal)}</p></div><Badge tone="info" dot>Menunggu Verifikasi</Badge></div>
        <dl className="kv">
          <div><dt>Tagihan</dt><dd>#{p.tagihanId}</dd></div>
          <div><dt>Jumlah transfer</dt><dd>{rupiah(p.jumlah)}</dd></div>
          <div><dt>Metode</dt><dd>{p.metode === 'TRANSFER' ? `Transfer ${p.bankAsal ?? ''}` : 'Tunai'}</dd></div>
          {p.metode === 'TRANSFER' && <div><dt>Nama pengirim</dt><dd>{p.namaPengirim ?? '—'}</dd></div>}
        </dl>
        {p.metode === 'TRANSFER' && (useMock && p.id === 8 ? <PaymentProof/> : <p className="note mt-16">Bukti transfer belum tersedia dalam respons pembayaran.</p>)}
        <div className="booking-foot mt-16">
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => verifikasi(p, true)}>Terima</button>
          <button className="btn btn-danger-outline btn-sm" disabled={busy} onClick={() => { setTolakPay(tolakPay === p.id ? null : p.id); setCatatanPay(''); }}>Tolak</button>
        </div>
        {tolakPay === p.id && <div style={{ marginTop: 12 }}>
          <div className="field"><label htmlFor={`tolak-pay-${p.id}`}>Catatan penolakan (wajib)</label><textarea id={`tolak-pay-${p.id}`} required rows={2} value={catatanPay} onChange={e => setCatatanPay(e.target.value)} placeholder="Contoh: nominal tidak sesuai tagihan…"/></div>
          <button className="btn btn-danger btn-sm" disabled={busy || !catatanPay.trim()} onClick={() => verifikasi(p, false)}>Kirim Penolakan</button>
        </div>}
      </section>; })}
    </div>
    {riwayatPay.length > 0 && <section className="card card-pad mt-24">
      <h3 className="card-title mb-16">Riwayat Verifikasi Pembayaran</h3>
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th>User</th><th>Tagihan</th><th>Jumlah</th><th>Metode</th><th>Status</th><th>Catatan</th></tr></thead>
        <tbody>{riwayatPay.map(p => <tr key={`rp-${p.id}`}>
          <td className="bold">{p.penyewaNama ?? 'User'}</td><td>#{p.tagihanId}</td><td className="num">{rupiah(p.jumlah)}</td><td>{p.metode === 'TRANSFER' ? `Transfer ${p.bankAsal ?? ''}` : 'Tunai'}</td>
          <td><Badge tone={p.status === 'DITERIMA' ? 'success' : 'danger'} dot>{p.status === 'DITERIMA' ? 'Diterima' : 'Ditolak'}</Badge></td><td className="muted">{p.catatanVerifikasi ?? '—'}</td>
        </tr>)}</tbody>
      </table></div>
    </section>}
    <h3 className="card-title" style={{ margin: '22px 0 12px' }}>Pengajuan Penundaan Masuk</h3>
    {menungguDelay.length === 0 && <p className="muted" style={{ marginBottom: 12 }}>Tidak ada pengajuan penundaan.</p>}
    <div className="stack">
      {menungguDelay.map(d => <section className="card card-pad" key={`delay-${d.id}`}>
        <div className="card-head"><div><h3 className="card-title">{d.penyewaNama ?? 'User'} — Kamar {d.kamarNomor}</h3><p className="card-sub">{d.kosNama} · {periodeLabel(d.periode.slice(0, 7))}</p></div><Badge tone="warning" dot>Menunggu</Badge></div>
        <dl className="kv">
          <div><dt>Jatuh tempo asli</dt><dd>{tanggal(d.jatuhTempo)}</dd></div>
          <div><dt>Tanggal bayar baru</dt><dd>{tanggal(d.tanggalDiminta)}</dd></div>
          <div><dt>Sisa tagihan</dt><dd>{rupiah(d.sisa)}</dd></div>
        </dl>
        <div className="info-box mt-16">Alasan User: {d.alasan}</div>
        <div className="field" style={{ marginTop: 12 }}><label htmlFor={`catatan-delay-${d.id}`}>Catatan (opsional)</label><textarea id={`catatan-delay-${d.id}`} rows={2} value={catatanDelay[d.id] ?? ''} onChange={e => setCatatanDelay(prev => ({ ...prev, [d.id]: e.target.value }))} placeholder="Catatan untuk User…"/></div>
        <div className="booking-foot">
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => putuskanPenundaan(d, 'DISETUJUI')}>Setujui</button>
          <button className="btn btn-danger-outline btn-sm" disabled={busy} onClick={() => putuskanPenundaan(d, 'DITOLAK')}>Tolak</button>
        </div>
      </section>)}
    </div>
    {riwayatDelay.length > 0 && <section className="card card-pad mt-24">
      <h3 className="card-title mb-16">Riwayat Penundaan</h3>
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th>User</th><th>Periode</th><th>Tanggal Baru</th><th>Status</th><th>Catatan</th></tr></thead>
        <tbody>{riwayatDelay.map(d => { const st = statusPenundaan[d.status] ?? { label: d.status, tone: 'muted' }; return <tr key={`rd-${d.id}`}>
          <td className="bold">{d.penyewaNama ?? 'User'}</td><td>{periodeLabel(d.periode.slice(0, 7))}</td><td>{tanggal(d.tanggalDiminta)}</td>
          <td><Badge tone={st.tone} dot>{st.label}</Badge></td><td className="muted">{d.catatanPemilik || '—'}</td>
        </tr>; })}</tbody>
      </table></div>
    </section>}
  </div>;
}
