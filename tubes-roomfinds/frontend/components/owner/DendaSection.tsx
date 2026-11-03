'use client';
import { useEffect, useState } from 'react';
import {
  Ban,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  Coins,
  FileCheck2,
  Info,
  RefreshCw,
  Save,
} from 'lucide-react';
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
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
      flash(useMock ? 'Aturan denda diperbarui dalam demo.' : 'Aturan denda berhasil disimpan.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan aturan denda.');
    } finally {
      setBusy(false);
    }
  }

  // Simulation calculations
  const numPerHari = Number(nominalPerHari) || 0;
  const numMasa = Number(masaTenggang) || 0;
  const numMax = Number(batasMaksimal) || 0;
  const sim5 = Math.min(Math.max(0, 5 - numMasa) * numPerHari, numMax || Infinity);
  const sim15 = Math.min(Math.max(0, 15 - numMasa) * numPerHari, numMax || Infinity);

  return (
    <div className="pd-container">
      {/* ── Breadcrumb & Header ── */}
      <header className="pd-header">
        <div className="pd-breadcrumb">
          <span>Pengaturan</span>
          <ChevronRight size={14} className="muted" aria-hidden="true" />
          <span className="pd-breadcrumb-active">Denda Keterlambatan</span>
        </div>
        <h1 className="pd-title">Pengaturan Denda Keterlambatan</h1>
        <p className="pd-sub">
          Atur skema dan nominal denda keterlambatan pembayaran sewa kos secara otomatis.
        </p>
      </header>

      {/* Alerts */}
      {ok && (
        <div className="success-inline" role="status">
          ✅ {ok}
        </div>
      )}
      {(error || kosError) && (
        <div className="form-alert" role="alert">
          {error || kosError}
        </div>
      )}

      <DemoNotice />

      {/* ── Property Banner ── */}
      <section className="pd-banner">
        <div className="pd-banner-left">
          <div className="pd-banner-icon">
            <Building2 size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="pd-banner-tag">PROPERTI AKTIF</div>
            <div className="pd-banner-name">
              {kos?.nama ?? 'Kos Melati Putri'} - Jakarta Selatan
            </div>
          </div>
        </div>

        {kosList.length > 1 ? (
          <div style={{ position: 'relative' }}>
            <button type="button" className="pd-btn-ganti">
              <span>Ganti Kos</span>
              <RefreshCw size={12} aria-hidden="true" />
            </button>
            <select
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%',
              }}
              value={kosId ?? ''}
              onChange={(e) => setKosId(Number(e.target.value))}
            >
              {kosList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <button type="button" className="pd-btn-ganti" onClick={() => flash('Properti kos aktif saat ini.')}>
            <span>Ganti Kos</span>
            <RefreshCw size={12} aria-hidden="true" />
          </button>
        )}
      </section>

      {/* ── Two Column Layout ── */}
      <div className="pd-grid-layout">
        {/* Left Column */}
        <div className="pd-left-stack">
          {/* Pilih Skema Denda */}
          <section>
            <div className="pd-section-label">Pilih Skema Denda</div>
            <div className="pd-skema-row">
              {/* Denda Harian */}
              <div
                className={`pd-skema-card ${jenis === 'HARIAN' ? 'selected' : ''}`}
                onClick={() => setJenis('HARIAN')}
              >
                <div className="pd-skema-top">
                  <div className={`pd-skema-icon ${jenis === 'HARIAN' ? 'pd-skema-icon-active' : ''}`}>
                    <Calendar size={18} aria-hidden="true" />
                  </div>
                  <div className={`pd-radio-circle ${jenis === 'HARIAN' ? 'active' : ''}`}>
                    {jenis === 'HARIAN' && <div className="pd-radio-dot" />}
                  </div>
                </div>
                <div className="pd-skema-title">Denda Harian</div>
                <div className="pd-skema-sub">
                  Denda dihitung per hari setelah masa tenggang habis.
                </div>
              </div>

              {/* Denda Flat */}
              <div
                className={`pd-skema-card ${jenis === 'FLAT' ? 'selected' : ''}`}
                onClick={() => setJenis('FLAT')}
              >
                <div className="pd-skema-top">
                  <div className={`pd-skema-icon ${jenis === 'FLAT' ? 'pd-skema-icon-active' : ''}`}>
                    <Coins size={18} aria-hidden="true" />
                  </div>
                  <div className={`pd-radio-circle ${jenis === 'FLAT' ? 'active' : ''}`}>
                    {jenis === 'FLAT' && <div className="pd-radio-dot" />}
                  </div>
                </div>
                <div className="pd-skema-title">Denda Flat</div>
                <div className="pd-skema-sub">
                  Denda tetap sekali kena setelah melewati masa tenggang.
                </div>
              </div>

              {/* Tanpa Denda */}
              <div
                className={`pd-skema-card ${jenis === 'TANPA' ? 'selected' : ''}`}
                onClick={() => setJenis('TANPA')}
              >
                <div className="pd-skema-top">
                  <div className={`pd-skema-icon ${jenis === 'TANPA' ? 'pd-skema-icon-active' : ''}`}>
                    <Ban size={18} aria-hidden="true" />
                  </div>
                  <div className={`pd-radio-circle ${jenis === 'TANPA' ? 'active' : ''}`}>
                    {jenis === 'TANPA' && <div className="pd-radio-dot" />}
                  </div>
                </div>
                <div className="pd-skema-title">Tanpa Denda</div>
                <div className="pd-skema-sub">Tidak ada denda keterlambatan bagi penyewa.</div>
              </div>
            </div>
          </section>

          {/* Konfigurasi Nominal & Tenggang */}
          {jenis !== 'TANPA' && (
            <section className="pd-config-card">
              <div className="pd-config-head">
                <h2 className="pd-config-title">Konfigurasi Nominal &amp; Tenggang</h2>
                <span className="pd-active-badge">Aktif</span>
              </div>

              <div className="pd-fields-grid-2">
                <div>
                  <label className="kt-field-label">
                    {jenis === 'HARIAN' ? 'Nominal Denda (per hari)' : 'Nominal Denda Tetap'}
                  </label>
                  <div className="pd-input-wrap-styled">
                    <span className="pd-input-affix">Rp</span>
                    <input
                      type="text"
                      value={Number(jenis === 'HARIAN' ? nominalPerHari : nominal).toLocaleString('id-ID')}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (jenis === 'HARIAN') setNominalPerHari(val);
                        else setNominal(val);
                      }}
                    />
                  </div>
                  <div className="pd-input-hint">
                    Besaran denda yang bertambah tiap harinya.
                  </div>
                </div>

                <div>
                  <label className="kt-field-label">Masa Tenggang (Hari)</label>
                  <div className="pd-input-wrap-styled">
                    <input
                      type="number"
                      min={0}
                      value={masaTenggang}
                      onChange={(e) => setMasaTenggang(e.target.value)}
                    />
                    <span className="pd-input-affix">Hari</span>
                  </div>
                  <div className="pd-input-hint">
                    Tenggang waktu sebelum denda mulai dihitung.
                  </div>
                </div>
              </div>

              {jenis === 'HARIAN' && (
                <div>
                  <label className="kt-field-label">Batas Maksimal Denda</label>
                  <div className="pd-input-wrap-styled">
                    <span className="pd-input-affix">Rp</span>
                    <input
                      type="text"
                      value={Number(batasMaksimal).toLocaleString('id-ID')}
                      onChange={(e) => setBatasMaksimal(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  <div className="pd-input-hint">
                    Nominal maksimum akumulasi denda per tagihan bulanan.
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column */}
        <div className="pd-right-stack">
          {/* Pratinjau Langsung Card */}
          <div className="pd-preview-card">
            <div className="pd-preview-head">
              <Info size={16} aria-hidden="true" />
              <span>Pratinjau Langsung</span>
            </div>

            <div className="pd-preview-desc">
              {jenis === 'HARIAN' ? (
                <>
                  Penyewa yang terlambat lebih dari <strong>{masaTenggang} hari</strong> akan dikenakan
                  denda <strong>{rupiah(numPerHari)} per hari</strong>, maksimal{' '}
                  <strong>{rupiah(numMax)}</strong>.
                </>
              ) : jenis === 'FLAT' ? (
                <>
                  Penyewa yang terlambat lebih dari <strong>{masaTenggang} hari</strong> akan dikenakan
                  denda flat satu kali sebesar <strong>{rupiah(Number(nominal) || 0)}</strong>.
                </>
              ) : (
                <>Kos ini tidak memberlakukan sanksi denda keterlambatan pembayaran sewa.</>
              )}
            </div>

            {jenis === 'HARIAN' && (
              <div className="pd-simulasi-box">
                <div className="pd-simulasi-row">
                  <div className="pd-simulasi-lbl">Simulasi Keterlambatan 5 Hari:</div>
                  <div className="pd-simulasi-val">{rupiah(sim5)}</div>
                </div>
                <div className="pd-simulasi-row">
                  <div className="pd-simulasi-lbl">Simulasi Keterlambatan 15 Hari:</div>
                  <div className="pd-simulasi-val">
                    {rupiah(sim15)} {sim15 === numMax && '(Maks)'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Catatan Sistem Card */}
          <div className="pd-system-card">
            <div className="pd-system-head">
              <Clock size={16} className="text-muted" aria-hidden="true" />
              <span>Catatan Sistem</span>
            </div>
            <div className="pd-system-text">
              Perhitungan denda dilakukan secara otomatis pada pukul 00:00 WIB setelah masa tenggang
              terlewati. Notifikasi tagihan beserta denda akan langsung dikirim ke WhatsApp penyewa.
            </div>
          </div>

          {/* Submit Button & Disclaimer */}
          <div>
            <button
              type="button"
              className="pd-btn-submit"
              disabled={busy || !kos}
              onClick={simpan}
            >
              <Save size={16} aria-hidden="true" />
              <span>Simpan Aturan</span>
            </button>
            <p className="pd-submit-note" style={{ marginTop: 8 }}>
              Perubahan aturan hanya berlaku untuk tagihan berikutnya
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
