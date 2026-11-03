'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Check,
  Clock,
  DoorOpen,
  Fan,
  Flame,
  Hash,
  Home,
  Info,
  Lock,
  MapPin,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Snowflake,
  Star,
  Trash2,
  Wifi,
  Wind,
  X,
} from 'lucide-react';
import { del, get, patch, post, put } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { useKos } from '@/components/owner/useKos';
import { TambahKosSection } from '@/components/owner/TambahKosSection';
import type { ApiOwnerRoom } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

interface RoomItem extends ApiOwnerRoom {
  lantaiInfo?: string;
}

const initialRooms: RoomItem[] = [
  {
    id: 1,
    kosId: 1,
    nomor: '204',
    tipe: 'EKSKLUSIF',
    hargaBulanan: 1500000,
    luas: 14,
    fasilitas: '["AC","K. Mandi Dalam","WiFi","Kasur Queen"]',
    status: 'TERISI',
    lantaiInfo: 'Lantai 2 • Sayap Timur',
  },
  {
    id: 2,
    kosId: 1,
    nomor: '102',
    tipe: 'STANDAR',
    hargaBulanan: 1250000,
    luas: 9,
    fasilitas: '["Kipas Angin","K. Mandi Luar","WiFi"]',
    status: 'KOSONG',
    lantaiInfo: 'Lantai 1 • Sayap Barat',
  },
  {
    id: 3,
    kosId: 1,
    nomor: '305',
    tipe: 'EKSKLUSIF',
    hargaBulanan: 2100000,
    luas: 16,
    fasilitas: '["AC","K. Mandi Dalam","Water Heater","Balkon"]',
    status: 'DIPESAN',
    lantaiInfo: 'Lantai 3 • Sayap Selatan',
  },
];

const defaultAturanText = `1. Dilarang merokok di dalam kamar dan area tertutup.
2. Tamu lawan jenis dilarang menginap, batas berkunjung hingga pukul 22.00 WIB.
3. Menjaga ketenangan dan kebersihan bersama pada pukul 23.00 - 06.00 WIB.
4. Hemat energi listrik & air, matikan AC/alat elektronik saat meninggalkan kamar.
5. Pembayaran tagihan sewa wajib diselesaikan paling lambat tanggal 5 setiap bulannya.`;

