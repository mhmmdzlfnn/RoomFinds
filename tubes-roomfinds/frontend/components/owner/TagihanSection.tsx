'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  Calendar,
  CheckCircle2,
  Info,
  ChevronDown,
  Clock,
  FileText,
  Plus,
  Save,
  Search,
  Zap,
} from 'lucide-react';
import { get, post } from '@/lib/api';
import { rupiah, periodeLabel } from '@/lib/format';
import { useKos } from '@/components/owner/useKos';
import { DemoNotice, demoTagihan } from '@/components/owner/demo';
import { Dialog } from '@/components/owner/DashboardModals';
import type { ApiBill, ItemTagihan } from '@/types';
import { NotifSukses } from '@/components/NotifSukses';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const tarif = 1500;
const angkaMeter = (value: string) => (value.trim() ? Number(value.replace(',', '.')) : NaN);
const formatMeter = (value: number) =>
  value.toLocaleString('id-ID', { useGrouping: false, minimumFractionDigits: 1, maximumFractionDigits: 1 });

function enamBulan(): string[] {
  const hasil: string[] = [];
  const d = new Date(2026, 9, 1);
  for (let i = 5; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    hasil.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
  }
  return hasil;
}

const userPhoneMap: Record<string, string> = {
  'Zulfan': '+62 812-3456-7891',
  'Rina Aulia': '+62 812-3456-7894',
  'Dimas Pratama': '+62 812-3456-7895',
  'Siti Aminah': '+62 812-3456-7896',
  'Rian Hidayat': '+62 812-3456-7897',
  'Nabila Putri': '+62 812-3456-7898',
};

const userRoomTypeMap: Record<string, string> = {
  '204': 'Eksklusif',
  '102': 'Standar',
  '305': 'Eksklusif',
  '207': 'Standar',
  '103': 'Standar',
  '105': 'Standar',
};

function getAvatarMeta(nama: string): { initials: string; bg: string; color: string } {
  const initials = nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (initials === 'BS') return { initials, bg: '#2B2B2B', color: '#fff' };
  if (initials === 'RA') return { initials, bg: '#C6F432', color: '#111111' };
  if (initials === 'DP') return { initials, bg: '#FEE2E2', color: '#B91C1C' };
  return { initials, bg: '#E2E8F0', color: '#334155' };
}

