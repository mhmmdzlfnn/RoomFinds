'use client';

import { useEffect, useState } from 'react';
import { Badge, B, Empty, PageHead } from '@/components/ui';
import { get, patch } from '@/lib/api';
import { rupiah, statusBooking } from '@/lib/format';
import { tanggalLengkap } from '@/app/user/format';
import { bacaBookingDemo, batalkanBookingDemo, bookingMasihAktif } from '@/app/user/demo';
import { setKamar as pilihGambarKamar } from '@/lib/gambar';
import { FotoKamar } from '@/components/FotoKamar';
import type { ApiBooking } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

const formatTanggalBukti = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
const formatJamBukti = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const waktuPersetujuan = (value: string) => `${formatTanggalBukti.format(new Date(value))}, ${formatJamBukti.format(new Date(value)).replace(':', '.')}`;

export default function BookingSaya() {
  const [list, setList] = useState<ApiBooking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(''); const [busyId, setBusyId] = useState<number | null>(null);
  const [info, setInfo] = useState('');
  const aktif = list.find(bookingMasihAktif);

  const muat = () => {
      if (useMock) {
        try { setList(bacaBookingDemo()); }
        catch (e) { setError(e instanceof Error ? e.message : 'Booking demo belum berhasil dimuat.'); }
        finally { setLoaded(true); }
        return;
      }
      get<ApiBooking[]>('/api/booking/saya').then(setList).catch(e => setError(e instanceof Error ? e.message : 'Booking belum berhasil dimuat.')).finally(() => setLoaded(true));
    };
  useEffect(muat, []);

  async function batalkan(id: number) {
    if (!window.confirm('Batalkan booking ini? Kamar akan dikosongkan kembali.')) return;
    setBusyId(id); setError('');
    try {
      if (useMock) { setList(batalkanBookingDemo(id)); setInfo('Booking demo dibatalkan dan tersimpan pada sesi browser ini. Data server tidak berubah.'); }
      else { await patch(`/api/booking/${id}/batal`); muat(); setInfo('Booking berhasil dibatalkan.'); }
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Pembatalan belum berhasil.'); }
    finally { setBusyId(null); }
  }

  return <div>
    <PageHead title="Booking Saya" sub="Pantau pengajuan booking dan masa tinggal Anda." action={aktif ? <button className="btn btn-primary" disabled>+ Ajukan Booking Baru</button> : <B href="/">+ Ajukan Booking Baru</B>}/>
    {error && <div className="form-alert" role="alert">{error}</div>}
    {info && <div className="info-box blue mb-16" role="status">{info}</div>}
    <div className="info-box mb-16">Anda hanya dapat memiliki satu booking aktif. Selesaikan atau batalkan booking aktif sebelum mengajukan booking baru.</div>

    <div className="stack">
      {list.map(b => {
        const st = statusBooking[b.status] ?? { label: b.status, tone: 'muted' };
        return <article className="card booking-card" key={b.id}>
          <div className="ph-xs" style={{ borderRadius: 9, overflow: 'hidden', flex: 'none' }}><FotoKamar nama={`${b.kamarNomor === '204' ? '204' : pilihGambarKamar(b.tipe, b.id).slug}-utama`} alt={`Kamar ${b.kamarNomor}`}/></div>
          <div className="booking-body">
            <div className="booking-title"><h3>{b.kosNama} — Kamar {b.kamarNomor}</h3><Badge tone={b.tipe === 'EKSKLUSIF' ? 'teal' : 'slate'}>{b.tipe === 'EKSKLUSIF' ? 'Eksklusif' : 'Standar'}</Badge><Badge tone={st.tone} dot>{st.label}</Badge></div>
            <div className="booking-meta">
              <span>Paket: <b>{b.paketNama}</b></span>
              <span>Mulai tinggal: <b>{tanggalLengkap(b.tanggalMasuk)}</b></span>
              <span>Sampai: <b>{tanggalLengkap(b.tanggalSelesai)}</b></span>
              <span>Total sewa: <b>{rupiah(b.totalSewa)}</b></span>
            </div>
            {b.waktuSetujuAturan && <div className="proof-line">✅ Aturan kos disetujui pada {waktuPersetujuan(b.waktuSetujuAturan)}</div>}
            {b.status === 'DITOLAK' && b.alasanTolak && <div className="reason-box">Alasan penolakan pemilik: {b.alasanTolak}</div>}
            {b.status === 'SELESAI' && <p className="note">Masa sewa telah berakhir. Terima kasih sudah tinggal di {b.kosNama}.</p>}
            <div className="booking-foot">
              {b.status === 'MENUNGGU' && <button className="btn btn-danger-outline btn-sm" disabled={busyId === b.id} onClick={() => batalkan(b.id)}>{busyId === b.id ? 'Membatalkan…' : 'Batalkan Booking'}</button>}
              {b.status === 'DISETUJUI' && <><B href="/user/tagihan" sm>Lihat Tagihan</B><button className="btn btn-outline btn-sm" onClick={() => setInfo('Untuk Check Out, hubungi pemilik kos dan pastikan seluruh tagihan sudah lunas. Tindakan ini tidak mengakhiri booking secara otomatis.')}>Check Out</button></>}
              {b.status === 'MENUNGGU' && <span className="note">Pengajuan Anda sedang ditinjau pemilik kos.</span>}
            </div>
          </div>
        </article>;
      })}
    </div>
    {loaded && !error && list.length === 0 && <Empty title="Belum ada booking." body="Ajukan booking pertamamu dari halaman pencarian kamar." action={<B href="/">Cari Kamar</B>}/>}
  </div>;
}
