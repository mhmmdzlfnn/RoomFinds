'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Banknote, Landmark } from 'lucide-react';
import { Badge, Card, PageHead } from '@/components/ui';
import { get, upload } from '@/lib/api';
import { rupiah, periodeLabel } from '@/lib/format';
import { tanggalLengkap } from '@/app/user/format';
import { kosContoh, pembayaranContoh, riwayatTagihan, tagihanAktif } from '@/lib/mock';
import type { ApiBill, ApiPayment, BillLike } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const contohRiwayat: ApiPayment[] = pembayaranContoh.filter(p => p.tagihanId === tagihanAktif.id);
if (!contohRiwayat.some(p => p.status === 'MENUNGGU_VERIFIKASI')) contohRiwayat.unshift({ id: -1, tagihanId: tagihanAktif.id, metode: 'TRANSFER', jumlah: tagihanAktif.sisa, tanggal: '2026-10-26', status: 'MENUNGGU_VERIFIKASI', bankAsal: 'BCA', namaPengirim: tagihanAktif.penyewaNama });
if (!contohRiwayat.some(p => p.status === 'DITERIMA')) contohRiwayat.push({ id: -2, tagihanId: riwayatTagihan.find(b => b.status === 'LUNAS')?.id ?? -1, metode: 'TRANSFER', jumlah: riwayatTagihan.find(b => b.status === 'LUNAS')?.total ?? tagihanAktif.total, tanggal: '2026-10-04', status: 'DITERIMA', bankAsal: 'BCA', namaPengirim: tagihanAktif.penyewaNama });
if (!contohRiwayat.some(p => p.status === 'DITOLAK')) contohRiwayat.push({ id: -3, tagihanId: tagihanAktif.id, metode: 'TRANSFER', jumlah: tagihanAktif.total, tanggal: '2026-10-24', status: 'DITOLAK', bankAsal: 'BCA', namaPengirim: tagihanAktif.penyewaNama, catatanVerifikasi: 'Bukti transfer kurang jelas. Mohon unggah ulang bukti yang memperlihatkan tanggal, nominal, dan rekening tujuan.' });

