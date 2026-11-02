'use client';
import { useEffect, useState } from 'react';
import { Badge, PageHead } from '@/components/ui';
import { del, get, post } from '@/lib/api';
import { statusKeluhan } from '@/lib/format';
import { tanggalLengkap } from '@/app/user/format';
import { keluhanContoh, kosContoh, tagihanAktif } from '@/lib/mock';
import type { ApiBooking, ApiComplaint } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const KATEGORI = ['Listrik', 'Air', 'Internet', 'Kebersihan', 'Fasilitas', 'Lainnya'];
const mock: ApiComplaint[] = keluhanContoh.filter(k => k.penyewaNama === 'Budi Santoso').map(k => ({ id: k.id, kategori: k.kategori, deskripsi: k.deskripsi, status: k.status, tanggapanPemilik: k.tanggapanPemilik, dibuatPada: k.dibuatPada, diperbaruiPada: k.diperbaruiPada, kamarNomor: k.kamarNomor }));
if (!mock.some(k => k.status === 'SELESAI')) mock.push({ id: -1, kategori: 'AIR', deskripsi: 'Keran kamar mandi bocor dan aliran air kecil.', status: 'SELESAI', tanggapanPemilik: 'Keran sudah diganti dan aliran air kembali normal. Silakan kabari jika ada kendala lagi.', dibuatPada: '2026-10-18', diperbaruiPada: '2026-10-20', kamarNomor: tagihanAktif.kamarNomor });

