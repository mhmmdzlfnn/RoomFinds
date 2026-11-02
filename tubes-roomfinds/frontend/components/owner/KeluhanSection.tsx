'use client';
import { useEffect, useState } from 'react';
import { Badge, PageHead } from '@/components/ui';
import { get, patch } from '@/lib/api';
import { tanggal, statusKeluhan } from '@/lib/format';
import { useKos } from '@/components/owner/useKos';
import { DemoNotice } from '@/components/owner/demo';
import type { ApiComplaint } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const mock: ApiComplaint[] = [
  { id: 1, kategori: 'Listrik', deskripsi: 'Lampu kamar mati sejak semalam.', status: 'DILAPORKAN', dibuatPada: '2026-10-26', diperbaruiPada: '2026-10-26', kamarNomor: '204', penyewaNama: 'Zulfan' },
  { id: 2, kategori: 'Air', deskripsi: 'Keran kamar mandi bocor.', status: 'DIPROSES', tanggapanPemilik: 'Terima kasih, tukang akan datang Rabu pagi.', dibuatPada: '2026-10-18', diperbaruiPada: '2026-10-19', kamarNomor: '102', penyewaNama: 'Rina Aulia' },
  { id: 3, kategori: 'Internet', deskripsi: 'WiFi sering putus di kamar belakang.', status: 'SELESAI', tanggapanPemilik: 'Router baru sudah dipasang, mohon coba kembali.', dibuatPada: '2026-09-02', diperbaruiPada: '2026-09-04', kamarNomor: '305', penyewaNama: 'Dimas Pratama' },
];
const TAB = ['Semua', 'Dilaporkan', 'Diproses', 'Selesai'];

export function KeluhanSection() {
  const { kosId, error: kosError } = useKos();
  const [list, setList] = useState<ApiComplaint[]>(useMock ? mock : []);
  const [tab, setTab] = useState('Semua');
  const [tanggapan, setTanggapan] = useState<Record<number, string>>({});
  const [ok, setOk] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  const muat = () => { if (useMock || !kosId) return; get<ApiComplaint[]>(`/api/kos/${kosId}/keluhan`).then(setList).catch(e => setError(e instanceof Error ? e.message : 'Keluhan belum berhasil dimuat.')); };
  useEffect(() => { muat(); }, [kosId]);

  async function proses(id: number, status: 'DIPROSES' | 'SELESAI') {
    if (busy) return;
    setBusy(true); setError(''); setOk('');
    const tanggapanPemilik = (tanggapan[id] ?? list.find(q => q.id === id)?.tanggapanPemilik ?? '').trim();
    try {
      if (!useMock) await patch(`/api/keluhan/${id}/status`, { status, tanggapanPemilik });
      else setList(list => list.map(q => q.id === id ? { ...q, status, tanggapanPemilik, diperbaruiPada: new Date().toISOString() } : q));
      setOk(useMock ? 'Status dan tanggapan keluhan diperbarui dalam demo.' : 'Status keluhan diperbarui.'); muat();
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal memperbarui keluhan.'); } finally { setBusy(false); }
  }

  const tampil = list.filter(q => tab === 'Semua' || statusKeluhan[q.status]?.label === tab);

  return <div>
    <PageHead title="Kelola Keluhan" sub="Tanggapi dan selesaikan laporan User."/>
    <DemoNotice/>
    {kosError && <div className="form-alert" role="alert">{kosError}</div>}
    {ok && <div className="success-inline">✅ {ok}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}
    <div className="filter-tabs" style={{ margin: '10px 0 18px' }}>{TAB.map(t => <a key={t} href="#" onClick={e => { e.preventDefault(); setTab(t); }} aria-current={tab === t ? 'page' : undefined} className={tab === t ? 'active' : ''}>{t}</a>)}</div>
    <div className="stack">
      {tampil.map(q => {
        const st = statusKeluhan[q.status] ?? { label: q.status, tone: 'muted' };
        return <section className="card card-pad" key={q.id}>
          <div className="card-head"><div><h3 className="card-title">{q.penyewaNama ?? 'User'} — Kamar {q.kamarNomor}</h3><p className="card-sub">{q.kategori.charAt(0) + q.kategori.slice(1).toLowerCase()} · {tanggal(q.dibuatPada)}</p></div><Badge tone={st.tone} dot>{st.label}</Badge></div>
          <p>{q.deskripsi}</p>
          {q.status === 'SELESAI' ? (q.tanggapanPemilik ? <div className="quote-box mt-16">Tanggapan pemilik: {q.tanggapanPemilik}</div> : null) : <>
            <div className="field" style={{ marginTop: 12 }}><label htmlFor={`tanggapan-${q.id}`}>Tanggapan Pemilik</label><textarea id={`tanggapan-${q.id}`} disabled={busy} rows={2} value={tanggapan[q.id] ?? q.tanggapanPemilik ?? ''} onChange={e => setTanggapan({ ...tanggapan, [q.id]: e.target.value })} placeholder="Tulis tanggapan untuk User…"/></div>
            <button className="btn btn-primary" disabled={busy} onClick={() => proses(q.id, q.status === 'DILAPORKAN' ? 'DIPROSES' : 'SELESAI')}>{q.status === 'DILAPORKAN' ? 'Proses' : 'Selesaikan'}</button>
          </>}
        </section>;
      })}
      {tampil.length === 0 && <section className="card card-pad center muted">Tidak ada keluhan pada filter ini.</section>}
    </div>
  </div>;
}
