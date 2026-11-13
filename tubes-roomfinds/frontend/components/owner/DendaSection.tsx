'use client';
import { useEffect, useState } from 'react';
import {
  Ban,
  Bot,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Eye,
  FileCheck2,
  Info,
  RefreshCw,
  Save,
  Scale,
} from 'lucide-react';
import { put } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { useKos } from '@/components/owner/useKos';
import { Sukses } from '@/components/owner/DashboardModals';
import { NotifSukses } from '@/components/NotifSukses';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export function DendaSection() {
  const { kosList, kosId, setKosId, kos, error: kosError } = useKos();
  const [jenis, setJenis] = useState<'HARIAN' | 'FLAT' | 'TANPA'>('HARIAN');
  const [nominalPerHari, setNominalPerHari] = useState('10000');
  const [nominal, setNominal] = useState('50000');
  const [masaTenggang, setMasaTenggang] = useState('3');
  const [batasMaksimal, setBatasMaksimal] = useState('100000');
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tersimpan, setTersimpan] = useState<{ skema: string; nominal?: string; tenggang?: string } | null>(null);

  useEffect(() => {
    if (!kos?.aturanDenda) return;
    const a = kos.aturanDenda as {
      jenis?: string;
      nominalPerHari?: number;
      nominal?: number;
      masaTenggang?: number;
      batasMaksimal?: number;
    };
    setJenis((a.jenis as 'HARIAN' | 'FLAT' | 'TANPA') ?? 'HARIAN');
    if (a.nominalPerHari != null) setNominalPerHari(String(a.nominalPerHari));
    if (a.nominal != null) setNominal(String(a.nominal));
    setMasaTenggang(String(a.masaTenggang ?? 3));
    if (a.batasMaksimal != null) setBatasMaksimal(String(a.batasMaksimal));
  }, [kos]);

  const flash = (msg: string) => {
    setOk(msg);
    setTimeout(() => setOk(''), 4000);
  };

  async function simpan() {
    if (!kos || busy) return;
    setError('');
    setOk('');
    const validNominal = (nilai: string) =>
      nilai.trim() !== '' && Number.isFinite(Number(nilai)) && Number(nilai) > 0;

    if (
      jenis !== 'TANPA' &&
      (!validNominal(jenis === 'HARIAN' ? nominalPerHari : nominal) ||
        !masaTenggang.trim() ||
        !Number.isInteger(Number(masaTenggang)) ||
        Number(masaTenggang) < 0 ||
        (jenis === 'HARIAN' &&
          (!validNominal(batasMaksimal) || Number(batasMaksimal) < Number(nominalPerHari))))
    ) {
      setError(
        'Isi nominal positif, masa tenggang berupa bilangan bulat minimal 0, dan batas maksimal minimal sebesar denda harian.'
      );
      return;
    }

    setBusy(true);
    const body =
      jenis === 'HARIAN'
        ? {
            jenis,
            nominalPerHari: Number(nominalPerHari) || 0,
            masaTenggang: Number(masaTenggang) || 0,
            batasMaksimal: Number(batasMaksimal) || 0,
          }
        : jenis === 'FLAT'
        ? { jenis, nominal: Number(nominal) || 0, masaTenggang: Number(masaTenggang) || 0 }
        : { jenis, masaTenggang: 0 };

    try {
      if (!useMock) await put(`/api/kos/${kos.id}/aturan-denda`, body);
      setTersimpan(
        jenis === 'HARIAN'
          ? { skema: 'Denda Harian', nominal: `${rupiah(Number(nominalPerHari) || 0)} per hari, maks ${rupiah(Number(batasMaksimal) || 0)}`, tenggang: `${Number(masaTenggang) || 0} hari` }
          : jenis === 'FLAT'
          ? { skema: 'Denda Flat', nominal: `${rupiah(Number(nominal) || 0)} sekali per tagihan`, tenggang: `${Number(masaTenggang) || 0} hari` }
          : { skema: 'Tanpa Denda', nominal: 'Rp0', tenggang: 'Tidak berlaku' }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan aturan denda.');
    } finally {
      setBusy(false);
    }
  }

  // Simulasi perhitungan
  const numPerHari = Number(nominalPerHari) || 0;
  const numFlat = Number(nominal) || 0;
  const numMasa = Number(masaTenggang) || 0;
  const numMax = Number(batasMaksimal) || 0;
  const hitung = (hari: number) =>
    jenis === 'TANPA'
      ? 0
      : jenis === 'FLAT'
      ? hari > numMasa ? numFlat : 0
      : Math.min(Math.max(0, hari - numMasa) * numPerHari, numMax || Infinity);
  const sim5 = hitung(5);
  const sim15 = hitung(15);
  const namaSkema = jenis === 'HARIAN' ? 'Denda Harian' : jenis === 'FLAT' ? 'Denda Flat' : 'Tanpa Denda';
  const skema = [
    { kode: 'HARIAN' as const, nama: 'Denda Harian', ikon: <Calendar size={18} aria-hidden="true" />, isi: 'Denda dihitung per hari setelah masa tenggang habis.' },
    { kode: 'FLAT' as const, nama: 'Denda Flat', ikon: <Scale size={18} aria-hidden="true" />, isi: 'Denda tetap sekali kena setelah melewati masa tenggang.' },
    { kode: 'TANPA' as const, nama: 'Tanpa Denda', ikon: <Ban size={18} aria-hidden="true" />, isi: 'Tidak ada denda keterlambatan yang diterapkan pada tagihan.' },
  ];
  const aktifKonfigurasi = jenis !== 'TANPA';

  return (
    <div className="fx-pd">
      <nav className="fx-pd-crumb" aria-label="Breadcrumb">
        <span>Pengaturan</span>
        <ChevronRight size={13} aria-hidden="true" />
        <strong>Denda Keterlambatan</strong>
      </nav>
      <header className="fx-pd-head">
        <div>
          <h1>Pengaturan Denda Keterlambatan</h1>
          <p>Atur skema dan nominal denda keterlambatan pembayaran sewa kos secara otomatis.</p>
        </div>
        <div className="fx-pd-kos">
          <Building2 size={16} aria-hidden="true" />
          <div><small>Properti Aktif</small><b>{kos?.nama ?? 'Kos Melati Putri'} - Jakarta Selatan</b></div>
          {kosList.length > 1 ? (
            <label className="fx-pd-ganti">
              <span>Ganti Kos</span><RefreshCw size={12} aria-hidden="true" />
              <select value={kosId ?? ''} onChange={(e) => setKosId(Number(e.target.value))} aria-label="Ganti kos">
                {kosList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </label>
          ) : (
            <button type="button" className="fx-pd-ganti" onClick={() => flash('Properti kos aktif saat ini.')}><span>Ganti Kos</span><RefreshCw size={12} aria-hidden="true" /></button>
          )}
        </div>
      </header>

      <NotifSukses pesan={ok} onClose={() => setOk('')} />
      {(error || kosError) && <div className="form-alert" role="alert">{error || kosError}</div>}
      {useMock && <p className="fx-pd-demo">Mode demo: perubahan hanya berlaku selama halaman ini dibuka, tidak dikirim ke server.</p>}

      <div className="fx-pd-grid">
        <div className="fx-pd-left">
          <section>
            <div className="fx-pd-label-row">
              <h2>Pilih Skema Denda</h2>
              <span className="fx-pd-auto">Otomatis Terkalkulasi</span>
            </div>
            <div className="fx-pd-skema" role="radiogroup" aria-label="Skema denda">
              {skema.map((item) => {
                const pilih = jenis === item.kode;
                return (
                  <label key={item.kode} className={`fx-pd-card${pilih ? ' on' : ''}`}>
                    <input type="radio" name="skema-denda" checked={pilih} onChange={() => setJenis(item.kode)} />
                    {pilih && <em>AKTIF DIPAKAI</em>}
                    <div className="fx-pd-card-top"><span className="fx-pd-card-icon">{item.ikon}</span><i aria-hidden="true" /></div>
                    <b>{item.nama}</b>
                    <p>{item.isi}</p>
                    <div className="fx-pd-card-foot">{pilih ? <><span>Skema Terpilih</span><CheckCircle2 size={15} aria-hidden="true" /></> : <span className="muted">Status: Nonaktif</span>}</div>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="fx-pd-config">
            <div className="fx-pd-config-head">
              <div><h2>Konfigurasi Nominal &amp; Tenggang</h2><p>Atur parameter spesifik untuk skema {jenis === 'FLAT' ? 'Denda Flat' : 'Denda Harian'}</p></div>
              <span className={`fx-pd-state${aktifKonfigurasi ? ' on' : ''}`}><i aria-hidden="true" />{aktifKonfigurasi ? 'Aktif' : 'Nonaktif'}</span>
            </div>
            <div className={`fx-pd-fields${jenis === 'HARIAN' || jenis === 'TANPA' ? ' tiga' : ''}`}>
              <div className="fx-pd-field">
                <label htmlFor="pd-nominal">{jenis === 'FLAT' ? 'Nominal Denda (sekali)' : 'Nominal Denda (per hari)'}</label>
                <div className="fx-pd-input"><span>Rp</span>
                  <input id="pd-nominal" type="text" inputMode="numeric" disabled={!aktifKonfigurasi}
                    value={jenis === 'TANPA' ? '0' : Number(jenis === 'FLAT' ? nominal : nominalPerHari).toLocaleString('id-ID')}
                    onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); if (jenis === 'FLAT') setNominal(val); else setNominalPerHari(val); }} />
                </div>
                <small>{jenis === 'FLAT' ? 'Besaran denda tetap yang dikenakan satu kali per tagihan.' : 'Besaran denda yang bertambah tiap harinya.'}</small>
              </div>
              <div className="fx-pd-field">
                <label htmlFor="pd-tenggang">Masa Tenggang (Hari)</label>
                <div className="fx-pd-input">
                  <input id="pd-tenggang" type="number" min={0} disabled={!aktifKonfigurasi} value={jenis === 'TANPA' ? '0' : masaTenggang} onChange={(e) => setMasaTenggang(e.target.value)} />
                  <b>Hari</b><Clock size={16} aria-hidden="true" />
                </div>
                <small>Tenggang waktu sebelum denda mulai dihitung.</small>
              </div>
              {(jenis === 'HARIAN' || jenis === 'TANPA') && (
                <div className="fx-pd-field">
                  <label htmlFor="pd-maks">Batas Maksimal Denda</label>
                  <div className="fx-pd-input"><span>Rp</span>
                    <input id="pd-maks" type="text" inputMode="numeric" disabled={!aktifKonfigurasi}
                      value={jenis === 'TANPA' ? '0' : Number(batasMaksimal).toLocaleString('id-ID')}
                      onChange={(e) => setBatasMaksimal(e.target.value.replace(/\D/g, ''))} />
                  </div>
                  <small>Nominal maksimum akumulasi denda per tagihan bulanan.</small>
                </div>
              )}
            </div>
            {jenis !== 'HARIAN' && (
              <div className="fx-pd-info"><Info size={15} aria-hidden="true" /><span>{jenis === 'FLAT' ? 'Denda Flat tidak memakai batas maksimal, nominal yang dikenakan selalu sama.' : 'Pilih skema Denda Harian atau Denda Flat untuk mengatur nominal dan masa tenggang.'}</span></div>
            )}
          </section>

          <section className="fx-pd-sistem">
            <span className="fx-pd-sistem-icon"><Bot size={18} aria-hidden="true" /></span>
            <div>
              <h3>Catatan Sistem</h3>
              <p>{jenis === 'TANPA'
                ? 'Tidak ada denda yang dihitung. Pengingat tagihan tetap dikirim ke penyewa sesuai tanggal jatuh tempo.'
                : 'Perhitungan denda dilakukan secara otomatis pada pukul 00:00 WIB setelah masa tenggang terlewati. Notifikasi tagihan beserta denda akan langsung muncul saat penyewa masuk (login) ke website.'}</p>
            </div>
          </section>
        </div>

        <aside className="fx-pd-right">
          <div className="fx-pd-preview">
            <div className="fx-pd-preview-head"><span><Eye size={17} aria-hidden="true" />Pratinjau Langsung</span><em>Live Sim</em></div>
            <p className="fx-pd-preview-desc">
              {jenis === 'HARIAN' ? (
                <>Penyewa yang terlambat lebih dari <b>{masaTenggang} hari</b> akan dikenakan denda <b>{rupiah(numPerHari)} per hari</b>, maksimal <b>{rupiah(numMax)}</b>.</>
              ) : jenis === 'FLAT' ? (
                <>Penyewa yang terlambat lebih dari <b>{masaTenggang} hari</b> akan dikenakan denda tetap <b>{rupiah(numFlat)}</b>, sekali untuk tagihan bulan tersebut.</>
              ) : (
                <>Tidak ada denda keterlambatan bagi penyewa.</>
              )}
            </p>
            <div className="fx-pd-sim-title">SIMULASI PERHITUNGAN:</div>
            <div className="fx-pd-sim"><span>Simulasi Keterlambatan 5 Hari</span><b>{rupiah(sim5)}</b></div>
            <div className="fx-pd-sim akhir">
              <div><span>Simulasi Keterlambatan 15 Hari</span><small>{jenis === 'TANPA' ? 'Tidak ada denda' : numMasa < 15 ? 'Melewati masa tenggang' : 'Masih masa tenggang'}</small></div>
              <b>{rupiah(sim15)}{jenis === 'FLAT' && sim15 > 0 ? ' (Tetap)' : jenis === 'HARIAN' && numMax > 0 && sim15 === numMax ? ' (Maks)' : ''}</b>
            </div>
          </div>
          <div>
            <button type="button" className="fx-pd-simpan" disabled={busy || !kos} onClick={simpan}><Save size={16} aria-hidden="true" /><span>Simpan Aturan</span></button>
            <p className="fx-pd-note">Perubahan aturan hanya berlaku untuk tagihan berikutnya</p>
          </div>
        </aside>
      </div>

      {tersimpan && (
        <Sukses
          judul="Aturan Berhasil Disimpan"
          sub="Aturan denda sudah disimpan dan hanya berlaku untuk tagihan berikutnya."
          ikon={<Check size={28} strokeWidth={3} aria-hidden="true" />}
          onClose={() => setTersimpan(null)}
        >
          <ul className="fx-modal-list">
            <li><FileCheck2 size={14} aria-hidden="true" /><span><b>Skema:</b> {tersimpan.skema}</span></li>
            {tersimpan.nominal && <li><Coins size={14} aria-hidden="true" /><span><b>Nominal:</b> {tersimpan.nominal}</span></li>}
            {tersimpan.tenggang && <li><Clock size={14} aria-hidden="true" /><span><b>Masa Tenggang:</b> {tersimpan.tenggang}</span></li>}
          </ul>
        </Sukses>
      )}
    </div>
  );
}
