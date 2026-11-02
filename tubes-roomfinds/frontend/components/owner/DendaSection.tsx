'use client';
import { useEffect, useState } from 'react';
import { PageHead } from '@/components/ui';
import { put } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { useKos } from '@/components/owner/useKos';
import { DemoNotice } from '@/components/owner/demo';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export function DendaSection() {
  const { kosList, kosId, setKosId, kos, error: kosError } = useKos();
  const [jenis, setJenis] = useState<'HARIAN' | 'FLAT' | 'TANPA'>('HARIAN');
  const [nominalPerHari, setNominalPerHari] = useState('10000');
  const [nominal, setNominal] = useState('50000');
  const [masaTenggang, setMasaTenggang] = useState('3');
  const [batasMaksimal, setBatasMaksimal] = useState('100000');
  const [ok, setOk] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!kos?.aturanDenda) return;
    const a = kos.aturanDenda as { jenis?: string; nominalPerHari?: number; nominal?: number; masaTenggang?: number; batasMaksimal?: number };
    setJenis((a.jenis as 'HARIAN' | 'FLAT' | 'TANPA') ?? 'HARIAN');
    if (a.nominalPerHari != null) setNominalPerHari(String(a.nominalPerHari));
    if (a.nominal != null) setNominal(String(a.nominal));
    setMasaTenggang(String(a.masaTenggang ?? 3));
    if (a.batasMaksimal != null) setBatasMaksimal(String(a.batasMaksimal));
  }, [kos]);

  const pratinjau = jenis === 'HARIAN' ? `Penyewa yang terlambat lebih dari ${masaTenggang} hari akan dikenakan denda ${rupiah(Number(nominalPerHari) || 0)} per hari, maksimal ${rupiah(Number(batasMaksimal) || 0)}`
    : jenis === 'FLAT' ? `Penyewa yang terlambat lebih dari ${masaTenggang} hari dikenakan denda tetap ${rupiah(Number(nominal) || 0)}.`
    : 'Kos ini tidak memberlakukan denda keterlambatan.';

  async function simpan() {
    if (!kos || busy) return;
    setError(''); setOk('');
    const validNominal = (nilai: string) => nilai.trim() !== '' && Number.isFinite(Number(nilai)) && Number(nilai) > 0;
    if (jenis !== 'TANPA' && (!validNominal(jenis === 'HARIAN' ? nominalPerHari : nominal) || !masaTenggang.trim() || !Number.isInteger(Number(masaTenggang)) || Number(masaTenggang) < 0 || (jenis === 'HARIAN' && (!validNominal(batasMaksimal) || Number(batasMaksimal) < Number(nominalPerHari))))) {
      setError('Isi nominal positif, masa tenggang berupa bilangan bulat minimal 0, dan batas maksimal minimal sebesar denda harian.'); return;
    }
    setBusy(true);
    const body = jenis === 'HARIAN' ? { jenis, nominalPerHari: Number(nominalPerHari) || 0, masaTenggang: Number(masaTenggang) || 0, batasMaksimal: Number(batasMaksimal) || 0 }
      : jenis === 'FLAT' ? { jenis, nominal: Number(nominal) || 0, masaTenggang: Number(masaTenggang) || 0 }
      : { jenis, masaTenggang: 0 };
    try { if (!useMock) await put(`/api/kos/${kos.id}/aturan-denda`, body); setOk(useMock ? 'Aturan denda diperbarui dalam demo.' : 'Aturan denda tersimpan.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan aturan denda.'); } finally { setBusy(false); }
  }

  return <div>
    <PageHead title="Pengaturan Aturan Denda" sub="Tentukan sanksi keterlambatan untuk kos Anda."/>
    <DemoNotice/>
    {kosError && <div className="form-alert" role="alert">{kosError}</div>}
    <div className="select-row" style={{ marginBottom: 14 }}><label className="note" htmlFor="kos-denda">Terapkan untuk kos:</label><select id="kos-denda" value={kosId ?? ''} disabled={busy || !kosList.length} onChange={e => setKosId(Number(e.target.value))}>{!kosList.length && <option value="">Belum ada data kos</option>}{kosList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</select></div>
    {ok && <div className="success-inline">✅ {ok}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}
    <section className="card card-pad mb-24">
      <h3 className="card-title mb-16">Jenis Denda</h3>
      <div className="radio-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {([['HARIAN', 'Denda Harian', 'Denda per hari keterlambatan'], ['FLAT', 'Denda Flat', 'Sekali bayar nominal tetap'], ['TANPA', 'Tanpa Denda', 'Tanpa sanksi keterlambatan']] as const).map(([nilai, judul, sub]) => (
          <label key={nilai} className={`radio-card${jenis === nilai ? ' selected' : ''}`}>
            <input type="radio" name="jenis-denda" value={nilai} checked={jenis === nilai} disabled={busy} onChange={() => setJenis(nilai)}/>
            <div className="rc-title">{judul}</div>
            <div className="rc-sub">{sub}</div>
          </label>
        ))}
      </div>
    </section>
    <section className="card card-pad">
      <h3 className="card-title mb-16">Parameter Denda</h3>
      <div className="form-grid-3">
        {jenis !== 'TANPA' && <div className="field"><label>{jenis === 'HARIAN' ? 'Nominal Denda per Hari' : 'Nominal Denda'}</label><input type="number" min={1} aria-label="Nominal Denda" value={jenis === 'HARIAN' ? nominalPerHari : nominal} inputMode="numeric" onChange={e => (jenis === 'HARIAN' ? setNominalPerHari : setNominal)(e.target.value)}/></div>}
        {jenis !== 'TANPA' && <div className="field"><label>Masa Tenggang (hari)</label><input type="number" min={0} step={1} aria-label="Masa Tenggang" value={masaTenggang} onChange={e => setMasaTenggang(e.target.value)}/><span className="hint">Hari sebelum denda berlaku.</span></div>}
        {jenis === 'HARIAN' && <div className="field"><label>Batas Maksimal Denda</label><input type="number" min={1} aria-label="Batas Maksimal Denda" value={batasMaksimal} inputMode="numeric" onChange={e => setBatasMaksimal(e.target.value)}/></div>}
      </div>
      <div className="info-box" style={{ margin: '14px 0 18px' }}>📢 <span>Pratinjau: {pratinjau}</span></div>
      <button className="btn btn-primary" disabled={busy || !kos} onClick={simpan}>Simpan Aturan</button>
      <p className="note mt-8">Perubahan hanya berlaku untuk tagihan yang diterbitkan setelah aturan disimpan.</p>
    </section>
  </div>;
}
