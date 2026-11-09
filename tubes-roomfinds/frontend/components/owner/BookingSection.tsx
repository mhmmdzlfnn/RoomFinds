'use client';
import { useEffect, useState } from 'react';
import { Check, CheckCircle2, Info, X } from 'lucide-react';
import { Badge } from '@/components/ui';
import { get, patch } from '@/lib/api';
import { rupiah, tanggal, statusBooking } from '@/lib/format';
import { fotoFigmaBooking } from '@/lib/gambar';
import { FotoKamar } from '@/components/FotoKamar';
import { useKos } from '@/components/owner/useKos';
import { demoTagihan } from '@/components/owner/demo';
import type { ApiBill, ApiOwnerBooking } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const mock: ApiOwnerBooking[] = [{ id: 3, tanggalMasuk: '2026-11-01', tanggalSelesai: '2027-05-01', totalSewa: 8550000, status: 'MENUNGGU', waktuSetujuAturan: '2026-10-20T14:32:00', kamarNomor: '204', tipe: 'EKSKLUSIF', kosNama: 'Kos Melati Putri', paketNama: 'Semesteran', penyewaNama: 'Zulfan', email: 'zulfan@email.com', noHp: '081234567890' },
  { id: 4, tanggalMasuk: '2026-11-01', tanggalSelesai: '2026-12-01', totalSewa: 1250000, status: 'MENUNGGU', waktuSetujuAturan: '2026-10-21T09:15:00', kamarNomor: '102', tipe: 'STANDAR', kosNama: 'Kos Melati Putri', paketNama: 'Bulanan', penyewaNama: 'Nabila Putri', email: 'nabila.putri@email.com', noHp: '081234567893' },
  { id: 1, tanggalMasuk: '2026-05-01', tanggalSelesai: '2026-11-01', totalSewa: 7500000, status: 'DISETUJUI', waktuSetujuAturan: '2026-04-25T10:00:00', kamarNomor: '102', tipe: 'STANDAR', kosNama: 'Kos Melati Putri', paketNama: 'Semesteran', penyewaNama: 'Rina Aulia', email: 'rina.aulia@email.com', noHp: '081234567891' },
  { id: 2, tanggalMasuk: '2026-10-01', tanggalSelesai: '2026-11-01', totalSewa: 2100000, status: 'DISETUJUI', waktuSetujuAturan: '2026-09-25T10:15:00', kamarNomor: '305', tipe: 'EKSKLUSIF', kosNama: 'Kos Melati Putri', paketNama: 'Bulanan', penyewaNama: 'Dimas Pratama', email: 'dimas.pratama@email.com', noHp: '081234567892' },
];
const waktuPersetujuan = (value: string) => `${tanggal(value)}, ${new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.')}`;

