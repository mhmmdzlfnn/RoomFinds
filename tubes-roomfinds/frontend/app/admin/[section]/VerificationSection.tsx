'use client';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckSquare,
  Info,
  ListChecks,
  ShieldCheck,
  Slash,
} from 'lucide-react';
import { get, patch } from '@/lib/api';
import { demoQueue, type AdminKos } from '../demo';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const kodePosJaksel = (value: string) =>
  /^\d{5}$/.test(value) && Number(value) >= 12110 && Number(value) <= 12980;
const diJaksel = (kos: AdminKos) =>
  kodePosJaksel(kos.kodePos) && !/\bjakarta\s+(barat|timur|utara|pusat)\b/i.test(kos.alamat);

const kelengkapan = (kos: AdminKos) => [
  { label: 'Nama kos', checked: Boolean(kos.nama.trim()) },
  { label: 'Alamat lengkap', checked: Boolean(kos.alamat.trim()) },
  { label: 'Kode pos Jakarta Selatan', checked: diJaksel(kos) },
  { label: 'Daftar kamar', checked: kos.jumlahKamar > 0 },
  { label: 'Aturan kos', checked: Boolean(kos.aturanKos?.trim()) },
];

function getInitials(nama: string) {
  return nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function VerificationSection() {
  const [list, setList] = useState<AdminKos[]>(useMock ? demoQueue : []);
  const [loading, setLoading] = useState(!useMock);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [catatanMap, setCatatanMap] = useState<Record<number, string>>({});
  const [showChecklist, setShowChecklist] = useState<Record<number, boolean>>({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const flash = (msg: string) => {
    setOk(msg);
    setTimeout(() => setOk(''), 4000);
  };

  useEffect(() => {
    if (useMock) return;
    let active = true;
    get<AdminKos[]>('/api/admin/kos?status=MENUNGGU')
      .then((data) => {
        if (active) setList(data);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Antrean verifikasi belum berhasil dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function putuskan(kos: AdminKos, disetujui: boolean) {
    if (busyId !== null || kos.statusVerifikasi !== 'MENUNGGU') return;
    setError('');
    setOk('');
    const note = (catatanMap[kos.id] ?? '').trim();

    if (disetujui && !kelengkapan(kos).every((item) => item.checked)) {
      setError(
        kos.jumlahKamar === 0
          ? 'Belum ada kamar, tidak dapat disetujui'
          : !diJaksel(kos)
          ? 'Hanya kos di Jakarta Selatan yang dapat disetujui.'
          : 'Lengkapi seluruh data kos sebelum menyetujui.'
      );
      return;
    }
    if (!disetujui && !note) {
      setError('Catatan alasan keputusan wajib diisi.');
      return;
    }

    setBusyId(kos.id);
    try {
      const response = useMock
        ? undefined
        : await patch<AdminKos | undefined>(`/api/admin/kos/${kos.id}/verifikasi`, {
            disetujui,
            catatan: note || 'Data kos lengkap dan memenuhi syarat.',
          });
      const waktu = new Date().toISOString();
      setList((items) =>
        items.map((item) =>
          item.id === kos.id
            ? {
                ...item,
                ...response,
                statusVerifikasi: response?.statusVerifikasi ?? (disetujui ? 'TERVERIFIKASI' : 'DITOLAK'),
                catatanVerifikasi: response?.catatanVerifikasi ?? note,
                diverifikasiPada: response?.diverifikasiPada ?? waktu,
              }
            : item
        )
      );
      flash(`${kos.nama} berhasil ${disetujui ? 'disetujui dan berstatus Terverifikasi' : 'ditolak'}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Keputusan verifikasi belum berhasil disimpan.');
    } finally {
      setBusyId(null);
    }
  }

  const ordered = [...list].sort(
    (a, b) => new Date(a.dibuatPada).getTime() - new Date(b.dibuatPada).getTime()
  );

  return (
    <div className="admin-vk-container">
      {/* ── Page Header ── */}
      <header className="admin-vk-head">
        <div className="admin-vk-head-left">
          <div className="admin-vk-badge-tag">
            <ShieldCheck size={14} className="text-teal" aria-hidden="true" />
            <span>MODUL SUPERADMIN</span>
          </div>
          <h1 className="admin-vk-title">Verifikasi Kos</h1>
        </div>

        <div className="admin-vk-order-pill">
          <Info size={15} aria-hidden="true" />
          <span>Antrean diurutkan dari pengajuan tertua</span>
        </div>
      </header>

      {/* Alerts */}
      {ok && (
        <div className="success-inline" role="status">
          ✅ {ok}
        </div>
      )}
      {error && (
        <div className="form-alert" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <p className="muted" role="status" style={{ padding: '16px 0' }}>
          Memuat antrean verifikasi…
        </p>
      )}

      {!loading && !error && ordered.length === 0 && (
        <div className="admin-vk-card">
          <p className="muted">Tidak ada kos menunggu verifikasi.</p>
        </div>
      )}

      {/* ── Kos Cards List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {ordered.map((kos) => {
          const checks = kelengkapan(kos);
          const allChecked = checks.every((item) => item.checked);
          const isDahlia = kos.nama.toLowerCase().includes('dahlia');
          const initials = getInitials(kos.nama);

          const tanggalLabel =
            kos.id === 3
              ? '20 Oktober 2026'
              : kos.id === 4
              ? '21 Oktober 2026'
              : new Intl.DateTimeFormat('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(kos.dibuatPada));

          return (
            <section className="admin-vk-card" key={kos.id}>
              {/* Card Top Meta */}
              <div className="admin-vk-card-top">
                <div className="admin-vk-card-meta-left">
                  <div
                    className={`admin-vk-avatar-kos ${
                      isDahlia ? 'avatar-kos-teal' : 'avatar-kos-peach'
                    }`}
                  >
                    {initials}
                  </div>
                  <div>
                    <div className="admin-vk-kos-name-row">
                      <h2 className="admin-vk-kos-name">{kos.nama}</h2>
                      {isDahlia ? (
                        <span className="admin-vk-pill-status pill-menunggu-teal">
                          Menunggu Verifikasi
                        </span>
                      ) : (
                        <span className="admin-vk-pill-status pill-perhatian">
                          Perhatian Khusus
                        </span>
                      )}
                    </div>
                    <div className="admin-vk-kos-sub">
                      Pemilik: <strong>{kos.pemilikNama}</strong> • Diajukan: {tanggalLabel}
                    </div>
                    <div className="admin-vk-kos-addr">
                      {kos.alamat}, {kos.kodePos}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="admin-vk-btn-checklist"
                  onClick={() =>
                    setShowChecklist((prev) => ({ ...prev, [kos.id]: !prev[kos.id] }))
                  }
                >
                  <ListChecks size={15} aria-hidden="true" />
                  <span>Detail Checklist</span>
                </button>
              </div>

              {/* Collapsible Checklist */}
              {showChecklist[kos.id] && (
                <div className="admin-vk-checklist-box">
                  <div className="admin-vk-checklist-title">Checklist Kelengkapan Data:</div>
                  <ul className="checklist">
                    {checks.map((item) => (
                      <li
                        key={item.label}
                        className={item.checked ? undefined : 'todo'}
                        aria-label={`${item.label}: ${item.checked ? 'lengkap' : 'belum lengkap'}`}
                      >
                        {item.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warning Alert if no rooms */}
              {kos.jumlahKamar === 0 && (
                <div className="admin-vk-alert-box" role="alert">
                  <AlertTriangle size={18} aria-hidden="true" />
                  <span>Belum ada kamar, tidak dapat disetujui</span>
                </div>
              )}

              {/* Catatan Field */}
              <div className="admin-vk-field">
                <label className="admin-vk-label">Catatan keputusan (wajib diisi)</label>
                <textarea
                  className="admin-vk-textarea"
                  placeholder={
                    isDahlia
                      ? 'Tuliskan catatan atau alasan keputusan verifikasi di sini...'
                      : 'Tuliskan catatan alasan penolakan...'
                  }
                  value={catatanMap[kos.id] ?? ''}
                  onChange={(e) =>
                    setCatatanMap((prev) => ({ ...prev, [kos.id]: e.target.value }))
                  }
                />
              </div>

              <div className="admin-vk-note">
                Setiap keputusan disimpan beserta catatan dan waktunya sebagai jejak audit
              </div>

              {/* Action Buttons */}
              <div className="admin-vk-actions">
                <button
                  type="button"
                  className="admin-vk-btn-tolak"
                  disabled={busyId !== null}
                  onClick={() => putuskan(kos, false)}
                >
                  Tolak
                </button>
                <button
                  type="button"
                  className="admin-vk-btn-setujui"
                  disabled={busyId !== null || !allChecked}
                  onClick={() => putuskan(kos, true)}
                >
                  {allChecked ? (
                    <Check size={16} strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <Slash size={14} aria-hidden="true" />
                  )}
                  <span>Setujui</span>
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