export function TagihanSection() {
  const { kosId, kos, error: kosError } = useKos();
  const bulan = enamBulan();
  const [periode, setPeriode] = useState('2026-10');
  const [list, setList] = useState<ApiBill[]>(useMock ? demoTagihan : []);
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [meteranId, setMeteranId] = useState('');
  const [awal, setAwal] = useState('1240,0');
  const [akhir, setAkhir] = useState('1302,5');
  const [loading, setLoading] = useState(!useMock);
  const [searchQuery, setSearchQuery] = useState('');
  const [konfirmasi, setKonfirmasi] = useState(false);

  const flash = (msg: string) => {
    setOk(msg);
    setTimeout(() => setOk(''), 4000);
  };

  const muat = () => {
    if (useMock) return;
    if (!kosId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return get<ApiBill[]>(`/api/kos/${kosId}/tagihan?periode=${periode}`)
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : 'Tagihan belum berhasil dimuat.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setError('');
    setOk('');
    if (!useMock) setList([]);
    muat();
  }, [kosId, periode]);

  const tampil = useMemo(() => {
    const raw = useMock ? list.filter((b) => b.periode.slice(0, 7) === periode) : list;
    if (!searchQuery.trim()) return raw;
    const q = searchQuery.toLowerCase();
    return raw.filter(
      (b) =>
        (b.penyewaNama ?? '').toLowerCase().includes(q) ||
        (b.kamarNomor ?? '').toLowerCase().includes(q)
    );
  }, [list, periode, searchQuery]);

  const tanpaMeteran = useMemo(() => {
    const raw = useMock ? list.filter((b) => b.periode.slice(0, 7) === periode) : list;
    return raw.filter((b) => b.meteranAkhir == null && b.status !== 'LUNAS');
  }, [list, periode]);

  useEffect(() => {
    const b = tanpaMeteran[0];
    if (b) {
      setMeteranId(String(b.id));
      setAwal(formatMeter(b.meteranAwal ?? 1240));
      setAkhir(useMock ? formatMeter((b.meteranAwal ?? 1240) + 62.5) : '');
    }
  }, [tanpaMeteran]);

  // Stat calculations
  const totalTagihanAmt = useMemo(() => tampil.reduce((sum, b) => sum + b.total, 0), [tampil]);
  const sudahLunasAmt = useMemo(
    () => tampil.filter((b) => b.status === 'LUNAS').reduce((sum, b) => sum + b.total, 0),
    [tampil]
  );
  const belumBayarAmt = useMemo(
    () => tampil.filter((b) => b.status === 'BELUM_BAYAR').reduce((sum, b) => sum + b.sisa, 0),
    [tampil]
  );
  const terlambatAmt = useMemo(
    () => tampil.filter((b) => b.status === 'TERLAMBAT').reduce((sum, b) => sum + b.total, 0),
    [tampil]
  );
  const jumlahLunas = tampil.filter((b) => b.status === 'LUNAS').length;
  const jumlahBelumBayar = tampil.filter((b) => b.status === 'BELUM_BAYAR').length;
  const jumlahTerlambat = tampil.filter((b) => b.status === 'TERLAMBAT').length;

  const meterAwal = angkaMeter(awal);
  const meterAkhir = angkaMeter(akhir);
  const meterValid =
    Number.isFinite(meterAwal) && Number.isFinite(meterAkhir) && meterAwal >= 0 && meterAkhir >= meterAwal;
  const pakai = meterValid ? Math.round((meterAkhir - meterAwal) * 1000) / 1000 : 0;

  async function terbitkan() {
    if (!kosId || busy || loading) return;
    setBusy(true);
    setError('');
    setOk('');
    try {
      if (useMock) {
        if (tampil.length) {
          flash(`Tagihan ${periodeLabel(periode)} sudah tersedia.`);
          return;
        }
        const [tahun, bln] = periode.split('-').map(Number);
        const jatuhTempo = `${tahun}-${String(bln).padStart(2, '0')}-${String(
          kos?.tanggalJatuhTempo ?? 5
        ).padStart(2, '0')}`;
        const firstId = Math.max(0, ...list.map((b) => b.id)) + 1;
        const baru = demoTagihan.map(
          (b, i): ApiBill => ({
            ...b,
            id: firstId + i,
            periode,
            jatuhTempo,
            terbayar: 0,
            denda: 0,
            total: b.items.reduce((sum, item) => sum + item.subtotal, 0),
            sisa: b.items.reduce((sum, item) => sum + item.subtotal, 0),
            status: 'BELUM_BAYAR',
            meteranAkhir: null,
          })
        );
        setList((prev) => [...prev, ...baru]);
        flash(`${baru.length} tagihan diterbitkan dalam demo untuk ${periodeLabel(periode)}.`);
      } else {
        const baru = await post<ApiBill[]>(`/api/kos/${kosId}/tagihan/terbitkan?periode=${periode}`);
        flash(`${baru.length} tagihan berhasil diterbitkan untuk ${periodeLabel(periode)}.`);
        await muat();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menerbitkan tagihan.');
    } finally {
      setBusy(false);
    }
  }

  async function simpanMeteran() {
    if (busy || !meteranId) return;
    setError('');
    setOk('');
    if (!meterValid) {
      setError('Isi angka meteran yang valid. Meteran akhir tidak boleh lebih kecil dari meteran awal.');
      return;
    }
    setBusy(true);
    try {
      if (!useMock) {
        await post(`/api/tagihan/${meteranId}/meteran`, {
          meteranAwal: meterAwal,
          meteranAkhir: meterAkhir,
        });
      } else {
        setList((prev) =>
          prev.map((b) => {
            if (String(b.id) !== meteranId) return b;
            const lama = b.items.filter(
              (item) => item.jenis === 'PEMAKAIAN' && item.keterangan.toLowerCase().includes('listrik')
            );
            const listrik: ItemTagihan = {
              jenis: 'PEMAKAIAN',
              keterangan: 'Listrik',
              subtotal: pakai * tarif,
              meteranAwal: meterAwal,
              meteranAkhir: meterAkhir,
              tarifPerUnit: tarif,
              satuan: 'kWh',
            };
            const total = b.total - lama.reduce((sum, item) => sum + item.subtotal, 0) + listrik.subtotal;
            const sisa = Math.max(0, total - b.terbayar);
            return {
              ...b,
              meteranAwal: meterAwal,
              meteranAkhir: meterAkhir,
              items: [...b.items.filter((item) => !lama.includes(item)), listrik],
              total,
              sisa,
              status: sisa === 0 ? 'LUNAS' : b.status,
            };
          })
        );
      }
      flash('Meteran berhasil disimpan dan biaya tagihan utilitas telah diperbarui.');
      await muat();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan meteran.');
    } finally {
      setBusy(false);
    }
  }

  const selectedBill = list.find((b) => String(b.id) === meteranId);

  return (
    <div className="kt-container">
      {/* ── Page Header ── */}
      <header className="kt-header">
        <div className="kt-header-left">
          <h1 className="kt-title">Kelola Tagihan Penghuni</h1>
          <p className="kt-sub">Pantau status pembayaran sewa bulanan dan catat meteran utilitas kamar.</p>
        </div>

        <div className="kt-header-actions">
          <div className="kt-period-select-wrap">
            <Calendar size={16} className="text-teal" aria-hidden="true" />
            <span>{periodeLabel(periode)}</span>
            <ChevronDown size={14} className="muted" aria-hidden="true" />
            <select
              value={periode}
              disabled={busy}
              onChange={(e) => setPeriode(e.target.value)}
              aria-label="Pilih Periode Tagihan"
            >
              {bulan.map((b) => (
                <option key={b} value={b}>
                  {periodeLabel(b)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="kt-btn-terbitkan"
            disabled={busy || loading || !kosId}
            onClick={() => setKonfirmasi(true)}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Terbitkan Tagihan Bulan Ini</span>
          </button>
        </div>
      </header>

      {/* Alerts */}
      <NotifSukses pesan={ok} onClose={() => setOk('')} />
      {(error || kosError) && (
        <div className="form-alert" role="alert">
          {error || kosError}
        </div>
      )}

      <DemoNotice />

      {/* ── 4 Summary Stat Cards ── */}
      <div className="kt-stats-grid">
        <div className="kt-stat-card">
          <div className="kt-stat-top">
            <span className="kt-stat-label">TOTAL TAGIHAN</span>
            <div className="kt-stat-icon text-teal">
              <FileText size={18} aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="kt-stat-val">{rupiah(totalTagihanAmt)}</div>
            <div className="kt-stat-sub">{tampil.length} Tagihan Aktif</div>
          </div>
        </div>

        <div className="kt-stat-card">
          <div className="kt-stat-top">
            <span className="kt-stat-label">SUDAH LUNAS</span>
            <div className="kt-stat-icon" style={{ color: '#10B981' }}>
              <CheckCircle2 size={18} aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="kt-stat-val">{rupiah(sudahLunasAmt)}</div>
            <div className="kt-stat-sub">{jumlahLunas} Kamar Lunas</div>
          </div>
        </div>

        <div className="kt-stat-card">
          <div className="kt-stat-top">
            <span className="kt-stat-label">BELUM BAYAR</span>
            <div className="kt-stat-icon" style={{ color: '#D97706' }}>
              <Clock size={18} aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="kt-stat-val">{rupiah(belumBayarAmt)}</div>
            <div className="kt-stat-sub">{jumlahBelumBayar} Kamar Menunggu</div>
          </div>
        </div>

        <div className="kt-stat-card">
          <div className="kt-stat-top">
            <span className="kt-stat-label">TERLAMBAT</span>
            <div className="kt-stat-icon" style={{ color: '#EF4444' }}>
              <AlertCircle size={18} aria-hidden="true" />
            </div>
          </div>
          <div>
            <div className="kt-stat-val">{rupiah(terlambatAmt)}</div>
            <div className="kt-stat-sub text-red">{jumlahTerlambat} Kamar Terkena Denda</div>
          </div>
        </div>
      </div>

      {/* ── Daftar Tagihan Bulan Ini ── */}
      <section className="kt-card">
        <div className="kt-card-head">
          <div className="kt-card-title-group">
            <h2 className="kt-card-title">Daftar Tagihan Bulan Ini</h2>
            <p className="kt-card-sub">Kelola pembayaran sewa dan utilitas penghuni kos.</p>
          </div>

          <div className="kt-search-box">
            <Search size={14} className="kt-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Cari penyewa atau kamar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="kt-table-wrap">
          <table className="kt-table">
            <thead>
              <tr>
                <th>PENYEWA</th>
                <th>KAMAR</th>
                <th>PERIODE</th>
                <th>TOTAL</th>
                <th>DENDA</th>
                <th>SISA</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((b) => {
                const nama = b.penyewaNama ?? 'User';
                const av = getAvatarMeta(nama);
                const phone = userPhoneMap[nama] ?? '+62 812-0000-0000';
                const tipe = userRoomTypeMap[b.kamarNomor] ?? 'Standar';

                return (
                  <tr key={b.id}>
                    <td>
                      <div className="kt-user-cell">
                        <div className="kt-avatar" style={{ background: av.bg, color: av.color }}>
                          {av.initials}
                        </div>
                        <div className="kt-user-meta">
                          <span className="kt-user-name">{nama}</span>
                          <span className="kt-user-phone">{phone}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="kt-room-num">Kamar {b.kamarNomor}</div>
                      <div className="kt-room-type">{tipe}</div>
                    </td>

                    <td>{periodeLabel(b.periode.slice(0, 7))}</td>

                    <td>
                      <span className="kt-amt">{rupiah(b.total)}</span>
                    </td>

                    <td>
                      <span className={b.denda > 0 ? 'kt-amt kt-amt-red' : 'kt-amt'}>
                        {rupiah(b.denda)}
                      </span>
                    </td>

                    <td>
                      <span className={b.status === 'TERLAMBAT' ? 'kt-amt kt-amt-red' : 'kt-amt'}>
                        {rupiah(b.sisa)}
                      </span>
                    </td>

                    <td>
                      {b.status === 'BELUM_BAYAR' ? (
                        <span className="kt-status-pill kt-pill-belum">Belum Bayar</span>
                      ) : b.status === 'LUNAS' ? (
                        <span className="kt-status-pill kt-pill-lunas">Lunas</span>
                      ) : (
                        <span className="kt-status-pill kt-pill-terlambat">Terlambat</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {tampil.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: '24px 0' }}>
                    {loading
                      ? 'Memuat data tagihan…'
                      : 'Belum ada data tagihan yang sesuai untuk periode ini.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Input Meteran Listrik & Air ── */}
      <section className="kt-card">
        <div className="kt-card-head">
          <div className="kt-card-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="kt-card-title">Input Meteran Listrik &amp; Air</h2>
              <span className="kt-meter-badge">
                <Zap size={13} aria-hidden="true" />
                <span>Utilitas Bulan Ini</span>
              </span>
            </div>
            <p className="kt-card-sub">
              Catat angka meteran akhir bulan untuk perhitungan tagihan utilitas otomatis.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            simpanMeteran();
          }}
        >
          {/* Row 1: 3 Fields */}
          <div className="kt-meter-grid-3">
            <div>
              <label className="kt-field-label">Penyewa</label>
              <div className="kt-select-styled">
                <span>{selectedBill?.penyewaNama ?? 'Zulfan'}</span>
                <ChevronDown size={14} className="muted" aria-hidden="true" />
                <select
                  value={meteranId}
                  disabled={busy}
                  onChange={(e) => {
                    setMeteranId(e.target.value);
                    const b = list.find((x) => String(x.id) === e.target.value);
                    if (b) {
                      setAwal(formatMeter(b.meteranAwal ?? 1240));
                      setAkhir(useMock ? formatMeter((b.meteranAwal ?? 1240) + 62.5) : '');
                    }
                  }}
                >
                  {list.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.penyewaNama ?? 'User'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="kt-field-label">Kamar</label>
              <div className="kt-select-styled">
                <span>
                  Kamar {selectedBill?.kamarNomor ?? '204'}{' '}
                  {userRoomTypeMap[selectedBill?.kamarNomor ?? '204'] ?? 'Eksklusif'}
                </span>
                <ChevronDown size={14} className="muted" aria-hidden="true" />
                <select
                  value={meteranId}
                  disabled={busy}
                  onChange={(e) => {
                    setMeteranId(e.target.value);
                    const b = list.find((x) => String(x.id) === e.target.value);
                    if (b) {
                      setAwal(formatMeter(b.meteranAwal ?? 1240));
                      setAkhir(useMock ? formatMeter((b.meteranAwal ?? 1240) + 62.5) : '');
                    }
                  }}
                >
                  {list.map((b) => (
                    <option key={b.id} value={b.id}>
                      Kamar {b.kamarNomor} {userRoomTypeMap[b.kamarNomor] ?? 'Eksklusif'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="kt-field-label">Tarif per kWh</label>
              <div className="kt-input-ro">{rupiah(tarif)}</div>
            </div>
          </div>

          {/* Row 2: Meteran Awal, Meteran Akhir, Kalkulasi */}
          <div className="kt-meter-grid-2">
            <div>
              <label className="kt-field-label">Meteran Awal (kWh)</label>
              <input
                type="text"
                className="kt-input-text"
                required
                disabled={busy}
                value={awal}
                inputMode="decimal"
                onChange={(e) => setAwal(e.target.value)}
                placeholder="1240,0"
              />
            </div>

            <div>
              <label className="kt-field-label">Meteran Akhir (kWh)</label>
              <input
                type="text"
                className="kt-input-text"
                required
                disabled={busy}
                value={akhir}
                inputMode="decimal"
                onChange={(e) => setAkhir(e.target.value)}
                placeholder="1302,5"
              />
            </div>
          </div>

          {/* Kalkulasi bar */}
          <div className="kt-calc-box">
            <Calculator size={18} aria-hidden="true" />
            <span>
              Pemakaian {pakai.toLocaleString('id-ID', { maximumFractionDigits: 1 })} kWh x{' '}
              {rupiah(tarif)} = {rupiah(pakai * tarif)}
            </span>
          </div>

          {/* Footer Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="kt-btn-simpan-meter"
              disabled={busy || !meteranId || !meterValid}
            >
              <Save size={16} aria-hidden="true" />
              <span>Simpan &amp; Hitung Tagihan</span>
            </button>
          </div>
        </form>
      </section>

      {konfirmasi && (() => {
        const [thn, bln] = periode.split('-').map(Number);
        const berikutnya = periodeLabel(`${bln === 12 ? thn + 1 : thn}-${String(bln === 12 ? 1 : bln + 1).padStart(2, '0')}`);
        const hariTempo = kos?.tanggalJatuhTempo ?? 5;
        const pratinjau = useMock ? demoTagihan : [];
        const totalPratinjau = pratinjau.reduce((sum, b) => sum + b.total, 0);
        const inisialNama = (nama: string) => nama.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
        return (
          <Dialog judul="Terbitkan Tagihan Bulan Ini?" onClose={() => setKonfirmasi(false)} lebar={600}>
            <p className="fx-modal-sub" style={{ marginTop: 16 }}>
              Tagihan bulan <b>{periodeLabel(periode)}</b> akan diterbitkan untuk {pratinjau.length ? <b>{pratinjau.length} penyewa</b> : 'seluruh penyewa aktif'} berikut.
            </p>
            {pratinjau.length > 0 && (
              <div className="fx-modal-rows">
                {pratinjau.map((b) => (
                  <div className="fx-modal-row" key={b.id}>
                    <span className="fx-modal-avatar">{inisialNama(b.penyewaNama ?? 'U')}</span>
                    <div><b>{b.penyewaNama}</b><small>Kamar {b.kamarNomor} {userRoomTypeMap[b.kamarNomor] ?? 'Eksklusif'}</small></div>
                    <strong>{rupiah(b.total)}</strong>
                  </div>
                ))}
                <div className="fx-modal-row fx-modal-row-total"><b>Total Tagihan</b><strong>{rupiah(totalPratinjau)}</strong></div>
              </div>
            )}
            <div className="fx-modal-info" style={{ marginTop: 20 }}><Info size={14} aria-hidden="true" /><span>Tagihan terkirim ke penyewa dan jatuh tempo tanggal <b>{hariTempo} {berikutnya}</b>.</span></div>
            <div className="fx-modal-actions">
              <button type="button" className="fx-modal-btn fx-modal-btn-outline" onClick={() => setKonfirmasi(false)}>Batal</button>
              <button type="button" className="fx-modal-btn" disabled={busy} onClick={() => { setKonfirmasi(false); void terbitkan(); }}>Ya, Terbitkan</button>
            </div>
          </Dialog>
        );
      })()}
    </div>
  );
}