export function BookingSection() {
  const { kosId, error: kosError } = useKos();
  const [list, setList] = useState<ApiOwnerBooking[]>(useMock ? mock : []);
  const [bills, setBills] = useState<ApiBill[]>(useMock ? demoTagihan : []);
  const [billsLoaded, setBillsLoaded] = useState(useMock);
  const [tolakId, setTolakId] = useState<number | null>(null);
  const [alasan, setAlasan] = useState('');
  const [ok, setOk] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  const muat = () => { if (useMock || !kosId) return; get<ApiOwnerBooking[]>(`/api/kos/${kosId}/booking`).then(setList).catch(e => setError(e instanceof Error ? e.message : 'Booking belum berhasil dimuat.')); };
  useEffect(() => {
    muat();
    if (useMock || !kosId) return;
    let active = true;
    setBillsLoaded(false); setBills([]);
    get<ApiBill[]>(`/api/kos/${kosId}/tagihan?periode=2026-10`).then(data => { if (active) { setBills(data); setBillsLoaded(true); } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Tagihan belum berhasil dimuat. Check-out dinonaktifkan sementara.'); });
    return () => { active = false; };
  }, [kosId]);

  const belumLunas = (id: number) => bills.some(b => b.bookingId === id && b.sisa > 0 && b.status !== 'LUNAS');
  async function aksi(b: ApiOwnerBooking, tindakan: 'konfirmasi' | 'tolak' | 'checkout') {
    if (busy || (tindakan === 'tolak' && !alasan.trim()) || (tindakan === 'checkout' && (!billsLoaded || belumLunas(b.id)))) return;
    setBusy(true); setError(''); setOk('');
    try {
      if (!useMock) await patch(`/api/booking/${b.id}/${tindakan}`, tindakan === 'tolak' ? { alasan: alasan.trim() } : undefined);
      else setList(list => list.map(x => x.id === b.id ? { ...x, status: tindakan === 'konfirmasi' ? 'DISETUJUI' : tindakan === 'tolak' ? 'DITOLAK' : 'SELESAI', ...(tindakan === 'tolak' ? { alasanTolak: alasan.trim() } : {}) } : x));
      const pesan = tindakan === 'konfirmasi' ? 'Booking disetujui' : tindakan === 'tolak' ? 'Booking ditolak' : 'Check-out selesai';
      setOk(`${pesan}${useMock ? ' dalam demo' : ''}.`); setTolakId(null); setAlasan(''); muat();
    } catch (e) { setError(e instanceof Error ? e.message : 'Aksi belum berhasil.'); } finally { setBusy(false); }
  }

  const menunggu = list.filter(b => b.status === 'MENUNGGU');
  const aktif = list.filter(b => b.status === 'DISETUJUI');
  const riwayat = list.filter(b => b.status !== 'MENUNGGU' && b.status !== 'DISETUJUI');

  const inisial = (nama: string) => nama.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();

  return <div className="fx-bk">
    <header className="fx-bk-head">
      <h1>Booking Masuk</h1>
      <p>Tinjau permintaan booking dan pantau user yang sedang aktif.</p>
      {useMock && <p className="fx-bk-demo">Mode demo: perubahan hanya berlaku selama halaman ini dibuka, tidak dikirim ke server.</p>}
    </header>
    {kosError && <div className="form-alert" role="alert">{kosError}</div>}
    {ok && <div className="success-inline" role="status">✅ {ok}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}

    <section>
      <div className="fx-bk-sec">
        <h2>Permintaan Booking</h2>
        {menunggu.length > 0 && <span className="fx-bk-count">{menunggu.length} Permintaan</span>}
      </div>
      {menunggu.length === 0 && <p className="fx-bk-empty">Tidak ada permintaan booking menunggu persetujuan.</p>}
      <div className="fx-bk-list">
        {menunggu.map(b => <article className="fx-bk-card" key={b.id}>
          <div className="fx-bk-photo"><FotoKamar src={fotoFigmaBooking(b.kamarNomor, b.totalSewa, b.paketNama, b.id)} alt={`Kamar ${b.kamarNomor}`}/></div>
          <div className="fx-bk-body">
            <div className="fx-bk-top">
              <span className="fx-bk-avatar" aria-label={`Avatar ${b.penyewaNama}`}>{inisial(b.penyewaNama)}</span>
              <h3>{b.penyewaNama}</h3>
              <span className="fx-bk-status"><i aria-hidden="true"/>Menunggu</span>
            </div>
            <p className="fx-bk-meta">Kamar: <b>Kamar {b.kamarNomor} {b.tipe === 'EKSKLUSIF' ? 'Eksklusif' : 'Standar'}</b>, Paket: <b>{b.paketNama}</b>, Mulai tinggal: <b>{tanggal(b.tanggalMasuk)}</b>, Total: <b>{rupiah(b.totalSewa)}</b></p>
            <p className="fx-bk-contact">{b.noHp} · {b.email}</p>
            {b.waktuSetujuAturan && <div className="fx-bk-proof"><CheckCircle2 size={15} aria-hidden="true"/>Aturan kos disetujui penyewa pada {waktuPersetujuan(b.waktuSetujuAturan)}</div>}
            <div className="fx-bk-actions">
              <button type="button" className="fx-bk-yes" disabled={busy} onClick={() => aksi(b, 'konfirmasi')}><Check size={15} strokeWidth={3} aria-hidden="true"/>Setujui</button>
              <button type="button" className="fx-bk-no" disabled={busy} onClick={() => { setTolakId(tolakId === b.id ? null : b.id); setAlasan(''); }}><X size={15} strokeWidth={3} aria-hidden="true"/>Tolak</button>
            </div>
            {tolakId === b.id && <div className="fx-bk-reject">
              <label htmlFor={`alasan-${b.id}`}>Alasan penolakan (wajib)</label>
              <textarea id={`alasan-${b.id}`} required rows={2} value={alasan} onChange={e => setAlasan(e.target.value)} placeholder="Jelaskan alasan penolakan kepada User…"/>
              <button type="button" className="fx-bk-send" disabled={busy || !alasan.trim()} onClick={() => aksi(b, 'tolak')}>Kirim Penolakan</button>
            </div>}
          </div>
        </article>)}
      </div>
    </section>

    <section>
      <div className="fx-bk-sec"><h2>User Aktif</h2></div>
      <div className="fx-bk-table-card">
        {aktif.length === 0 ? <p className="fx-bk-empty" style={{ padding: 24 }}>Belum ada User aktif.</p> : <div className="table-wrap"><table className="fx-bk-table">
          <thead><tr><th>USER</th><th>KAMAR</th><th>PAKET</th><th>BERAKHIR PADA</th><th>AKSI</th></tr></thead>
          <tbody>
            {aktif.map((b, i) => <tr key={b.id}>
              <td><div className="fx-bk-user"><span className={`fx-bk-avatar-sm${i % 2 ? ' alt' : ''}`}>{inisial(b.penyewaNama)}</span><div><b>{b.penyewaNama}</b><small>{b.email}</small></div></div></td>
              <td><b>Kamar {b.kamarNomor}</b></td>
              <td><span className={`fx-bk-paket${b.paketNama.toLowerCase().startsWith('semes') ? ' sem' : ''}`}>{b.paketNama}</span></td>
              <td>{tanggal(b.tanggalSelesai)}</td>
              <td><button type="button" className="fx-bk-checkout" disabled={busy || !billsLoaded || belumLunas(b.id)} title={belumLunas(b.id) ? 'User masih memiliki tagihan belum lunas' : !billsLoaded ? 'Menunggu pemeriksaan tagihan' : 'Selesaikan masa tinggal'} onClick={() => aksi(b, 'checkout')}>Check Out</button></td>
            </tr>)}
          </tbody>
        </table></div>}
      </div>
      <p className="fx-bk-note"><Info size={13} aria-hidden="true"/>Check Out tidak dapat dilakukan selama user masih memiliki tagihan belum lunas.</p>
    </section>

    {riwayat.length > 0 && <section>
      <div className="fx-bk-sec"><h2>Riwayat</h2></div>
      <div className="fx-bk-table-card">
        <div className="table-wrap"><table className="fx-bk-table">
          <thead><tr><th>USER</th><th>KAMAR</th><th>PERIODE</th><th>STATUS</th></tr></thead>
          <tbody>
            {riwayat.map(b => { const st = statusBooking[b.status] ?? { label: b.status, tone: 'muted' }; return <tr key={b.id}>
              <td><b>{b.penyewaNama}</b></td><td>Kamar {b.kamarNomor}</td><td>{tanggal(b.tanggalMasuk)} – {tanggal(b.tanggalSelesai)}</td>
              <td><Badge tone={st.tone} dot>{st.label}</Badge></td>
            </tr>; })}
          </tbody>
        </table></div>
      </div>
    </section>}
  </div>;
}
