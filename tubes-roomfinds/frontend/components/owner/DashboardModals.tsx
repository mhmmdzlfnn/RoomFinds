'use client';
import { useEffect, useRef, useState } from 'react';
import { Calendar, Check, CheckCircle2, ChevronDown, Download, FileText, Info, Lock, Receipt, Sheet, Tag, X } from 'lucide-react';
import { get, post } from '@/lib/api';
import { rupiah } from '@/lib/format';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export type ModalDashboard = null | 'unduh' | 'unduh-ok' | 'catat' | 'catat-ok';

const periodeOpsi = ['Oktober 2026', 'September 2026', 'Agustus 2026', 'Juli 2026', 'Juni 2026', 'Mei 2026'];
const isiLaporan = ['Ringkasan Keuangan', 'Daftar Tagihan', 'Daftar Penghuni', 'Riwayat Pembayaran'];
const kategoriOpsi = ['Perbaikan & Perawatan', 'Listrik & Air', 'Kebersihan', 'Gaji Pegawai', 'Lain-lain'];
const namaKos = 'Kos Melati Putri - Jakarta Selatan';

const bulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function tanggalPanjang(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return y && m && d ? `${d} ${bulan[m - 1]} ${y}` : iso;
}

export function Dialog({ judul, sub, onClose, children, lebar = 560 }: { judul: string; sub?: string; onClose: () => void; children: React.ReactNode; lebar?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tombol = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', tombol);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', tombol);
  }, [onClose]);
  return (
    <div className="fx-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="fx-modal" role="dialog" aria-modal="true" aria-label={judul} style={{ maxWidth: lebar }} ref={ref} tabIndex={-1}>
        <button type="button" className="fx-modal-close" onClick={onClose} aria-label="Tutup"><X size={16} aria-hidden="true" /></button>
        <h2>{judul}</h2>
        {sub && <p className="fx-modal-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
}

export function Sukses({ judul, sub, ikon, onClose, children, lembut = false, merah = false }: { judul: string; sub: string; ikon: React.ReactNode; onClose: () => void; children: React.ReactNode; lembut?: boolean; merah?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const tombol = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', tombol);
    ref.current?.focus();
    return () => document.removeEventListener('keydown', tombol);
  }, [onClose]);
  return (
    <div className="fx-modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`fx-modal fx-modal-ok${lembut ? " fx-modal-ok-soft" : ""}${merah ? " fx-modal-ok-red" : ""}`} role="dialog" aria-modal="true" aria-label={judul} style={{ maxWidth: 460 }}>
        <span className="fx-modal-ok-icon">{ikon}</span>
        <h2>{judul}</h2>
        <p className="fx-modal-sub">{sub}</p>
        {children}
        <button type="button" className="fx-modal-btn fx-modal-btn-full" onClick={onClose} ref={ref}>Tutup</button>
      </div>
    </div>
  );
}

