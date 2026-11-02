'use client';
import { useEffect, useMemo, useState } from 'react';
import { Badge, PageHead } from '@/components/ui';
import { get, post } from '@/lib/api';
import { rupiah, periodeLabel, statusTagihan } from '@/lib/format';
import { useKos } from '@/components/owner/useKos';
import { DemoNotice, demoTagihan } from '@/components/owner/demo';
import type { ApiBill, ItemTagihan } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const tarif = 1500;
const angkaMeter = (value: string) => value.trim() ? Number(value.replace(',', '.')) : NaN;
const formatMeter = (value: number) => value.toLocaleString('id-ID', { useGrouping: false, minimumFractionDigits: 1, maximumFractionDigits: 1 });

function enamBulan(): string[] {
  const hasil: string[] = []; const d = new Date(2026, 9, 1);
  for (let i = 5; i >= 0; i--) { const x = new Date(d.getFullYear(), d.getMonth() - i, 1); hasil.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`); }
  return hasil;
}

export function TagihanSection() {
  const { kosId, kos, error: kosError } = useKos();
  const bulan = enamBulan();
  const [periode, setPeriode] = useState('2026-10');
  const [list, setList] = useState<ApiBill[]>(useMock ? demoTagihan : []);
  const [ok, setOk] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [meteranId, setMeteranId] = useState(''); const [awal, setAwal] = useState(''); const [akhir, setAkhir] = useState('');
  const [loading, setLoading] = useState(!useMock);

  const muat = () => {
    if (useMock) return;
    if (!kosId) { setLoading(false); return; }
    setLoading(true);
    return get<ApiBill[]>(`/api/kos/${kosId}/tagihan?periode=${periode}`).then(setList)
      .catch(e => setError(e instanceof Error ? e.message : 'Tagihan belum berhasil dimuat.')).finally(() => setLoading(false));
  };
  useEffect(() => { setError(''); setOk(''); if (!useMock) setList([]); muat(); }, [kosId, periode]);

  const tampil = useMemo(() => useMock ? list.filter(b => b.periode.slice(0, 7) === periode) : list, [list, periode]);
  const tanpaMeteran = useMemo(() => tampil.filter(b => b.meteranAkhir == null && b.status !== 'LUNAS'), [tampil]);
  useEffect(() => {
    const b = tanpaMeteran[0];
    setMeteranId(b ? String(b.id) : '');
    setAwal(b ? formatMeter(b.meteranAwal ?? 0) : '');
    setAkhir(b && useMock ? formatMeter((b.meteranAwal ?? 0) + 62.5) : '');
  }, [tanpaMeteran]);

  const meterAwal = angkaMeter(awal); const meterAkhir = angkaMeter(akhir);
  const meterValid = Number.isFinite(meterAwal) && Number.isFinite(meterAkhir) && meterAwal >= 0 && meterAkhir >= meterAwal;
  const pakai = meterValid ? Math.round((meterAkhir - meterAwal) * 1000) / 1000 : 0;

  async function terbitkan() {
    if (!kosId || busy || loading) return;
    setBusy(true); setError(''); setOk('');
    try {
      if (useMock) {
        if (tampil.length) { setOk(`Tagihan ${periodeLabel(periode)} sudah tersedia dalam demo. Tidak ada tagihan ganda dibuat.`); return; }
        const [tahun, bulan] = periode.split('-').map(Number);
        const jatuhTempo = `${tahun}-${String(bulan).padStart(2, '0')}-${String(kos?.tanggalJatuhTempo ?? 5).padStart(2, '0')}`;
        const firstId = Math.max(0, ...list.map(b => b.id)) + 1;
        const baru = demoTagihan.map((b, i): ApiBill => ({ ...b, id: firstId + i, periode, jatuhTempo, terbayar: 0, denda: 0, total: b.items.reduce((sum, item) => sum + item.subtotal, 0), sisa: b.items.reduce((sum, item) => sum + item.subtotal, 0), status: 'BELUM_BAYAR', meteranAkhir: null }));
        setList(prev => [...prev, ...baru]); setOk(`${baru.length} tagihan diterbitkan dalam demo untuk ${periodeLabel(periode)}.`);
      } else {
        const baru = await post<ApiBill[]>(`/api/kos/${kosId}/tagihan/terbitkan?periode=${periode}`);
        setOk(`${baru.length} tagihan diterbitkan untuk ${periodeLabel(periode)}.`); await muat();
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menerbitkan tagihan.'); } finally { setBusy(false); }
  }
  async function simpanMeteran() {
    if (busy || !meteranId || !tanpaMeteran.some(b => String(b.id) === meteranId)) return;
    setError(''); setOk('');
    if (!meterValid) { setError('Isi angka meteran yang valid. Meteran akhir tidak boleh lebih kecil dari meteran awal.'); return; }
    setBusy(true);
    try {
      if (!useMock) await post(`/api/tagihan/${meteranId}/meteran`, { meteranAwal: meterAwal, meteranAkhir: meterAkhir });
      else setList(prev => prev.map(b => {
        if (String(b.id) !== meteranId) return b;
        const lama = b.items.filter(item => item.jenis === 'PEMAKAIAN' && item.keterangan.toLowerCase().includes('listrik'));
        const listrik: ItemTagihan = { jenis: 'PEMAKAIAN', keterangan: 'Listrik', subtotal: pakai * tarif, meteranAwal: meterAwal, meteranAkhir: meterAkhir, tarifPerUnit: tarif, satuan: 'kWh' };
        const total = b.total - lama.reduce((sum, item) => sum + item.subtotal, 0) + listrik.subtotal;
        const sisa = Math.max(0, total - b.terbayar);
        return { ...b, meteranAwal: meterAwal, meteranAkhir: meterAkhir, items: [...b.items.filter(item => !lama.includes(item)), listrik], total, sisa, status: sisa === 0 ? 'LUNAS' : b.status };
      }));
      setOk(useMock ? 'Meteran dan biaya listrik diperbarui dalam demo.' : 'Meteran tersimpan dan biaya listrik diperbarui.'); await muat();
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan meteran.'); } finally { setBusy(false); }
  }

  return <div>
    <PageHead title="Kelola Tagihan" sub="Terbitkan tagihan bulanan dan input meteran listrik."
      action={<button className="btn btn-primary" disabled={busy || loading || !kosId} onClick={terbitkan}>Terbitkan Tagihan Bulan Ini</button>}/>
    <DemoNotice/>
    <div className="select-row" style={{ marginBottom: 14 }}><label className="note" htmlFor="periode-tagihan">Periode:</label><select id="periode-tagihan" value={periode} disabled={busy} onChange={e => setPeriode(e.target.value)}>{bulan.map(b => <option key={b} value={b}>{periodeLabel(b)}</option>)}</select></div>
    {ok && <div className="success-inline" role="status">✅ {ok}</div>}
    {(error || kosError) && <div className="form-alert" role="alert">{error || kosError}</div>}
    <section className="card card-pad mb-24">
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th>User</th><th>Kamar</th><th>Periode</th><th>Total</th><th>Denda</th><th>Sisa</th><th>Status</th></tr></thead>
        <tbody>
          {tampil.map(b => { const st = statusTagihan[b.status] ?? { label: b.status, tone: 'muted' }; return <tr key={b.id}>
            <td className="bold">{b.penyewaNama ?? 'User'}</td><td>Kamar {b.kamarNomor}</td><td>{periodeLabel(b.periode.slice(0, 7))}</td>
            <td className="num">{rupiah(b.total)}</td><td className="num">{rupiah(b.denda)}</td><td className="num">{rupiah(b.sisa)}</td>
            <td><Badge tone={st.tone} dot>{st.label}</Badge></td>
          </tr>; })}
          {tampil.length === 0 && <tr><td colSpan={7} className="muted">{loading ? 'Memuat tagihan…' : error || kosError ? 'Tagihan belum berhasil dimuat.' : 'Belum ada tagihan pada periode ini.'}</td></tr>}
        </tbody>
      </table></div>
    </section>
    <section className="card card-pad">
      <div className="card-head"><div><h3 className="card-title">⚡ Input Meteran Listrik</h3><p className="card-sub">Hitung biaya listrik dari pembacaan meteran.</p></div></div>
      {tanpaMeteran.length === 0 ? <p className="muted">{loading ? 'Memuat meteran…' : tampil.length ? 'Semua meteran periode ini sudah dicatat.' : 'Terbitkan tagihan terlebih dahulu untuk mencatat meteran.'}</p> : <form onSubmit={e => { e.preventDefault(); simpanMeteran(); }}>
        <div className="select-row" style={{ margin: '12px 0' }}>
          <label className="note" htmlFor="tagihan-meteran">Tagihan:</label>
          <select id="tagihan-meteran" value={meteranId} disabled={busy} onChange={e => { setMeteranId(e.target.value); const b = tanpaMeteran.find(x => String(x.id) === e.target.value); if (b) { setAwal(formatMeter(b.meteranAwal ?? 0)); setAkhir(useMock ? formatMeter((b.meteranAwal ?? 0) + 62.5) : ''); } }}>
            {tanpaMeteran.map(b => <option key={b.id} value={b.id}>{b.penyewaNama ?? 'User'} — Kamar {b.kamarNomor} · {periodeLabel(b.periode.slice(0, 7))}</option>)}
          </select>
        </div>
        <div className="form-grid-2" style={{ maxWidth: 560 }}>
          <div className="field"><label htmlFor="meteran-awal">Meteran Awal (kWh)</label><input id="meteran-awal" type="text" required disabled={busy} value={awal} inputMode="decimal" onChange={e => setAwal(e.target.value)} placeholder="1240,0"/></div>
          <div className="field"><label htmlFor="meteran-akhir">Meteran Akhir (kWh)</label><input id="meteran-akhir" type="text" required disabled={busy} value={akhir} inputMode="decimal" onChange={e => setAkhir(e.target.value)} placeholder="1302,5"/></div>
        </div>
        <p className="note">Tarif listrik: {rupiah(tarif)} per kWh</p>
        {awal && akhir && !meterValid && <p className="note" role="alert">Meteran harus berupa angka positif dan meteran akhir tidak boleh lebih kecil dari meteran awal.</p>}
        <div className="meter-preview" aria-live="polite">Pemakaian {pakai.toLocaleString('id-ID', { maximumFractionDigits: 3 })} kWh x {rupiah(tarif)} = {rupiah(pakai * tarif)}</div>
        <button type="submit" className="btn btn-primary mt-16" disabled={busy || !meteranId || !meterValid}>Simpan</button>
      </form>}
      <p className="note mt-16">{kos ? `Jatuh tempo tagihan: tanggal ${kos.tanggalJatuhTempo} setiap bulan.` : ''}</p>
    </section>
  </div>;
}