export default function Pembayaran() {
  const { id } = useParams<{ id: string }>();
  const [bill, setBill] = useState<BillLike | null>(null);
  const [riwayat, setRiwayat] = useState<ApiPayment[]>([]);
  const [jumlah, setJumlah] = useState(''); const [bankAsal, setBankAsal] = useState(useMock ? 'BCA' : ''); const [namaPengirim, setNamaPengirim] = useState(useMock ? tagihanAktif.penyewaNama : '');
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(''); const [drag, setDrag] = useState(false);
  const inputFile = useRef<HTMLInputElement>(null);
  const [tersalin, setTersalin] = useState(false); const [copyError, setCopyError] = useState('');
  const [sent, setSent] = useState(false); const [error, setError] = useState(''); const [historyError, setHistoryError] = useState(''); const [busy, setBusy] = useState(false); const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false); setSent(false); setError(''); setHistoryError(''); setFile(null);
    if (useMock) {
      const b = riwayatTagihan.find(x => String(x.id) === id) ?? (String(tagihanAktif.id) === id ? tagihanAktif : null);
      setBill(b); setJumlah(b ? String(b.sisa) : ''); setRiwayat(b ? riwayatDemoUntukTagihan(b.id) : []); setLoaded(true); return;
    }
    get<ApiBill[]>('/api/tagihan/saya').then(list => { const b = list.find(x => String(x.id) === id) ?? null; setBill(b); setJumlah(b ? String(b.sisa) : ''); }).catch(e => setError(e instanceof Error ? e.message : 'Tagihan belum berhasil dimuat.')).finally(() => setLoaded(true));
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
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(value.type) || value.size === 0 || value.size > 2 * 1024 * 1024) {
      setFile(null); if (inputFile.current) inputFile.current.value = '';
      setError('Bukti transfer harus berupa JPG, PNG, atau PDF yang tidak kosong, maksimal 2 MB.'); return;
    }
    setFile(value);
  }

  async function salin() {
    setCopyError(''); setTersalin(false);
    try { await navigator.clipboard.writeText('1234567890'); setTersalin(true); }
    catch { setCopyError('Nomor rekening belum tersalin. Izinkan akses papan klip atau salin 1234567890 secara manual.'); }
  }

  const nominal = Number(jumlah);
  const valid = Boolean(bill && bill.sisa > 0 && file && Number.isSafeInteger(nominal) && nominal > 0 && nominal <= bill.sisa && bankAsal.trim() && namaPengirim.trim());

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!bill || !valid || busy || sent) return;
    setBusy(true); setError('');
    try {
      const data = new FormData();
      data.set('jumlah', String(nominal));
      data.set('metode', 'TRANSFER');
      data.set('bankAsal', bankAsal);
      data.set('namaPengirim', namaPengirim);
      if (file) data.set('bukti', file);
      if (useMock) {
        setRiwayat(items => [{ id: Date.now(), tagihanId: bill.id, metode: 'TRANSFER', jumlah: nominal, tanggal: '2026-10-26', status: 'MENUNGGU_VERIFIKASI', bankAsal, namaPengirim }, ...items]);
      } else {
        await upload(`/api/tagihan/${bill.id}/pembayaran`, data);
        get<ApiPayment[]>('/api/pembayaran/riwayat').then(l => setRiwayat(l.filter(p => String(p.tagihanId) === id))).catch(e => setHistoryError(e instanceof Error ? e.message : 'Pembayaran terkirim, tetapi riwayat belum dapat dimuat ulang.'));
      }
      setSent(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Pembayaran belum terkirim. Coba lagi.'); }
    finally { setBusy(false); }
  }

  return <div>
    <Link className="back-link" href="/user/tagihan">← Kembali ke Tagihan Saya</Link>
    <PageHead title="Pembayaran" sub={`Kirim bukti transfer untuk tagihan ${bill ? periodeLabel(bill.periode.slice(0, 7)) : 'Anda'}.`}/>
    {!loaded && <div className="info-box mb-16" role="status">Memuat tagihan…</div>}
    {loaded && !bill && <div className="form-alert" role="alert">{error || 'Tagihan tidak ditemukan. Kembali ke Tagihan Saya untuk memilih tagihan yang tersedia.'}</div>}
    <div className="col-main" style={{ alignItems: 'start' }}>
      <Card className="pembayaran">
        <h3 className="card-title mb-16">Transfer Pembayaran</h3>
        {bill && <p className="note mb-16">{bill.kosNama ?? (useMock ? kosContoh[0]?.nama ?? 'Kos' : 'Kos')} · Kamar {bill.kamarNomor} · {periodeLabel(bill.periode.slice(0, 7))}<br/>Sisa tagihan <b>{rupiah(bill.sisa)}</b></p>}
        <div className="copy-row">
          <div className="acc"><div className="bank">Bank BCA · a.n. Sri Wahyuni</div><div className="num">1234567890</div></div>
          <button type="button" className="btn btn-outline btn-sm" onClick={salin}>{tersalin ? 'Tersalin ✓' : 'Salin'}</button>
        </div>
        <div className="note mt-8" role="status">{copyError || (tersalin ? 'Nomor rekening berhasil disalin.' : '')}</div>
        <div className="info-box blue mt-16">Transfer ke rekening di atas, lalu unggah bukti pembayaran. Anda dapat membayar sebagian dari sisa tagihan.</div>
        <form onSubmit={kirim}>
          <fieldset disabled={!bill || bill.sisa <= 0 || busy || sent} style={{ border: 0, minWidth: 0 }}>
            <div className="upload-area mt-16" style={drag ? { borderColor: 'var(--teal)', background: 'var(--teal-faint)' } : undefined} onDragOver={e => { e.preventDefault(); if (!busy && !sent) setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); if (bill && bill.sisa > 0 && !busy && !sent) pilihFile(e.dataTransfer.files[0] ?? null); }}>
              <span className="big" aria-hidden="true">↑</span>
              <p><b>{file ? file.name : 'Seret dan letakkan bukti transfer di sini'}</b></p>
              <p className="note mt-8">atau pilih berkas dari perangkat Anda</p>
              <input ref={inputFile} id="bukti-transfer" type="file" aria-label="Bukti transfer" accept="image/png,image/jpeg,application/pdf" style={{ display: 'none' }} onChange={e => pilihFile(e.target.files?.[0] ?? null)}/>
              <button type="button" className="btn btn-outline btn-sm mt-8" onClick={() => inputFile.current?.click()}>{file ? 'Ganti Berkas' : 'Pilih Berkas'}</button>
              <p className="note mt-8">Format JPG/PNG/PDF, maksimal 2 MB</p>
              {file && preview && <div className="mt-16">
                {file.type === 'application/pdf' ? <div><iframe title="Pratinjau bukti transfer PDF" src={preview} style={{ width: '100%', height: 240, border: '1px solid var(--line)', borderRadius: 12 }}/><a href={preview} target="_blank" rel="noreferrer">Buka pratinjau PDF</a></div> : <img src={preview} alt="Pratinjau bukti transfer yang dipilih" style={{ maxHeight: 240, width: 'auto', margin: '0 auto', borderRadius: 12 }} onError={() => { setFile(null); setError('Gambar tidak dapat dibaca. Pilih bukti transfer JPG atau PNG yang valid.'); }}/>}<p className="note mt-8">{(file.size / 1024).toLocaleString('id-ID', { maximumFractionDigits: 0 })} KB · {sent ? 'Menunggu verifikasi' : 'Belum dikirim'}</p>
              </div>}
            </div>
            <div className="field mt-16"><label htmlFor="jumlah-bayar">Jumlah Pembayaran (Rp)</label><input id="jumlah-bayar" type="number" min={1} max={bill?.sisa} step={1} required value={jumlah} onChange={e => setJumlah(e.target.value)} inputMode="numeric"/><span className="hint">Boleh dibayar sebagian, maksimal {rupiah(bill?.sisa ?? 0)}. Sisa berkurang setelah verifikasi diterima.</span></div>
            <div className="form-grid-2">
              <div className="field"><label htmlFor="bank-pengirim">Bank Pengirim</label><input id="bank-pengirim" type="text" required value={bankAsal} onChange={e => setBankAsal(e.target.value)} placeholder="Contoh: BCA"/></div>
              <div className="field"><label htmlFor="nama-pengirim">Nama Pengirim</label><input id="nama-pengirim" type="text" required value={namaPengirim} onChange={e => setNamaPengirim(e.target.value)} placeholder="Nama di rekening pengirim"/></div>
            </div>
            <button className="btn btn-primary btn-block btn-lg" disabled={!valid}>{busy ? 'Mengirim…' : 'Kirim Pembayaran'}</button>
          </fieldset>
        </form>
        {sent && <div className="success-inline mt-16" role="status">✓ {useMock ? 'Bukti dicatat secara lokal pada demo ini; tidak dikirim ke server.' : 'Pembayaran terkirim dan menunggu verifikasi pemilik.'}</div>}
        {error && bill && <div className="form-alert mt-16" role="alert">{error}</div>}
      </Card>
      <Card>
        <h3 className="card-title">Riwayat Pembayaran</h3>
        <p className="card-sub mb-16">Pantau hasil verifikasi bukti transfer Anda.</p>
        {historyError && <div className="form-alert" role="alert">{historyError}</div>}
        {!historyError && loaded && riwayat.length === 0 && <p className="muted">Belum ada pembayaran untuk tagihan ini.</p>}
        <ul className="timeline">
          {riwayat.map(p => {
            const warna = p.status === 'DITERIMA' ? 'tl-green' : p.status === 'DITOLAK' ? 'tl-red' : 'tl-blue';
            const st = p.status === 'DITERIMA' ? { label: 'Diterima', tone: 'success' } : p.status === 'DITOLAK' ? { label: 'Ditolak', tone: 'danger' } : { label: 'Menunggu Verifikasi', tone: 'info' };
            return <li key={p.id} className={warna}>
              <div className="tl-head" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{p.metode === 'TRANSFER' ? <Landmark size={16} aria-hidden="true"/> : <Banknote size={16} aria-hidden="true"/>}{tanggalLengkap(p.tanggal)} · {p.metode === 'TRANSFER' ? `Transfer ${p.bankAsal ?? ''}` : 'Tunai'}</div>
              <div className="tl-sub" style={{ marginBottom: 6 }}>{rupiah(p.jumlah)}{bill && p.tagihanId !== bill.id ? ' · Tagihan sebelumnya' : ''}</div>
              <Badge tone={st.tone} dot>{st.label}</Badge>
              {p.catatanVerifikasi && <div className={p.status === 'DITOLAK' ? 'reason-box' : 'quote-box'} style={{ marginTop: 8 }}>Catatan pemilik: {p.catatanVerifikasi}</div>}
            </li>;
          })}
        </ul>
      </Card>
    </div>
  </div>;
}

function riwayatDemoUntukTagihan(id: number) {
  return contohRiwayat.filter(p => p.tagihanId === id || p.status === 'DITERIMA').sort((a, b) => b.tanggal.localeCompare(a.tanggal));
}