export function DashboardModals({ modal, setModal }: { modal: ModalDashboard; setModal: (value: ModalDashboard) => void }) {
  const [periode, setPeriode] = useState(periodeOpsi[0]);
  const [isi, setIsi] = useState<string[]>([isiLaporan[0]]);
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
  const [tanggal, setTanggal] = useState('2026-11-04');
  const [kategori, setKategori] = useState(kategoriOpsi[0]);
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [galat, setGalat] = useState('');
  const [tersimpan, setTersimpan] = useState({ kategori: '', tanggal: '', jumlah: 0 });

  const tutup = () => setModal(null);
  const berkas = `Laporan_Kos_Melati_Putri_${periode.replace(' ', '_')}.${format}`;

  async function simpanPengeluaran(event: React.FormEvent) {
    event.preventDefault();
    const nilai = Number(jumlah.replace(/\D/g, ''));
    if (!nilai) { setGalat('Isi jumlah pengeluaran lebih dari nol.'); return; }
    if (!tanggal) { setGalat('Pilih tanggal pengeluaran.'); return; }
    setGalat('');
    if (!useMock) {
      try {
        const daftarKos = await get<Array<{ id: number }>>('/api/kos');
        if (!daftarKos[0]) { setGalat('Belum ada kos yang terdaftar untuk mencatat pengeluaran.'); return; }
        await post(`/api/kos/${daftarKos[0].id}/pengeluaran`, { tanggal, kategori, keterangan, jumlah: nilai });
      } catch (e) {
        setGalat(e instanceof Error ? e.message : 'Pengeluaran belum berhasil disimpan.');
        return;
      }
    }
    setTersimpan({ kategori, tanggal, jumlah: nilai });
    setJumlah(''); setKeterangan('');
    setModal('catat-ok');
  }

  if (modal === 'unduh') {
    return (
      <Dialog judul="Unduh Laporan" sub="Pilih cakupan data dan format laporan operasional kos." onClose={tutup}>
        <form className="fx-modal-form" onSubmit={event => { event.preventDefault(); if (isi.length) setModal('unduh-ok'); }}>
          <div className="fx-modal-field">
            <label htmlFor="lap-periode">Periode Laporan</label>
            <div className="fx-modal-input fx-modal-select">
              <Calendar size={15} aria-hidden="true" />
              <select id="lap-periode" value={periode} onChange={event => setPeriode(event.target.value)}>{periodeOpsi.map(item => <option key={item}>{item}</option>)}</select>
              <ChevronDown size={15} aria-hidden="true" />
            </div>
          </div>
          <fieldset className="fx-modal-field">
            <legend>Isi Laporan</legend>
            <div className="fx-modal-grid">
              {isiLaporan.map(item => <label key={item} className="fx-modal-check">
                <input type="checkbox" checked={isi.includes(item)} onChange={() => setIsi(list => list.includes(item) ? list.filter(x => x !== item) : [...list, item])} />
                <span className="fx-modal-box" aria-hidden="true">{isi.includes(item) && <Check size={12} strokeWidth={3} />}</span>{item}
              </label>)}
            </div>
            {!isi.length && <p className="fx-modal-error" role="alert">Pilih minimal satu isi laporan.</p>}
          </fieldset>
          <fieldset className="fx-modal-field">
            <legend>Format Dokumen</legend>
            <div className="fx-modal-grid">
              <label className={`fx-modal-radio${format === 'pdf' ? ' on' : ''}`}><FileText size={15} aria-hidden="true" /><span>PDF</span><input type="radio" name="format" checked={format === 'pdf'} onChange={() => setFormat('pdf')} /><i aria-hidden="true" /></label>
              <label className={`fx-modal-radio${format === 'xlsx' ? ' on' : ''}`}><Sheet size={15} aria-hidden="true" /><span>Excel (.xlsx)</span><input type="radio" name="format" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} /><i aria-hidden="true" /></label>
            </div>
          </fieldset>
          <div className="fx-modal-info"><Info size={14} aria-hidden="true" /><span>Laporan berisi data Kos Melati Putri untuk periode terpilih. Dokumen akan memuat rincian terenkripsi siap cetak.</span></div>
          <div className="fx-modal-actions">
            <button type="button" className="fx-modal-btn fx-modal-btn-ghost" onClick={tutup}>Batal</button>
            <button type="submit" className="fx-modal-btn" disabled={!isi.length}><Download size={14} aria-hidden="true" />Unduh</button>
          </div>
        </form>
      </Dialog>
    );
  }

  if (modal === 'unduh-ok') {
    return (
      <Sukses judul="Laporan Berhasil Diunduh" sub={`Laporan periode ${periode} sudah terunduh ke perangkat Anda.`} ikon={<Check size={26} strokeWidth={3} />} onClose={tutup}>
        <div className="fx-modal-file"><span><FileText size={15} aria-hidden="true" /></span><b>{berkas}</b></div>
      </Sukses>
    );
  }

  if (modal === 'catat') {
    return (
      <Dialog judul="Catat Pengeluaran" sub="Dokumentasikan biaya operasional kos untuk laporan berkala" onClose={tutup} lebar={620}>
        <form className="fx-modal-form" onSubmit={simpanPengeluaran}>
          <div className="fx-modal-field">
            <label htmlFor="exp-kos">Kos</label>
            <div className="fx-modal-input fx-modal-locked"><Receipt size={15} aria-hidden="true" /><input id="exp-kos" value={namaKos} readOnly /><Lock size={14} aria-hidden="true" /></div>
          </div>
          <div className="fx-modal-grid">
            <div className="fx-modal-field">
              <label htmlFor="exp-tgl">Tanggal Pengeluaran</label>
              <div className="fx-modal-input"><Calendar size={15} aria-hidden="true" /><input id="exp-tgl" type="date" value={tanggal} onChange={event => setTanggal(event.target.value)} required /></div>
            </div>
            <div className="fx-modal-field">
              <label htmlFor="exp-kat">Kategori Biaya</label>
              <div className="fx-modal-input fx-modal-select"><Tag size={15} aria-hidden="true" /><select id="exp-kat" value={kategori} onChange={event => setKategori(event.target.value)}>{kategoriOpsi.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div>
            </div>
          </div>
          <div className="fx-modal-field">
            <label htmlFor="exp-jml">Jumlah Pengeluaran</label>
            <div className="fx-modal-input fx-modal-rp"><span>Rp</span><input id="exp-jml" inputMode="numeric" value={jumlah} placeholder="0" onChange={event => { const angka = event.target.value.replace(/\D/g, ''); setJumlah(angka ? Number(angka).toLocaleString('id-ID') : ''); }} /></div>
          </div>
          <div className="fx-modal-field">
            <label htmlFor="exp-ket">Keterangan / Rincian</label>
            <textarea id="exp-ket" className="fx-modal-textarea" rows={3} value={keterangan} onChange={event => setKeterangan(event.target.value)} placeholder="Contoh: Perbaikan instalasi pompa air kamar mandi lt 1" />
          </div>
          <div className="fx-modal-info"><Info size={14} aria-hidden="true" /><span>Pengeluaran ini akan langsung tercatat dan diperhitungkan ke dalam laporan keuangan laba-rugi bulan berjalan.</span></div>
          {galat && <p className="fx-modal-error" role="alert">{galat}</p>}
          <div className="fx-modal-actions">
            <button type="button" className="fx-modal-btn fx-modal-btn-ghost" onClick={tutup}>Batal</button>
            <button type="submit" className="fx-modal-btn"><Check size={14} aria-hidden="true" />Simpan Pengeluaran</button>
          </div>
        </form>
      </Dialog>
    );
  }

  if (modal === 'catat-ok') {
    return (
      <Sukses judul="Pengeluaran Berhasil Disimpan" sub="Pengeluaran sudah tercatat di laporan keuangan bulan berjalan." ikon={<CheckCircle2 size={28} aria-hidden="true" />} onClose={tutup} lembut>
        <dl className="fx-modal-summary">
          <div><dt>Kategori:</dt><dd>{tersimpan.kategori}</dd></div>
          <div><dt>Tanggal:</dt><dd>{tanggalPanjang(tersimpan.tanggal)}</dd></div>
          <div><dt>Jumlah:</dt><dd><b>{rupiah(tersimpan.jumlah)}</b></dd></div>
        </dl>
      </Sukses>
    );
  }

  return null;
}
