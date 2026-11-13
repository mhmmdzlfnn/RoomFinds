'use client';
import { useEffect, useMemo, useState } from 'react';
import { Archive, AlertTriangle, Calendar, Check, CheckCheck, FileText, Play, Search } from 'lucide-react';
import { get, patch } from '@/lib/api';
import { tanggal, statusKeluhan } from '@/lib/format';
import { useKos } from '@/components/owner/useKos';
import { Sukses } from '@/components/owner/DashboardModals';
import type { ApiComplaint } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const mock: ApiComplaint[] = [
  { id: 1, kategori: 'Listrik', deskripsi: 'Lampu kamar mati sejak kemarin malam, sudah coba ganti bohlam tapi tetap tidak menyala', status: 'DILAPORKAN', dibuatPada: '2026-10-21', diperbaruiPada: '2026-10-21', kamarNomor: '204', penyewaNama: 'Zulfan' },
  { id: 2, kategori: 'Air', deskripsi: 'Air keran kamar kecil dan sering mati di pagi hari', status: 'DIPROSES', tanggapanPemilik: 'Teknisi sudah dijadwalkan datang besok pagi', dibuatPada: '2026-10-19', diperbaruiPada: '2026-10-19', kamarNomor: '102', penyewaNama: 'Rina Aulia' },
  { id: 3, kategori: 'Internet', deskripsi: 'WiFi sering putus saat malam hari, sangat mengganggu pekerjaan kantor yang harus lembur.', status: 'SELESAI', tanggapanPemilik: 'Router sudah diganti, silakan coba kembali', dibuatPada: '2026-10-15', diperbaruiPada: '2026-10-16', kamarNomor: '305', penyewaNama: 'Dimas Pratama' },
  { id: 4, kategori: 'Fasilitas', deskripsi: 'AC kamar meneteskan air sejak kemarin malam', status: 'DIPROSES', tanggapanPemilik: 'Teknisi akan datang besok pukul 10.00, mohon kamarnya bisa diakses', dibuatPada: '2026-10-12', diperbaruiPada: '2026-10-12', kamarNomor: '204', penyewaNama: 'Zulfan' },
  { id: 5, kategori: 'Listrik', deskripsi: 'Lampu kamar mandi luar mati', status: 'SELESAI', tanggapanPemilik: 'Bola lampu telah diganti baru.', dibuatPada: '2026-10-08', diperbaruiPada: '2026-10-09', kamarNomor: '204', penyewaNama: 'Zulfan' },
];
const TAB = ['Semua', 'Dilaporkan', 'Diproses', 'Selesai'] as const;

type Hasil = { jenis: 'diproses' | 'selesai' | 'arsip'; nama: string; kamar: string; kategori: string };

const tipeKamar = (nomor: string) => (nomor === '102' ? 'Standar' : 'Eksklusif');
const inisial = (nama: string) => nama.split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
const kapital = (nilai: string) => nilai.charAt(0).toUpperCase() + nilai.slice(1).toLowerCase();
const tanggalPanjang = (iso: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));

