'use client';
import { useEffect, useState } from 'react';
import { Badge, B, Empty, PageHead } from '@/components/ui';
import { get } from '@/lib/api';
import { rupiah, periodeLabel, statusTagihan } from '@/lib/format';
import { tanggalLengkap } from '@/app/user/format';
import { kosContoh, pembayaranContoh, riwayatTagihan, tagihanAktif } from '@/lib/mock';
import type { ApiBill, ApiPayment, BillLike } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const mockPays: ApiPayment[] = pembayaranContoh.filter(p => p.tagihanId === tagihanAktif.id);
if (!mockPays.some(p => p.status === 'MENUNGGU_VERIFIKASI')) mockPays.unshift({ id: -1, tagihanId: tagihanAktif.id, metode: 'TRANSFER', jumlah: tagihanAktif.sisa, tanggal: '2026-10-26', status: 'MENUNGGU_VERIFIKASI', bankAsal: 'BCA', namaPengirim: tagihanAktif.penyewaNama });

export default function TagihanSaya() {
  const [bills, setBills] = useState<BillLike[]>(useMock ? riwayatTagihan : []);
  const [pays, setPays] = useState<ApiPayment[]>(useMock ? mockPays : []);
    const [historyError, setHistoryError] = useState('');
  const [loaded, setLoaded] = useState(useMock);
  const [error, setError] = useState('');

  useEffect(() => {
    if (useMock) return;
    get<ApiBill[]>('/api/tagihan/saya').then(setBills).catch(e => setError(e instanceof Error ? e.message : 'Tagihan belum berhasil dimuat.')).finally(() => setLoaded(true));
    get<ApiPayment[]>('/api/pembayaran/riwayat').then(setPays).catch(e => setHistoryError(e instanceof Error ? e.message : 'Riwayat pembayaran belum berhasil dimuat.'));
  }, []);

  const aktif = bills.find(b => b.status !== 'LUNAS') ?? bills[0];
  const stAktif = aktif ? statusTagihan[aktif.status] : null;
  const riwayatAktif = aktif ? pays.filter(p => p.tagihanId === aktif.id) : [];

  return <div>
    <PageHead title="Tagihan Saya" sub="Tagihan bulanan kos Anda beserta rinciannya."/>
    {error && <div className="form-alert" role="alert">{error}</div>}
        {!loaded && <div className="info-box mb-16" role="status">Memuat tagihan Anda…</div>}
    {loaded && bills.length === 0 && <Empty title="Belum ada tagihan." body="Tagihan muncul setelah booking Anda disetujui pemilik."/>}
    {aktif && stAktif && <>
      <section className="card card-pad" style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <dl className="kv" style={{ minWidth: 260 }}>
            <div><dt>Periode</dt><dd>{periodeLabel(aktif.periode.slice(0, 7))}</dd></div>
            <div><dt>Jatuh Tempo</dt><dd>{tanggalLengkap(aktif.jatuhTempo)}</dd></div>
            <div><dt>Status</dt><dd><Badge tone={stAktif.tone} dot>{aktif.status === 'BELUM_BAYAR' ? 'Belum Bayar' : stAktif.label}</Badge></dd></div>
            <div><dt>Kamar</dt><dd>{aktif.kosNama ?? (useMock ? kosContoh[0]?.nama ?? 'Kos' : 'Kos')} · Kamar {aktif.kamarNomor}</dd></div>
          </dl>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p className="note">Total Tagihan</p>
          <div className="price-lg">{rupiah(aktif.total)}</div>
          <p className="note">Sisa tagihan: {rupiah(aktif.sisa)}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 14 }}>
            {aktif.status !== 'LUNAS' && <B href={`/user/tagihan/${aktif.id}/bayar`}>Bayar Sekarang</B>}
            {aktif.status !== 'LUNAS' && <B href={`/user/tagihan/${aktif.id}/penundaan`} variant="btn-outline">Ajukan Penundaan</B>}
          </div>
        </div>
      </section>
      <div className="grid-2" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <section className="card card-pad">
          <h3 className="card-title mb-16">Rincian Tagihan</h3>
          <div className="bill-rows">
            {(aktif.items ?? []).map((it, i) => <div className="row" key={i}>
              <span className="lbl">{it.keterangan}{it.jenis === 'PEMAKAIAN' && <small>Meteran awal {it.meteranAwal?.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true })} {it.satuan ?? 'kWh'} → akhir {it.meteranAkhir?.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: true })} {it.satuan ?? 'kWh'}<br/>Pemakaian {((it.meteranAkhir ?? 0) - (it.meteranAwal ?? 0)).toLocaleString('id-ID')} {it.satuan ?? 'kWh'} × {rupiah(it.tarifPerUnit ?? 0)}/{it.satuan ?? 'kWh'}</small>}</span>
              <span className="amt">{rupiah(it.subtotal)}</span>
            </div>)}
            {aktif.denda > 0 && <div className="row"><span className="lbl">Denda keterlambatan</span><span className="amt">{rupiah(aktif.denda)}</span></div>}
            <div className="row total"><span className="lbl">Total</span><span className="amt">{rupiah(aktif.total)}</span></div>
            <div className="row"><span className="lbl">Sudah dibayar</span><span className="amt">{rupiah(aktif.terbayar)}</span></div>
            <div className="row total"><span className="lbl">Sisa</span><span className="amt">{rupiah(aktif.sisa)}</span></div>
          </div>
        </section>
        <section className="card card-pad">
          <h3 className="card-title mb-16">Riwayat Pembayaran Tagihan Ini</h3>
          {historyError && <div className="form-alert" role="alert">{historyError}</div>}
          {!historyError && riwayatAktif.length === 0 && <p className="muted">Belum ada pembayaran untuk tagihan ini.</p>}
          {riwayatAktif.length > 0 && <div className="table-wrap"><table className="data-table">
            <thead><tr><th>Tanggal / Metode</th><th>Jumlah</th><th>Status</th></tr></thead>
            <tbody>{riwayatAktif.map(p => {
              const st = p.status === 'DITERIMA' ? { label: 'Diterima', tone: 'success' } : p.status === 'DITOLAK' ? { label: 'Ditolak', tone: 'danger' } : { label: 'Menunggu Verifikasi', tone: 'info' };
              return <tr key={p.id}>
                <td>{tanggalLengkap(p.tanggal)}<div className="note">{p.metode === 'TRANSFER' ? `Transfer ${p.bankAsal ?? ''}` : 'Tunai'}</div></td>
                <td className="num">{rupiah(p.jumlah)}</td>
                <td><Badge tone={st.tone} dot>{st.label}</Badge>{p.catatanVerifikasi && <p className="note mt-8">Catatan pemilik: {p.catatanVerifikasi}</p>}</td>
              </tr>;
            })}</tbody>
          </table></div>}
          <div className="info-box blue mt-16">Pembayaran yang menunggu verifikasi belum mengurangi sisa tagihan. Tagihan menjadi lunas setelah seluruh pembayaran diterima pemilik.</div>
        </section>
      </div>
    </>}
    {bills.filter(b => b.id !== aktif?.id).length > 0 && <section className="card card-pad mt-24">
      <h3 className="card-title mb-16">Tagihan Sebelumnya</h3>
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Periode</th><th>Kamar</th><th>Total</th><th>Denda</th><th>Status</th></tr></thead>
        <tbody>
          {bills.filter(b => b.id !== aktif?.id).map(b => { const st = statusTagihan[b.status] ?? { label: b.status, tone: 'muted' }; return <tr key={b.id}>
            <td className="bold">{periodeLabel(b.periode.slice(0, 7))}</td><td>Kamar {b.kamarNomor}</td><td className="num">{rupiah(b.total)}</td><td className="num">{rupiah(b.denda)}</td>
            <td><Badge tone={st.tone} dot>{st.label}</Badge></td>
          </tr>; })}
        </tbody>
      </table></div>
    </section>}
  </div>;
}
