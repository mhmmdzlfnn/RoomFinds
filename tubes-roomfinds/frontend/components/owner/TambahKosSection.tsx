'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Calendar,
  Check,
  DoorOpen,
  Home,
  Info,
  MapPin,
  Plus,
} from 'lucide-react';
import { post } from '@/lib/api';
import { demoQueue } from '@/app/admin/demo';
import { useKos } from '@/components/owner/useKos';
import { Sukses } from '@/components/owner/DashboardModals';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

interface TambahKosSectionProps {
  onBatal?: () => void;
  onSuccess?: () => void;
}

export function TambahKosSection({ onBatal, onSuccess }: TambahKosSectionProps) {
  const router = useRouter();
  const { muat } = useKos();

  const [form, setForm] = useState({
    nama: '',
    tanggalJatuhTempo: 5,
    kodePos: '',
    alamat: '',
    aturanKos: '',
  });

  const [error, setError] = useState('');
  const [terdaftar, setTerdaftar] = useState<{ nama: string; kodePos: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function handleBatal() {
    if (onBatal) {
      onBatal();
    } else {
      router.push('/pemilik/kos');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setTerdaftar(null);

    if (!form.nama.trim()) {
      setError('Nama kos wajib diisi.');
      return;
    }

    const tempo = Number(form.tanggalJatuhTempo);
    if (!Number.isInteger(tempo) || tempo < 1 || tempo > 28) {
      setError('Tanggal jatuh tempo bulanan harus antara tanggal 1 sampai 28.');
      return;
    }

    const zip = form.kodePos.trim();
    const zipNum = Number(zip);
    if (!/^\d{5}$/.test(zip) || zipNum < 12110 || zipNum > 12980) {
      setError(
        'Kode pos harus berupa 5 digit dan berada di wilayah Jakarta Selatan (12110 sampai 12980).'
      );
      return;
    }

    if (!form.alamat.trim()) {
      setError('Alamat lengkap wajib diisi.');
      return;
    }

    if (!form.aturanKos.trim()) {
      setError('Aturan hunian kos wajib diisi.');
      return;
    }

    setBusy(true);

    const body = {
      nama: form.nama.trim(),
      tanggalJatuhTempo: tempo,
      kodePos: zip,
      alamat: form.alamat.trim(),
      aturanKos: form.aturanKos.trim(),
    };

    try {
      if (useMock) {
        // Tambahkan ke antrean demo SuperAdmin agar terintegrasi
        demoQueue.push({
          id: Date.now(),
          nama: body.nama,
          alamat: body.alamat,
          kodePos: body.kodePos,
          aturanKos: body.aturanKos,
          statusVerifikasi: 'MENUNGGU',
          jumlahKamar: 0,
          pemilikNama: 'Fariz',
          pemilikEmail: 'fariz@email.com',
          dibuatPada: new Date().toISOString(),
        });
      } else {
        await post('/api/kos', body);
        muat();
      }

      setTerdaftar({ nama: body.nama, kodePos: body.kodePos });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftarkan kos baru.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="owner-kelola-container">
      {/* ── Page Header ── */}
      <header className="owner-tk-head">
        <h1 className="owner-tk-title">Tambah Kos Baru</h1>
        <p className="owner-tk-sub">
          Lengkapi data kos baru Anda. Kos yang didaftarkan akan diperiksa SuperAdmin sebelum
          tampil di pencarian.
        </p>
      </header>

      {/* Alerts */}
      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      {/* ── Card 1: Data Kos ── */}
      <section className="owner-kelola-card">
        <div className="owner-card-title-row" style={{ marginBottom: 20 }}>
          <div className="owner-tk-card-icon">
            <Building2 size={16} aria-hidden="true" />
          </div>
          <h2 className="owner-card-h2">Data Kos</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Field 1: Nama Kos */}
          <div className="owner-form-field" style={{ marginBottom: 18 }}>
            <label htmlFor="tk-nama" className="owner-form-label" style={{ marginBottom: 7 }}>
              Nama Kos
            </label>
            <div className="owner-input-wrap">
              <input
                id="tk-nama"
                type="text"
                placeholder="Contoh: Kos Melati Putri"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Row 2: Tanggal Jatuh Tempo & Kode Pos */}
          <div className="owner-form-row-1">
            <div className="owner-form-field">
              <label htmlFor="tk-tempo" className="owner-form-label" style={{ marginBottom: 7 }}>
                Tanggal Jatuh Tempo Bulanan
              </label>
              <div className="owner-input-wrap" style={{ position: 'relative' }}>
                <input
                  id="tk-tempo"
                  type="number"
                  min={1}
                  max={28}
                  value={form.tanggalJatuhTempo}
                  onChange={(e) =>
                    setForm({ ...form, tanggalJatuhTempo: Number(e.target.value) })
                  }
                  required
                />
                <span className="owner-tk-affix">hari tiap bulan</span>
              </div>
            </div>

            <div className="owner-form-field">
              <label htmlFor="tk-kodepos" className="owner-form-label" style={{ marginBottom: 7 }}>
                Kode Pos
              </label>
              <div className="owner-input-wrap">
                <input
                  id="tk-kodepos"
                  type="text"
                  placeholder="Contoh: 12910"
                  maxLength={5}
                  value={form.kodePos}
                  onChange={(e) => setForm({ ...form, kodePos: e.target.value })}
                  required
                />
              </div>
              <div className="owner-field-hint" style={{ marginTop: 5, fontSize: 11, color: '#64748B' }}>
                Kode pos harus berada di Jakarta Selatan (12110 sampai 12980)
              </div>
            </div>
          </div>

          {/* Field 3: Alamat Lengkap */}
          <div className="owner-form-field" style={{ marginBottom: 18 }}>
            <label htmlFor="tk-alamat" className="owner-form-label" style={{ marginBottom: 7 }}>
              Alamat Lengkap
            </label>
            <div className="owner-input-wrap">
              <input
                id="tk-alamat"
                type="text"
                placeholder="Contoh: Jl. Setiabudi Timur No. 12, Jakarta Selatan"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Field 4: Aturan Hunian Kos */}
          <div className="owner-form-field" style={{ marginBottom: 18 }}>
            <label htmlFor="tk-aturan" className="owner-form-label" style={{ marginBottom: 7 }}>
              Aturan Hunian Kos
            </label>
            <div className="owner-textarea-wrap">
              <textarea
                id="tk-aturan"
                rows={4}
                placeholder="Tulis aturan hunian kos, satu aturan per baris."
                value={form.aturanKos}
                onChange={(e) => setForm({ ...form, aturanKos: e.target.value })}
                required
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 0,
                  outline: 'none',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  color: '#1E293B',
                  resize: 'vertical',
                  minHeight: 80,
                }}
              />
            </div>
          </div>

          {/* Info Notice Box */}
          <div className="owner-tk-info-box">
            <Info size={16} className="text-muted" style={{ flex: 'none', marginTop: 1 }} aria-hidden="true" />
            <span>
              Kos baru berstatus <strong>MENUNGGU</strong> dan tidak tampil di pencarian sampai disetujui
              SuperAdmin. Hanya kos di Jakarta Selatan yang dapat disetujui.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="owner-tk-actions">
            <button
              type="button"
              className="owner-btn-batal"
              onClick={handleBatal}
              disabled={busy}
            >
              Batal
            </button>
            <button
              type="submit"
              className="owner-btn-tambah-kos"
              disabled={busy}
              style={{ height: 42, padding: '0 24px', fontSize: 13.5 }}
            >
              {busy ? 'Mendaftarkan…' : 'Daftarkan Kos'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Card 2: Daftar Kamar ── */}
      <section className="owner-kelola-card">
        <div className="owner-kelola-card-head" style={{ marginBottom: 16 }}>
          <div className="owner-card-title-row">
            <div className="owner-tk-card-icon" style={{ background: '#F1F5F9', color: '#475569' }}>
              <DoorOpen size={16} aria-hidden="true" />
            </div>
            <h2 className="owner-card-h2">Daftar Kamar</h2>
          </div>
          <button
            type="button"
            className="owner-btn-tambah-kos"
            disabled
            style={{
              opacity: 0.5,
              cursor: 'not-allowed',
              background: '#F1F5F9',
              color: '#94A3B8',
              border: '1px solid #E2E8F0',
            }}
          >
            <Plus size={14} aria-hidden="true" />
            <span>Tambah Kamar</span>
          </button>
        </div>

        <div className="owner-tk-empty-box">
          <DoorOpen size={30} strokeWidth={1.5} className="text-muted" aria-hidden="true" />
          <div className="owner-tk-empty-text">
            Belum ada kamar. Kamar dapat ditambah setelah kos disimpan.
          </div>
        </div>
      </section>
      {terdaftar && (
        <Sukses
          judul="Kos Berhasil Didaftarkan"
          sub="Kos baru sudah terkirim ke SuperAdmin untuk diverifikasi dan belum tampil di pencarian."
          ikon={<Check size={28} strokeWidth={3} aria-hidden="true" />}
          onClose={() => { setTerdaftar(null); if (onSuccess) onSuccess(); else router.push('/pemilik/kos'); }}
        >
          <dl className="fx-modal-summary">
            <div><dt>Nama Kos:</dt><dd>{terdaftar.nama}</dd></div>
            <div><dt>Kode Pos:</dt><dd>{terdaftar.kodePos}</dd></div>
            <div><dt>Status:</dt><dd><span className="fx-modal-status-wait">MENUNGGU</span></dd></div>
          </dl>
        </Sukses>
      )}
    </div>
  );
}