export function KeluhanSection() {
  const { kosId, error: kosError } = useKos();
  const [list, setList] = useState<ApiComplaint[]>(useMock ? mock : []);
  const [tab, setTab] = useState<(typeof TAB)[number]>('Semua');
  const [cari, setCari] = useState('');
  const [tanggapan, setTanggapan] = useState<Record<number, string>>({});
  const [arsip, setArsip] = useState<number[]>([]);
  const [fotoBesar, setFotoBesar] = useState<number | null>(null);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const muat = () => { if (useMock || !kosId) return; get<ApiComplaint[]>(`/api/kos/${kosId}/keluhan`).then(setList).catch((e) => setError(e instanceof Error ? e.message : 'Keluhan belum berhasil dimuat.')); };
  useEffect(() => { muat(); }, [kosId]);

  async function proses(q: ApiComplaint, status: 'DIPROSES' | 'SELESAI') {
    if (busy) return;
    setBusy(true); setError('');
    const tanggapanPemilik = (tanggapan[q.id] ?? q.tanggapanPemilik ?? '').trim();
    try {
      if (!useMock) await patch(`/api/keluhan/${q.id}/status`, { status, tanggapanPemilik });
      else setList((daftar) => daftar.map((x) => (x.id === q.id ? { ...x, status, tanggapanPemilik, diperbaruiPada: new Date().toISOString() } : x)));
      setHasil({ jenis: status === 'DIPROSES' ? 'diproses' : 'selesai', nama: q.penyewaNama ?? 'User', kamar: q.kamarNomor, kategori: kapital(q.kategori) });
      muat();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memperbarui keluhan.');
    } finally {
      setBusy(false);
    }
  }

  // Arsip disimpan di server (PATCH /keluhan/{id}/arsip) sehingga tidak muncul lagi setelah halaman dimuat ulang.
  async function arsipkan(q: ApiComplaint) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (!useMock) await patch(`/api/keluhan/${q.id}/arsip`, { diarsipkan: true });
      setArsip((daftar) => [...daftar, q.id]);
      setHasil({ jenis: 'arsip', nama: q.penyewaNama ?? 'User', kamar: q.kamarNomor, kategori: kapital(q.kategori) });
      muat();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Keluhan belum berhasil diarsipkan.');
    } finally {
      setBusy(false);
    }
  }

  const aktif = useMemo(() => list.filter((q) => !arsip.includes(q.id)), [list, arsip]);
  const jumlah = (label: string) => aktif.filter((q) => statusKeluhan[q.status]?.label === label).length;
  const kata = cari.trim().toLowerCase();
  const tampil = aktif.filter((q) =>
    (tab === 'Semua' || statusKeluhan[q.status]?.label === tab) &&
    (!kata || `${q.penyewaNama ?? ''} ${q.kamarNomor} ${q.kategori} ${q.deskripsi}`.toLowerCase().includes(kata))
  );

  return <div className="fx-kl">
    <header className="fx-kl-head">
      <h1><span><AlertTriangle size={22} aria-hidden="true" /></span>Keluhan Masuk</h1>
      <p>Kelola dan tanggapi laporan atau kendala dari penghuni kos.</p>
      {useMock && <p className="fx-kl-demo">Mode demo: perubahan hanya berlaku selama halaman ini dibuka, tidak dikirim ke server.</p>}
    </header>
    {kosError && <div className="form-alert" role="alert">{kosError}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}

    <div className="fx-kl-bar">
      <div className="fx-kl-tabs" role="tablist" aria-label="Filter status keluhan">
        {TAB.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t} ({t === 'Semua' ? aktif.length : jumlah(t)})
          </button>
        ))}
      </div>
      <label className="fx-kl-search"><Search size={15} aria-hidden="true" /><input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari keluhan atau kamar..." aria-label="Cari keluhan atau kamar" /></label>
    </div>

    <div className="fx-kl-list">
      {tampil.map((q) => {
        const st = statusKeluhan[q.status]?.label ?? q.status;
        const selesai = q.status === 'SELESAI';
        return (
          <article className="fx-kl-card" key={q.id}>
            <div className="fx-kl-top">
              <span className="fx-kl-avatar">{inisial(q.penyewaNama ?? 'U')}</span>
              <div className="fx-kl-who">
                <b>{q.penyewaNama ?? 'User'}</b>
                <small><FileText size={12} aria-hidden="true" />Kamar {q.kamarNomor} {tipeKamar(q.kamarNomor)}<i aria-hidden="true">•</i><Calendar size={12} aria-hidden="true" />{tanggalPanjang(q.dibuatPada)}</small>
              </div>
              <div className="fx-kl-tags">
                <span className={`fx-kl-kat k-${q.kategori.toLowerCase()}`}>{kapital(q.kategori)}</span>
                <span className={`fx-kl-st s-${q.status.toLowerCase()}`}>{selesai && <Check size={11} strokeWidth={3} aria-hidden="true" />}{st}</span>
              </div>
            </div>
            <p className="fx-kl-desc">“{q.deskripsi}”</p>
            {q.foto && (
              <button type="button" className={`fx-kl-foto${fotoBesar === q.id ? ' besar' : ''}`} onClick={() => setFotoBesar(fotoBesar === q.id ? null : q.id)} aria-label={fotoBesar === q.id ? 'Perkecil foto keluhan' : 'Perbesar foto keluhan'}>
                <img src={q.foto} alt={`Foto kendala dari kamar ${q.kamarNomor}`} />
              </button>
            )}
            <div className="fx-kl-field">
              <label htmlFor={`tanggapan-${q.id}`}>Tanggapan Pemilik</label>
              <textarea id={`tanggapan-${q.id}`} rows={2} disabled={busy || selesai} value={tanggapan[q.id] ?? q.tanggapanPemilik ?? ''} onChange={(e) => setTanggapan({ ...tanggapan, [q.id]: e.target.value })} placeholder="Tulis tanggapan atau instruksi untuk penyewa..." />
            </div>
            <div className={`fx-kl-foot${selesai ? ' selesai' : ''}`}>
              {selesai && <em>Kendala telah diselesaikan pada {tanggalPanjang(q.diperbaruiPada)}</em>}
              {q.status === 'DILAPORKAN' && <button type="button" className="fx-kl-btn" disabled={busy} onClick={() => proses(q, 'DIPROSES')}><Play size={13} aria-hidden="true" />Proses</button>}
              {q.status === 'DIPROSES' && <button type="button" className="fx-kl-btn" disabled={busy} onClick={() => proses(q, 'SELESAI')}><Check size={14} strokeWidth={3} aria-hidden="true" />Selesaikan</button>}
              {selesai && <button type="button" className="fx-kl-btn fx-kl-btn-soft" disabled={busy} onClick={() => arsipkan(q)}><Archive size={13} aria-hidden="true" />Arsip</button>}
            </div>
          </article>
        );
      })}
      {tampil.length === 0 && <section className="fx-kl-empty">Tidak ada keluhan pada filter ini.</section>}
    </div>

    {tab === 'Selesai' && tampil.length > 0 && (
      <div className="fx-kl-done">
        <span><CheckCheck size={20} aria-hidden="true" /></span>
        <b>Semua keluhan selesai ditangani</b>
        <p>Penghuni merasa puas dengan respon cepat Anda. Pertahankan kualitas pelayanan kos!</p>
      </div>
    )}

    {hasil && (
      <Sukses
        judul={hasil.jenis === 'diproses' ? 'Keluhan Sedang Diproses' : hasil.jenis === 'selesai' ? 'Keluhan Telah Diselesaikan' : 'Keluhan Diarsipkan'}
        sub={hasil.jenis === 'diproses' ? 'Tanggapan Anda sudah terkirim ke penyewa dan status keluhan berubah menjadi Diproses.' : hasil.jenis === 'selesai' ? 'Laporan kendala penghuni telah ditandai selesai dan notifikasi akan tampil saat penghuni masuk ke website.' : 'Laporan keluhan penghuni telah berhasil diarsipkan ke dalam riwayat.'}
        ikon={hasil.jenis === 'arsip' ? <Archive size={26} aria-hidden="true" /> : <Check size={28} strokeWidth={3} aria-hidden="true" />}
        lembut={hasil.jenis !== 'diproses'}
        onClose={() => setHasil(null)}
      >
        <dl className="fx-modal-summary">
          {hasil.jenis === 'diproses' ? (
            <>
              <div><dt>Pelapor:</dt><dd>{hasil.nama}, Kamar {hasil.kamar}</dd></div>
              <div><dt>Kategori:</dt><dd>{hasil.kategori}</dd></div>
              <div><dt>Status:</dt><dd className="fx-modal-status-wait">DIPROSES</dd></div>
            </>
          ) : (
            <>
              <div><dt>Penghuni</dt><dd>{hasil.nama}</dd></div>
              <div><dt>Kamar</dt><dd>{hasil.kamar === '' ? '' : `Kamar ${hasil.kamar} ${tipeKamar(hasil.kamar)}`}</dd></div>
              <div><dt>Kategori</dt><dd><span className="fx-modal-pill">{hasil.kategori}</span></dd></div>
              <div><dt>Status</dt><dd><span className="fx-modal-pill">{hasil.jenis === 'selesai' ? <><Check size={11} strokeWidth={3} aria-hidden="true" /> Selesai</> : <><Archive size={11} aria-hidden="true" /> Diarsipkan</>}</span></dd></div>
            </>
          )}
        </dl>
      </Sukses>
    )}
  </div>;
}
