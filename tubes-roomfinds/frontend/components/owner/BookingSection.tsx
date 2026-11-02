'use client';
import { useEffect, useState } from 'react';
import { Badge, PageHead } from '@/components/ui';
import { get, patch } from '@/lib/api';
import { rupiah, tanggal, statusBooking } from '@/lib/format';
import { setKamar as pilihGambarKamar } from '@/lib/gambar';
import { FotoKamar } from '@/components/FotoKamar';
import { useKos } from '@/components/owner/useKos';
import { DemoNotice, demoTagihan } from '@/components/owner/demo';
import type { ApiBill, ApiOwnerBooking } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const mock: ApiOwnerBooking[] = [{ id: 3, tanggalMasuk: '2026-11-01', tanggalSelesai: '2027-05-01', totalSewa: 8550000, status: 'MENUNGGU', waktuSetujuAturan: '2026-10-20T14:32:00', kamarNomor: '204', tipe: 'EKSKLUSIF', kosNama: 'Kos Melati Putri', paketNama: 'Semesteran', penyewaNama: 'Budi Santoso', email: 'budi.santoso@email.com', noHp: '081234567890' },
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

  return <div>
    <PageHead title="Booking Masuk" sub="Tinjau permintaan booking dan pantau user yang sedang aktif."/>
    <DemoNotice/>
    {kosError && <div className="form-alert" role="alert">{kosError}</div>}
    {ok && <div className="success-inline">✅ {ok}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}
    <h3 className="card-title" style={{ margin: '6px 0 12px' }}>Permintaan Booking</h3>
    {menunggu.length === 0 && <p className="muted" style={{ marginBottom: 12 }}>Tidak ada permintaan booking menunggu persetujuan.</p>}
    <div className="stack">
      {menunggu.map(b => <article className="card booking-card" key={b.id}>
        <div className="ph-xs" style={{ borderRadius: 9, overflow: 'hidden', flex: 'none' }}><FotoKamar nama={`${['204', '102', '305'].includes(b.kamarNomor) ? b.kamarNomor : pilihGambarKamar(b.tipe, b.id).slug}-utama`} alt={`Kamar ${b.kamarNomor}`}/></div>
        <div className="booking-body">
          <div className="booking-title"><span className="avatar" style={{ width: 34, height: 34, fontSize: 12 }} aria-label={`Avatar ${b.penyewaNama}`}>{b.penyewaNama.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase()}</span><h3>{b.penyewaNama}</h3><Badge tone="warning" dot>Menunggu</Badge></div>
          <div className="booking-meta">
            <span>Kamar: <b>Kamar {b.kamarNomor} {b.tipe === 'EKSKLUSIF' ? 'Eksklusif' : 'Standar'}</b></span>
            <span>Paket: <b>{b.paketNama}</b></span>
            <span>Mulai tinggal: <b>{tanggal(b.tanggalMasuk)}</b></span>
            <span>Total: <b>{rupiah(b.totalSewa)}</b></span>
          </div>
          <div className="booking-meta"><span className="muted small">{b.noHp} · {b.email}</span></div>
          {b.waktuSetujuAturan && <div className="proof-line">✅ Aturan kos disetujui penyewa pada {waktuPersetujuan(b.waktuSetujuAturan)}</div>}
          <div className="booking-foot">
            <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => aksi(b, 'konfirmasi')}>Setujui</button>
            <button className="btn btn-danger-outline btn-sm" disabled={busy} onClick={() => { setTolakId(tolakId === b.id ? null : b.id); setAlasan(''); }}>Tolak</button>
          </div>
          {tolakId === b.id && <div style={{ marginTop: 12 }}>
            <div className="field"><label>Alasan penolakan (wajib)</label><textarea aria-label="Alasan penolakan booking" required rows={2} value={alasan} onChange={e => setAlasan(e.target.value)} placeholder="Jelaskan alasan penolakan kepada User…"/></div>
            <button className="btn btn-danger btn-sm" disabled={busy || !alasan.trim()} onClick={() => aksi(b, 'tolak')}>Kirim Penolakan</button>
          </div>}
        </div>
      </article>)}
    </div>
    <h3 className="card-title" style={{ margin: '22px 0 12px' }}>User Aktif</h3>
    <section className="card card-pad">
      {aktif.length === 0 ? <p className="muted">Belum ada User aktif.</p> : <div className="table-wrap"><table className="data-table">
        <thead><tr><th>User</th><th>Kamar</th><th>Paket</th><th>Berakhir Pada</th><th></th></tr></thead>
        <tbody>
          {aktif.map(b => <tr key={b.id}>
            <td className="bold">{b.penyewaNama}</td><td>Kamar {b.kamarNomor}</td><td>{b.paketNama}</td><td>{tanggal(b.tanggalSelesai)}</td>
            <td style={{ textAlign: 'right' }}><button className="btn btn-outline btn-sm" disabled={busy || !billsLoaded || belumLunas(b.id)} title={belumLunas(b.id) ? 'User masih memiliki tagihan belum lunas' : !billsLoaded ? 'Menunggu pemeriksaan tagihan' : 'Selesaikan masa tinggal'} onClick={() => aksi(b, 'checkout')}>Check Out</button></td>
          </tr>)}
        </tbody>
      </table></div>}
      <p className="note mt-16">ℹ️ Check Out tidak dapat dilakukan selama user masih memiliki tagihan belum lunas.</p>
    </section>
    {riwayat.length > 0 && <>
      <h3 className="card-title" style={{ margin: '22px 0 12px' }}>Riwayat</h3>
      <section className="card card-pad">
        <div className="table-wrap"><table className="data-table">
          <thead><tr><th>User</th><th>Kamar</th><th>Periode</th><th>Status</th></tr></thead>
          <tbody>
            {riwayat.map(b => { const st = statusBooking[b.status] ?? { label: b.status, tone: 'muted' }; return <tr key={b.id}>
              <td className="bold">{b.penyewaNama}</td><td>Kamar {b.kamarNomor}</td><td>{tanggal(b.tanggalMasuk)} – {tanggal(b.tanggalSelesai)}</td>
              <td><Badge tone={st.tone} dot>{st.label}</Badge></td>
            </tr>; })}
          </tbody>
        </table></div>
      </section>
    </>}
  </div>;
}
