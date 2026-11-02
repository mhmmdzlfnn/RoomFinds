'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge, PageHead } from '@/components/ui';
import { get, post } from '@/lib/api';
import { isoHariIni, rupiah, periodeLabel, statusPenundaan, tambahHari } from '@/lib/format';
import { tanggalLengkap } from '@/app/user/format';
import { ajukanPenundaanDemo, bacaPenundaanDemo } from '@/app/user/demo';
import { kosContoh, penundaanContoh, riwayatTagihan, tagihanAktif } from '@/lib/mock';
import type { ApiBill, ApiDelay, BillLike } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const hariReferensiDemo = '2026-10-26';
function contohPengajuan(bill: BillLike): ApiDelay {
  return { ...penundaanContoh, tagihanId: bill.id, dibuatPada: hariReferensiDemo, periode: bill.periode, jatuhTempo: bill.jatuhTempo, total: bill.total, sisa: bill.sisa, kamarNomor: bill.kamarNomor, kosNama: bill.kosNama ?? kosContoh[0]?.nama ?? 'Kos Melati Putri' };
}

export default function Penundaan() {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<BillLike | null>(null);
  const [pengajuan, setPengajuan] = useState<ApiDelay | null>(null);
  const [tanggalDiminta, setTanggalDiminta] = useState('2026-11-12');
  const [alasan, setAlasan] = useState(useMock ? penundaanContoh.alasan : '');
  const [sent, setSent] = useState(false); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false); const [riwayatSiap, setRiwayatSiap] = useState(false);

  useEffect(() => {
    setLoaded(false); setRiwayatSiap(false); setSent(false); setError(''); setBill(null); setPengajuan(null);
    if (useMock) {
      const b = riwayatTagihan.find(x => String(x.id) === id) ?? (String(tagihanAktif.id) === id ? tagihanAktif : null);
      setBill(b);
      try { setPengajuan(b ? bacaPenundaanDemo(b.id) : null); setRiwayatSiap(true); }
      catch (e) { setError(e instanceof Error ? e.message : 'Riwayat pengajuan demo belum dapat diperiksa.'); }
      setLoaded(true); return;
    }
    get<ApiBill[]>('/api/tagihan/saya').then(list => setBill(list.find(x => String(x.id) === id) ?? null)).catch(e => setError(e instanceof Error ? e.message : 'Tagihan belum berhasil dimuat.')).finally(() => setLoaded(true));
    get<ApiDelay[]>('/api/penundaan').then(list => { setPengajuan(list.find(d => String(d.tagihanId) === id) ?? null); setRiwayatSiap(true); }).catch(e => setError(e instanceof Error ? e.message : 'Riwayat pengajuan belum berhasil diperiksa. Pengajuan baru belum dapat dikirim.'));
  }, [id]);

  const jatuhTempo = bill?.jatuhTempo.slice(0, 10) ?? '';
  const min = jatuhTempo ? tambahHari(jatuhTempo, 1) : '';
  const maks = jatuhTempo ? tambahHari(jatuhTempo, 14) : '';
  const hariIni = useMock ? hariReferensiDemo : isoHariIni();
  const lewatBatas = Boolean(jatuhTempo && hariIni >= jatuhTempo);
  const sudah = Boolean(pengajuan) || sent;
  const tidakBisa = !bill || !riwayatSiap || sudah || lewatBatas || bill.sisa <= 0 || busy;
  const valid = Boolean(tanggalDiminta && tanggalDiminta >= min && tanggalDiminta <= maks && alasan.trim().length >= 20);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    if (tidakBisa || !bill) return;
    if (!valid) { setError('Pilih tanggal setelah jatuh tempo hingga maksimal 14 hari, dan isi alasan minimal 20 karakter.'); return; }
    setBusy(true);
    try {
      if (useMock) {
        setPengajuan(ajukanPenundaanDemo({ ...contohPengajuan(bill), tanggalDiminta, alasan, status: 'MENUNGGU', catatanPemilik: undefined }));
      } else {
        const existing = await get<ApiDelay[]>('/api/penundaan');
        const current = existing.find(d => String(d.tagihanId) === id);
        if (current) { setPengajuan(current); throw new Error('Tagihan ini sudah memiliki pengajuan. Penundaan hanya dapat diajukan sekali per tagihan.'); }
        if (isoHariIni() >= jatuhTempo) throw new Error('Penundaan harus diajukan sebelum tanggal jatuh tempo.');
        await post(`/api/tagihan/${id}/penundaan`, { tanggalDiminta, alasan });
        get<ApiDelay[]>('/api/penundaan').then(list => setPengajuan(list.find(d => String(d.tagihanId) === id) ?? null)).catch(() => setError('Pengajuan terkirim, tetapi status belum dapat dimuat ulang. Buka kembali halaman ini untuk memperbarui status.'));
      }
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Pengajuan belum terkirim.'); }
    finally { setBusy(false); }
  }

  return <div>
    <Link className="back-link" href="/user/tagihan">← Kembali ke Tagihan Saya</Link>
    <PageHead title="Pengajuan Penundaan" sub="Butuh waktu tambahan? Ajukan tanggal pembayaran baru kepada pemilik."/>
    {error && <div className="form-alert" role="alert">{error}</div>}
    {!loaded && <div className="info-box mb-16" role="status">Memuat tagihan dan riwayat pengajuan…</div>}
    {loaded && !bill && <div className="form-alert" role="alert">Tagihan tidak ditemukan. Pilih tagihan dari halaman Tagihan Saya.</div>}
    {sent && <div className="success-inline" role="status">✓ {useMock ? 'Pengajuan demo dicatat secara lokal dan berstatus Menunggu. Tidak ada data yang dikirim ke server.' : 'Pengajuan berhasil dikirim. Silakan tunggu keputusan pemilik kos.'}</div>}
    {bill && <section className="card card-pad mb-24">
      <div className="card-head"><div><h3 className="card-title">Ringkasan Tagihan</h3><p className="card-sub">{bill.kosNama ?? (useMock ? kosContoh[0]?.nama ?? 'Kos' : 'Kos')} · Kamar {bill.kamarNomor}</p></div><Badge tone={bill.status === 'LUNAS' ? 'success' : 'warning'}>{bill.status === 'LUNAS' ? 'Lunas' : 'Belum Lunas'}</Badge></div>
      <dl className="kv" style={{ maxWidth: 560 }}>
        <div><dt>Periode</dt><dd>{periodeLabel(bill.periode.slice(0, 7))}</dd></div>
        <div><dt>Jatuh tempo asli</dt><dd>{tanggalLengkap(bill.jatuhTempo)}</dd></div>
        <div><dt>Total tagihan</dt><dd>{rupiah(bill.total)}</dd></div>
        <div><dt>Sisa tagihan</dt><dd>{rupiah(bill.sisa)}</dd></div>
      </dl>
      <div className="info-box warning mt-16"><div><b>Ketentuan Penundaan</b><ul style={{ listStyle: 'disc', paddingLeft: 18, marginTop: 6 }}><li>Ajukan sebelum tanggal jatuh tempo.</li><li>Hanya satu kali pengajuan untuk setiap tagihan, termasuk pengajuan yang ditolak.</li><li>Jika disetujui, tidak ada denda hingga tanggal bayar baru.</li><li>Maksimal 14 hari setelah jatuh tempo asli: <b>{maks ? tanggalLengkap(maks) : '—'}</b>.</li></ul></div></div>
    </section>}

    <div className="grid-2" style={{ alignItems: 'start' }}>
      <section className="card card-pad">
        <h3 className="card-title mb-16">Formulir Penundaan</h3>
        <form onSubmit={kirim}>
          <div className="field"><label htmlFor="tanggal-penundaan">Tanggal Bayar Baru</label><input id="tanggal-penundaan" type="date" required value={pengajuan?.tanggalDiminta.slice(0, 10) ?? tanggalDiminta} min={min} max={maks} disabled={tidakBisa} onChange={e => setTanggalDiminta(e.target.value)}/><span className="hint">Tanggal baru paling lambat 14 hari setelah jatuh tempo asli{maks ? `, yaitu sampai ${tanggalLengkap(maks)}` : ''}</span></div>
          <div className="field"><label htmlFor="alasan-penundaan">Alasan Penundaan</label><textarea id="alasan-penundaan" rows={5} required value={pengajuan?.alasan ?? alasan} minLength={20} disabled={tidakBisa} placeholder="Jelaskan alasan dan rencana pembayaran Anda…" onChange={e => setAlasan(e.target.value)}/><span className="hint">Minimal 20 karakter · {(pengajuan?.alasan ?? alasan).trim().length} karakter.</span></div>
          {!sudah && <button className="btn btn-primary btn-lg" disabled={tidakBisa || !valid}>{busy ? 'Mengirim…' : 'Ajukan Penundaan'}</button>}
          {sudah && <p className="note">Pengajuan sudah tercatat. Setiap tagihan hanya dapat diajukan satu kali.</p>}
          {lewatBatas && !sudah && <div className="info-box warning mt-16">Pengajuan ditutup karena sudah memasuki tanggal jatuh tempo.</div>}
          {bill && bill.sisa <= 0 && <p className="note mt-8">Tagihan ini sudah lunas dan tidak memerlukan penundaan.</p>}
        </form>
      </section>
      <section className="card card-pad">
        <h3 className="card-title mb-16">Status & Riwayat Pengajuan</h3>
        {!pengajuan ? <p className="muted">{!riwayatSiap ? 'Memeriksa riwayat pengajuan…' : sent ? 'Pengajuan terkirim. Status sedang diperbarui.' : 'Belum ada pengajuan penundaan untuk tagihan ini.'}</p> : <>
          <div className="card-head"><div><b>Pengajuan penundaan</b><p className="card-sub">Diajukan {tanggalLengkap(pengajuan.dibuatPada)}</p></div><Badge tone={statusPenundaan[pengajuan.status]?.tone ?? 'muted'} dot>{statusPenundaan[pengajuan.status]?.label ?? pengajuan.status}</Badge></div>
          <dl className="kv">
            <div><dt>Tanggal bayar baru</dt><dd>{tanggalLengkap(pengajuan.tanggalDiminta)}</dd></div>
            <div><dt>Alasan</dt><dd style={{ maxWidth: 320, textAlign: 'right', fontWeight: 500 }}>{pengajuan.alasan}</dd></div>
          </dl>
          {pengajuan.catatanPemilik ? <div className="quote-box mt-16">Catatan pemilik: “{pengajuan.catatanPemilik}”</div> : <div className="info-box blue mt-16">{pengajuan.status === 'MENUNGGU' ? 'Pemilik belum memberikan catatan. Jatuh tempo asli tetap berlaku sampai pengajuan disetujui.' : 'Tidak ada catatan tambahan dari pemilik.'}</div>}
        </>}
      </section>
    </div>
  </div>;
}