export function KosSection() {
  const { kosList, kosId, setKosId, kos, loaded, error: kosError, muat, perbaruiDemo } = useKos();
  const [kamar, setKamar] = useState<RoomItem[]>(useMock ? initialRooms : []);
  const [form, setForm] = useState({
    nama: 'Kos Melati Putri',
    alamat: 'Jl. Setiabudi Timur No. 12, Jakarta Selatan',
    kodePos: '12910',
    aturanKos: defaultAturanText,
    tanggalJatuhTempo: 5,
  });

  const [roomModal, setRoomModal] = useState<{
    id?: number;
    nomor: string;
    lantaiInfo: string;
    tipe: 'STANDAR' | 'EKSKLUSIF';
    hargaBulanan: string;
    luas: string;
    fasilitas: string;
  } | null>(null);

  const [lastSaved, setLastSaved] = useState('hari ini pukul 09.30 WIB');
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'kelola' | 'baru'>('kelola');

  useEffect(() => {
    if (kos) {
      setForm({
        nama: kos.nama,
        alamat: kos.alamat,
        kodePos: kos.kodePos,
        aturanKos: kos.aturanKos || defaultAturanText,
        tanggalJatuhTempo: kos.tanggalJatuhTempo || 5,
      });
    }
  }, [kos]);

  const muatKamar = () => {
    if (!useMock && kosId) {
      get<ApiOwnerRoom[]>(`/api/kos/${kosId}/kamar`)
        .then((res) => {
          setKamar(
            res.map((r, i) => ({
              ...r,
              lantaiInfo:
                r.nomor === '204'
                  ? 'Lantai 2 • Sayap Timur'
                  : r.nomor === '102'
                  ? 'Lantai 1 • Sayap Barat'
                  : r.nomor === '305'
                  ? 'Lantai 3 • Sayap Selatan'
                  : `Lantai ${Math.floor(i / 4) + 1}`,
            }))
          );
        })
        .catch((e) => setError(e instanceof Error ? e.message : 'Daftar kamar belum berhasil dimuat.'));
    }
  };

  useEffect(() => {
    muatKamar();
  }, [kosId]);

  function handleReset() {
    if (kos) {
      setForm({
        nama: kos.nama,
        alamat: kos.alamat,
        kodePos: kos.kodePos,
        aturanKos: kos.aturanKos || defaultAturanText,
        tanggalJatuhTempo: kos.tanggalJatuhTempo || 5,
      });
    } else {
      setForm({
        nama: 'Kos Melati Putri',
        alamat: 'Jl. Setiabudi Timur No. 12, Jakarta Selatan',
        kodePos: '12910',
        aturanKos: defaultAturanText,
        tanggalJatuhTempo: 5,
      });
    }
    setOk('Formulir telah dikembalikan ke data awal.');
    setTimeout(() => setOk(''), 3000);
  }

  async function simpanKos() {
    setError('');
    setOk('');
    if (
      !form.nama.trim() ||
      !form.alamat.trim() ||
      !form.aturanKos.trim() ||
      !/^\d{5}$/.test(form.kodePos) ||
      !Number.isInteger(form.tanggalJatuhTempo) ||
      form.tanggalJatuhTempo < 1 ||
      form.tanggalJatuhTempo > 28
    ) {
      setError('Isi nama, alamat, aturan kos, kode pos 5 digit, dan tanggal jatuh tempo 1–28 dengan benar.');
      return;
    }
    setBusy(true);
    const body = {
      ...form,
      nama: form.nama.trim(),
      alamat: form.alamat.trim(),
      tanggalJatuhTempo: Number(form.tanggalJatuhTempo),
    };
    try {
      if (useMock) {
        if (kos) perbaruiDemo(kos.id, body);
      } else if (kos) {
        await put(`/api/kos/${kos.id}`, body);
      }
      const now = new Date();
      const timeStr = `hari ini pukul ${String(now.getHours()).padStart(2, '0')}.${String(
        now.getMinutes()
      ).padStart(2, '0')} WIB`;
      setLastSaved(timeStr);
      setOk('Perubahan data kos berhasil disimpan.');
      setTimeout(() => setOk(''), 4000);
      muat();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan data kos.');
    } finally {
      setBusy(false);
    }
  }

  async function simpanKamar() {
    if (!roomModal) return;
    setError('');
    setOk('');
    const facArr = roomModal.fasilitas
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const body = {
      nomor: roomModal.nomor.trim(),
      tipe: roomModal.tipe,
      hargaBulanan: Number(roomModal.hargaBulanan),
      luas: Number(roomModal.luas.replace(',', '.')),
      fasilitas: JSON.stringify(facArr),
    };

    if (!body.nomor || !Number.isFinite(body.hargaBulanan) || body.hargaBulanan <= 0) {
      setError('Nomor kamar wajib diisi dan harga bulanan harus berupa angka valid.');
      return;
    }
    if (kamar.some((k) => k.id !== roomModal.id && k.nomor.toLowerCase() === body.nomor.toLowerCase())) {
      setError('Nomor kamar sudah digunakan.');
      return;
    }
    setBusy(true);
    try {
      if (!useMock && kosId) {
        if (roomModal.id) await patch(`/api/kos/${kosId}/kamar/${roomModal.id}`, body);
        else await post(`/api/kos/${kosId}/kamar`, body);
        muatKamar();
      } else {
        setKamar((list) =>
          roomModal.id
            ? list.map((k) =>
                k.id === roomModal.id
                  ? { ...k, ...body, lantaiInfo: roomModal.lantaiInfo || k.lantaiInfo }
                  : k
              )
            : [
                ...list,
                {
                  ...body,
                  id: Math.max(0, ...list.map((k) => k.id)) + 1,
                  kosId: kosId || 1,
                  status: 'KOSONG',
                  lantaiInfo: roomModal.lantaiInfo || 'Lantai 1 • Sayap Baru',
                },
              ]
        );
      }
      setOk(roomModal.id ? 'Data kamar berhasil diperbarui.' : 'Kamar baru berhasil ditambahkan.');
      setTimeout(() => setOk(''), 4000);
      setRoomModal(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan kamar.');
    } finally {
      setBusy(false);
    }
  }

  async function hapusKamar(id: number, nomor: string) {
    const item = kamar.find((k) => k.id === id);
    if (!item) return;
    if (item.status === 'TERISI') {
      alert('Kamar terisi tidak dapat dihapus.');
      return;
    }
    if (!window.confirm(`Hapus Kamar ${nomor}?`)) return;

    setBusy(true);
    setError('');
    setOk('');
    try {
      if (!useMock && kosId) {
        await del(`/api/kos/${kosId}/kamar/${id}`);
        muatKamar();
      } else {
        setKamar((list) => list.filter((k) => k.id !== id));
      }
      setOk(`Kamar ${nomor} berhasil dihapus.`);
      setTimeout(() => setOk(''), 4000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus kamar.');
    } finally {
      setBusy(false);
    }
  }

  const parseFasilitasArr = (raw: string): string[] => {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [raw];
    } catch {
      return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  };

  const getFacIcon = (nama: string) => {
    const n = nama.toLowerCase();
    if (n.includes('ac')) return <Snowflake size={11} aria-hidden="true" />;
    if (n.includes('mandi') || n.includes('shower') || n.includes('luar')) return <Bath size={11} aria-hidden="true" />;
    if (n.includes('wifi')) return <Wifi size={11} aria-hidden="true" />;
    if (n.includes('kasur') || n.includes('queen') || n.includes('bed')) return <BedDouble size={11} aria-hidden="true" />;
    if (n.includes('kipas') || n.includes('angin')) return <Wind size={11} aria-hidden="true" />;
    if (n.includes('heater') || n.includes('hangat') || n.includes('water')) return <Flame size={11} aria-hidden="true" />;
    if (n.includes('balkon')) return <DoorOpen size={11} aria-hidden="true" />;
    return <BadgeCheck size={11} aria-hidden="true" />;
  };

  const countTerisi = kamar.filter((k) => k.status === 'TERISI').length;
  const countKosong = kamar.filter((k) => k.status === 'KOSONG').length;
  const countDipesan = kamar.filter((k) => k.status === 'DIPESAN').length;

  if (mode === 'baru') {
    return (
      <TambahKosSection
        onBatal={() => setMode('kelola')}
        onSuccess={() => {
          setMode('kelola');
          muat();
        }}
      />
    );
  }

  return (
    <div className="owner-kelola-container">
      {/* Header Sesuai Figma */}
      <header className="owner-kelola-head">
        <div className="owner-kelola-meta">
          <div className="owner-kelola-tag">
            <span>PROPERTI AKTIF</span>
            <span className="owner-kelola-tag-dot">•</span>
            <span>ID KOS: RM-88219</span>
          </div>
          <div className="owner-kelola-title-row">
            <h1 className="owner-kelola-title">Kelola Properti Kos</h1>
            <span className="owner-kelola-badge">
              <Check size={12} strokeWidth={3} aria-hidden="true" />
              TERVERIFIKASI
            </span>
          </div>
          <p className="owner-kelola-sub">
            Perbarui profil kos, aturan hunian, dan pantau ketersediaan kamar {kos?.nama || 'Kos Melati Putri'}.
          </p>
        </div>

        <div className="owner-kelola-head-right">
          <button
            type="button"
            className="owner-btn-tambah-kos"
            onClick={() => setMode('baru')}
          >
            <Plus size={15} aria-hidden="true" />
            <span>Tambah Kos</span>
          </button>

          <div className="owner-kelola-stats">
            <div className="owner-kelola-stat-pill">
              <div className="owner-kelola-stat-icon stat-icon-gray">
                <DoorOpen size={18} aria-hidden="true" />
              </div>
              <div>
                <div className="owner-kelola-stat-val">12/15</div>
                <div className="owner-kelola-stat-lbl">Okupansi Kamar</div>
              </div>
            </div>
            <div className="owner-kelola-stat-pill">
              <div className="owner-kelola-stat-icon stat-icon-amber">
                <Star size={18} fill="#D97706" aria-hidden="true" />
              </div>
              <div>
                <div className="owner-kelola-stat-val">4.9</div>
                <div className="owner-kelola-stat-lbl">Skor Kepuasan</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Alert status */}
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
      {kosError && (
        <div className="form-alert" role="alert">
          {kosError}
        </div>
      )}

      {/* Card 1: Data Kos */}
      <section className="owner-kelola-card">
        <div className="owner-kelola-card-head">
          <div className="owner-card-title-group">
            <div className="owner-card-title-row">
              <Building2 size={18} className="owner-card-title-icon" aria-hidden="true" />
              <h2 className="owner-card-h2">Data Kos</h2>
            </div>
            <p className="owner-card-sub">Informasi detail dan ketentuan umum kos Anda.</p>
          </div>
          <div className="owner-saved-pill">
            <Clock size={13} className="text-muted" aria-hidden="true" />
            <span>Perubahan terakhir disimpan {lastSaved}</span>
          </div>
        </div>

        <div className="owner-form-row-1">
          <div className="owner-form-field">
            <div className="owner-form-label-row">
              <label htmlFor="namaKosInput" className="owner-form-label">
                Nama Kos
              </label>
              <span className="owner-form-hint">Wajib diisi</span>
            </div>
            <div className="owner-input-wrap">
              <Home size={16} className="owner-input-icon" aria-hidden="true" />
              <input
                id="namaKosInput"
                type="text"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Kos Melati Putri"
              />
            </div>
          </div>

          <div className="owner-form-field">
            <div className="owner-form-label-row">
              <label htmlFor="jatuhTempoInput" className="owner-form-label">
                Tanggal Jatuh Tempo Bulanan
              </label>
              <span className="owner-form-hint">Siklus Penagihan</span>
            </div>
            <div className="owner-input-wrap">
              <Calendar size={16} className="owner-input-icon" aria-hidden="true" />
              <input
                id="jatuhTempoInput"
                type="number"
                min={1}
                max={28}
                value={form.tanggalJatuhTempo}
                onChange={(e) => setForm({ ...form, tanggalJatuhTempo: Number(e.target.value) })}
              />
            </div>
            <div className="owner-field-note">
              <Info size={13} className="text-muted" aria-hidden="true" />
              <span>Tanggal {form.tanggalJatuhTempo} setiap bulannya tagihan otomatis dikirim ke penghuni</span>
            </div>
          </div>
        </div>

        <div className="owner-form-row-2">
          <div className="owner-form-field">
            <div className="owner-form-label-row">
              <label htmlFor="alamatInput" className="owner-form-label">
                Alamat Lengkap
              </label>
            </div>
            <div className="owner-input-wrap">
              <MapPin size={16} className="owner-input-icon" aria-hidden="true" />
              <input
                id="alamatInput"
                type="text"
                value={form.alamat}
                onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                placeholder="Jl. Setiabudi Timur No. 12, Jakarta Selatan"
              />
            </div>
          </div>

          <div className="owner-form-field">
            <div className="owner-form-label-row">
              <label htmlFor="kodePosInput" className="owner-form-label">
                Kode Pos
              </label>
            </div>
            <div className="owner-input-wrap">
              <Hash size={16} className="owner-input-icon" aria-hidden="true" />
              <input
                id="kodePosInput"
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={form.kodePos}
                onChange={(e) => setForm({ ...form, kodePos: e.target.value })}
                placeholder="12910"
              />
            </div>
          </div>
        </div>

        <div className="owner-form-field">
          <div className="owner-form-label-row">
            <label htmlFor="aturanKosInput" className="owner-form-label">
              Aturan Hunian Kos
            </label>
            <span className="owner-form-hint">Ditampilkan di aplikasi penyewa</span>
          </div>
          <div className="owner-textarea-wrap">
            <textarea
              id="aturanKosInput"
              className="owner-textarea"
              rows={5}
              value={form.aturanKos}
              onChange={(e) => setForm({ ...form, aturanKos: e.target.value })}
            />
          </div>
        </div>

        <div className="owner-card-footer">
          <div className="owner-security-note">
            <ShieldCheck size={16} className="text-teal" aria-hidden="true" />
            <span>Semua data terenkripsi dan diverifikasi oleh tim RoomFinds</span>
          </div>
          <div className="owner-card-actions">
            <button type="button" className="owner-btn-reset" onClick={handleReset} disabled={busy}>
              Reset
            </button>
            <button type="button" className="owner-btn-save" onClick={simpanKos} disabled={busy}>
              <Save size={15} aria-hidden="true" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </section>

      {/* Card 2: Daftar Kamar */}
      <section className="owner-kelola-card">
        <div className="owner-kelola-card-head">
          <div className="owner-card-title-group">
            <div className="owner-kamar-title-row">
              <h2 className="owner-card-h2">Daftar Kamar</h2>
              <span className="owner-kamar-badge">Total {kamar.length} Kamar Ditampilkan</span>
            </div>
            <p className="owner-card-sub">Manajemen unit, status ketersediaan, dan fasilitas aktif kamar.</p>
          </div>
          <button
            type="button"
            className="owner-btn-add-kamar"
            onClick={() =>
              setRoomModal({
                nomor: '',
                lantaiInfo: 'Lantai 1 • Sayap Baru',
                tipe: 'STANDAR',
                hargaBulanan: '1250000',
                luas: '10',
                fasilitas: 'WiFi, K. Mandi Dalam, AC',
              })
            }
          >
            <Plus size={16} aria-hidden="true" />
            <span>Tambah Kamar</span>
          </button>
        </div>

        <div className="owner-kamar-table-wrap">
          <table className="owner-kamar-table">
            <thead>
              <tr>
                <th>NOMOR</th>
                <th>TIPE</th>
                <th>HARGA PER BULAN</th>
                <th>FASILITAS</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'center' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {kamar.map((k) => {
                const facList = parseFasilitasArr(k.fasilitas);
                const isTerisi = k.status === 'TERISI';
                const isKosong = k.status === 'KOSONG';
                const isDipesan = k.status === 'DIPESAN';

                return (
                  <tr key={k.id}>
                    <td>
                      <div className="owner-kamar-cell">
                        <div className="owner-kamar-icon-box">
                          <BedDouble size={18} aria-hidden="true" />
                        </div>
                        <div>
                          <div className="owner-kamar-num">Kamar {k.nomor}</div>
                          <div className="owner-kamar-floor">
                            {k.lantaiInfo ||
                              (k.nomor === '204'
                                ? 'Lantai 2 • Sayap Timur'
                                : k.nomor === '102'
                                ? 'Lantai 1 • Sayap Barat'
                                : 'Lantai 3 • Sayap Selatan')}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="owner-tipe-pill">
                        {k.tipe === 'EKSKLUSIF' ? 'Eksklusif' : 'Standar'}
                      </span>
                    </td>

                    <td>
                      <div className="owner-kamar-price">{rupiah(k.hargaBulanan)}</div>
                      <div className="owner-kamar-price-sub">/ bulan</div>
                    </td>

                    <td>
                      <div className="owner-fac-stack">
                        {facList.map((f, idx) => (
                          <span key={idx} className="owner-fac-pill">
                            {getFacIcon(f)}
                            <span>{f}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`owner-kamar-status ${
                          isTerisi ? 'status-terisi' : isKosong ? 'status-kosong' : 'status-dipesan'
                        }`}
                      >
                        <span className="status-dot" aria-hidden="true" />
                        {isTerisi ? 'Terisi' : isKosong ? 'Kosong' : 'Dipesan'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div className="owner-kamar-actions" style={{ justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="owner-kamar-btn-edit"
                          onClick={() =>
                            setRoomModal({
                              id: k.id,
                              nomor: k.nomor,
                              lantaiInfo:
                                k.lantaiInfo ||
                                (k.nomor === '204'
                                  ? 'Lantai 2 • Sayap Timur'
                                  : k.nomor === '102'
                                  ? 'Lantai 1 • Sayap Barat'
                                  : 'Lantai 3 • Sayap Selatan'),
                              tipe: k.tipe,
                              hargaBulanan: String(k.hargaBulanan),
                              luas: String(k.luas),
                              fasilitas: facList.join(', '),
                            })
                          }
                        >
                          <Pencil size={12} aria-hidden="true" />
                          <span>Edit</span>
                        </button>

                        {isTerisi ? (
                          <button
                            type="button"
                            className="owner-kamar-btn-locked"
                            title="Kamar terisi tidak dapat dihapus"
                            disabled
                          >
                            <Lock size={12} aria-hidden="true" />
                            <span>Hapus</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="owner-kamar-btn-delete"
                            onClick={() => hapusKamar(k.id, k.nomor)}
                          >
                            <Trash2 size={12} aria-hidden="true" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="owner-kamar-footer">
          <div className="owner-kamar-summary">
            <span className="owner-summary-item" style={{ color: '#0F766E' }}>
              <span className="status-dot" aria-hidden="true" />
              Terisi: {countTerisi}
            </span>
            <span className="owner-summary-item" style={{ color: '#15803D' }}>
              <span className="status-dot" aria-hidden="true" />
              Kosong: {countKosong}
            </span>
            <span className="owner-summary-item" style={{ color: '#B45309' }}>
              <span className="status-dot" aria-hidden="true" />
              Dipesan: {countDipesan}
            </span>
          </div>
          <div>Menampilkan {kamar.length} dari {kamar.length} kamar terdaftar</div>
        </div>
      </section>

      {/* Modal Add / Edit Kamar */}
      {roomModal && (
        <div className="owner-kamar-modal-overlay" role="dialog" aria-modal="true">
          <div className="owner-kamar-modal">
            <div className="owner-kamar-modal-head">
              <h3 className="owner-kamar-modal-title">
                {roomModal.id ? `Edit Kamar ${roomModal.nomor}` : 'Tambah Kamar Baru'}
              </h3>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setRoomModal(null)}
                aria-label="Tutup"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label>Nomor Kamar</label>
                <input
                  type="text"
                  value={roomModal.nomor}
                  onChange={(e) => setRoomModal({ ...roomModal, nomor: e.target.value })}
                  placeholder="cth. 204"
                />
              </div>
              <div className="field">
                <label>Tipe Kamar</label>
                <select
                  value={roomModal.tipe}
                  onChange={(e) =>
                    setRoomModal({
                      ...roomModal,
                      tipe: e.target.value as 'STANDAR' | 'EKSKLUSIF',
                    })
                  }
                >
                  <option value="STANDAR">Standar</option>
                  <option value="EKSKLUSIF">Eksklusif</option>
                </select>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label>Harga Bulanan (Rp)</label>
                <input
                  type="number"
                  min={1}
                  value={roomModal.hargaBulanan}
                  onChange={(e) => setRoomModal({ ...roomModal, hargaBulanan: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Lantai & Sayap</label>
                <input
                  type="text"
                  value={roomModal.lantaiInfo}
                  onChange={(e) => setRoomModal({ ...roomModal, lantaiInfo: e.target.value })}
                  placeholder="cth. Lantai 2 • Sayap Timur"
                />
              </div>
            </div>

            <div className="field">
              <label>Fasilitas (pisahkan dengan koma)</label>
              <input
                type="text"
                value={roomModal.fasilitas}
                onChange={(e) => setRoomModal({ ...roomModal, fasilitas: e.target.value })}
                placeholder="AC, K. Mandi Dalam, WiFi, Kasur Queen"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setRoomModal(null)}>
                Batal
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={simpanKamar}
                disabled={busy || !roomModal.nomor}
              >
                Simpan Kamar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