export default function KeluhanSaya() {
  const [list, setList] = useState<ApiComplaint[]>(useMock ? mock : []);
  const [loaded, setLoaded] = useState(useMock);
  const [kategori, setKategori] = useState('Listrik'); const [deskripsi, setDeskripsi] = useState('');
  const [kamar, setKamar] = useState(useMock ? `${kosContoh[0]?.nama ?? 'Kos Melati Putri'} — Kamar ${tagihanAktif.kamarNomor}` : '');
  const [kamarError, setKamarError] = useState('');
  const [ok, setOk] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [hapusId, setHapusId] = useState<number | null>(null);

  const muat = () => { if (useMock) return; get<ApiComplaint[]>('/api/keluhan').then(setList).catch(e => setError(e instanceof Error ? e.message : 'Keluhan belum berhasil dimuat.')).finally(() => setLoaded(true)); };
  useEffect(() => {
      muat();
      if (useMock) return;
      get<ApiBooking[]>('/api/booking/saya').then(items => {
        const aktif = items.find(b => b.status === 'DISETUJUI');
        setKamar(aktif ? `${aktif.kosNama} — Kamar ${aktif.kamarNomor}` : '');
        if (!aktif) setKamarError('Belum ada kamar dari booking yang disetujui. Keluhan dapat dikirim setelah Anda memiliki kamar aktif.');
      }).catch(e => setKamarError(e instanceof Error ? e.message : 'Kamar aktif belum berhasil dimuat.'));
    }, []);

  async function kirim(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!deskripsi.trim() || !kamar || busy) return;
    setBusy(true); setError(''); setOk('');
    try {
      if (!useMock) await post('/api/keluhan', { kategori: kategori.toUpperCase(), deskripsi });
      else setList(items => [{ id: Date.now(), kategori: kategori.toUpperCase(), deskripsi, status: 'DILAPORKAN', dibuatPada: '2026-10-26', diperbaruiPada: '2026-10-26', kamarNomor: tagihanAktif.kamarNomor }, ...items]);
      setOk(useMock ? 'Laporan ditambahkan secara lokal pada demo ini, tanpa dikirim ke server.' : 'Laporan Anda sudah dikirim ke pemilik kos.'); setDeskripsi(''); muat();
    } catch (e) { setError(e instanceof Error ? e.message : 'Laporan belum terkirim.'); } finally { setBusy(false); }
  }

  async function hapus(id: number) {
    if (hapusId !== null || list.find(q => q.id === id)?.status !== 'DILAPORKAN') return;
    if (!window.confirm('Hapus laporan keluhan ini?')) return;
    setError(''); setOk(''); setHapusId(id);
    try { if (!useMock) await del(`/api/keluhan/${id}`); setList(items => items.filter(q => q.id !== id)); setOk(useMock ? 'Laporan dihapus dari demo ini saja.' : 'Laporan keluhan berhasil dihapus.'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Keluhan tidak dapat dihapus setelah mulai diproses.'); }
    finally { setHapusId(null); }
  }

  return <div>
    <PageHead title="Keluhan Saya" sub="Laporkan masalah kamar dan pantau penanganannya."/>
    {ok && <div className="success-inline" role="status">✓ {ok}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}
    <div className="col-main" style={{ alignItems: 'start' }}>
      <section className="card card-pad">
        <h3 className="card-title mb-16">Buat Laporan Keluhan</h3>
        <form onSubmit={kirim}>
          <div className="field"><label htmlFor="keluhan-kamar">Kamar</label><input id="keluhan-kamar" type="text" disabled value={kamar || (kamarError ? 'Kamar belum tersedia' : 'Memuat kamar…')}/><span className="hint">Laporan otomatis terhubung dengan kamar aktif Anda.</span></div>
          {kamarError && <div className="form-alert" role="alert">{kamarError}</div>}
          <div className="field"><label htmlFor="keluhan-kategori">Kategori</label><select id="keluhan-kategori" value={kategori} disabled={busy} onChange={e => setKategori(e.target.value)}>{KATEGORI.map(k => <option key={k}>{k}</option>)}</select></div>
          <div className="field"><label htmlFor="keluhan-deskripsi">Deskripsi Keluhan</label><textarea id="keluhan-deskripsi" rows={5} required value={deskripsi} disabled={busy} onChange={e => setDeskripsi(e.target.value)} placeholder="Contoh: Lampu kamar mati sejak semalam"/><span className="hint">Jelaskan masalah, lokasi, dan sejak kapan kendala terjadi.</span></div>
          <button className="btn btn-primary" disabled={busy || !deskripsi.trim() || !kamar}>{busy ? 'Mengirim…' : 'Kirim Laporan'}</button>
        </form>
        <div className="info-box mt-16">Pemilik kos akan menerima laporan dan memperbarui status penanganan di halaman ini.</div>
      </section>
      <div className="stack">
        <h3 className="card-title">Riwayat Keluhan</h3>
        {!loaded && <div className="info-box" role="status">Memuat riwayat keluhan…</div>}
        {list.map(q => {
          const st = statusKeluhan[q.status] ?? { label: q.status, tone: 'muted' };
          const tahap = q.status === 'DILAPORKAN' ? 0 : q.status === 'DIPROSES' ? 1 : 2;
          return <section className="card card-pad" key={q.id}>
            <div className="card-head"><div><Badge tone="slate">{q.kategori.charAt(0).toUpperCase() + q.kategori.slice(1).toLowerCase()}</Badge> <span className="muted small">{tanggalLengkap(q.dibuatPada)}</span></div><Badge tone={st.tone} dot>{st.label}</Badge></div>
            <p style={{ fontSize: 14.5 }}>{q.deskripsi}</p>
            <div className="steps" aria-label={`Progres keluhan: ${st.label}`}>
              {['Dilaporkan', 'Diproses', 'Selesai'].map((label, i) => <div key={label} className={`step${i < tahap ? ' done' : i === tahap ? ' done current' : ''}`}><span className="step-dot">{i < tahap || i === tahap ? '✓' : ''}</span><span className="step-lbl">{label}</span></div>)}
            </div>
            {q.tanggapanPemilik && <div className="quote-box mt-16">Tanggapan pemilik: “{q.tanggapanPemilik}”</div>}
            {q.status === 'DILAPORKAN' && <div className="booking-foot"><button className="btn btn-danger-outline btn-sm" disabled={hapusId !== null} onClick={() => hapus(q.id)}>{hapusId === q.id ? 'Menghapus…' : 'Hapus'}</button><span className="note">Hanya bisa dihapus selama status masih Dilaporkan.</span></div>}
          </section>;
        })}
        {loaded && list.length === 0 && <section className="card card-pad center muted">Belum ada keluhan. Laporkan masalah lewat formulir di samping.</section>}
      </div>
    </div>
  </div>;
}
