'use client';
import { useEffect, useState } from 'react';
import { Badge, Card, PageHead } from '@/components/ui';
import { get, patch } from '@/lib/api';
import { tanggalWaktu } from '@/lib/format';
import { demoQueue, type AdminKos } from '../demo';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const kodePosJaksel = (value: string) => /^\d{5}$/.test(value) && Number(value) >= 12110 && Number(value) <= 12980;
const diJaksel = (kos: AdminKos) => kodePosJaksel(kos.kodePos) && !/\bjakarta\s+(barat|timur|utara|pusat)\b/i.test(kos.alamat);
const kelengkapan = (kos: AdminKos) => [
  { label: 'Nama kos', checked: Boolean(kos.nama.trim()) },
  { label: 'Alamat lengkap', checked: Boolean(kos.alamat.trim()) },
  { label: 'Kode pos Jakarta Selatan', checked: diJaksel(kos) },
  { label: 'Daftar kamar', checked: kos.jumlahKamar > 0 },
  { label: 'Aturan kos', checked: Boolean(kos.aturanKos?.trim()) },
];
const statusKos: Record<AdminKos['statusVerifikasi'], { label: string; tone: string }> = {
  MENUNGGU: { label: 'Menunggu', tone: 'warning' },
  TERVERIFIKASI: { label: 'Terverifikasi', tone: 'success' },
  DITOLAK: { label: 'Ditolak', tone: 'danger' },
  DINONAKTIFKAN: { label: 'Dinonaktifkan', tone: 'muted' },
};

export function VerificationSection() {
  const [list, setList] = useState<AdminKos[]>(useMock ? demoQueue : []);
  const [loading, setLoading] = useState(!useMock);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [tolakId, setTolakId] = useState<number | null>(null);
  const [catatan, setCatatan] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (useMock) return;
    let active = true;
    get<AdminKos[]>('/api/admin/kos?status=MENUNGGU')
      .then(data => { if (active) setList(data); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Antrean verifikasi belum berhasil dimuat.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function putuskan(kos: AdminKos, disetujui: boolean) {
    if (busyId !== null || kos.statusVerifikasi !== 'MENUNGGU') return;
    setError(''); setOk('');
    if (disetujui && !kelengkapan(kos).every(item => item.checked)) {
      setError(kos.jumlahKamar === 0 ? 'Belum ada kamar, tidak dapat disetujui' : !diJaksel(kos) ? 'Hanya kos di Jakarta Selatan yang dapat disetujui.' : 'Lengkapi seluruh data kos sebelum menyetujui.');
      return;
    }
    if (!disetujui && !catatan.trim()) { setError('Catatan penolakan wajib diisi.'); return; }
    const note = disetujui ? 'Data kos lengkap dan sesuai wilayah Jakarta Selatan.' : catatan.trim();
    setBusyId(kos.id);
    try {
      const response = useMock ? undefined : await patch<AdminKos | undefined>(`/api/admin/kos/${kos.id}/verifikasi`, { disetujui, catatan: note });
      const waktu = new Date().toISOString();
      setList(items => items.map(item => item.id === kos.id ? {
        ...item, ...response,
        statusVerifikasi: response?.statusVerifikasi ?? (disetujui ? 'TERVERIFIKASI' : 'DITOLAK'),
        catatanVerifikasi: response?.catatanVerifikasi ?? note,
        diverifikasiPada: response?.diverifikasiPada ?? waktu,
      } : item));
      setTolakId(null); setCatatan('');
      setOk(`${kos.nama} ${disetujui ? 'disetujui dan berstatus Terverifikasi' : 'ditolak'}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Keputusan verifikasi belum berhasil disimpan.');
    } finally { setBusyId(null); }
  }

  const ordered = [...list].sort((a, b) => new Date(a.dibuatPada).getTime() - new Date(b.dibuatPada).getTime());
  const pending = list.filter(kos => kos.statusVerifikasi === 'MENUNGGU').length;

  return <div style={{ minWidth: 0 }}>
    <PageHead title="Verifikasi Kos" sub={loading ? 'Memuat antrean verifikasi kos…' : `${pending} kos menunggu keputusan verifikasi Anda. Antrean diurutkan dari pengajuan terlama.`}/>
    <div className="info-box mb-16">Kos baru berstatus MENUNGGU dan tidak tampil di pencarian sampai disetujui. Hanya kos di Jakarta Selatan yang dapat disetujui.</div>
    {ok && <div className="success-inline" role="status">{ok}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}
    {loading && <p className="muted" role="status">Memuat antrean verifikasi…</p>}
    {!loading && !error && list.length === 0 && <Card><p className="muted">Tidak ada kos menunggu verifikasi.</p></Card>}
    <div className="stack">
      {ordered.map(kos => {
        const checks = kelengkapan(kos);
        const status = statusKos[kos.statusVerifikasi];
        const menunggu = kos.statusVerifikasi === 'MENUNGGU';
        return <Card key={kos.id}>
          <div className="card-head">
            <div><h3 className="card-title">{kos.nama}</h3><p className="card-sub">Diajukan {tanggalWaktu(kos.dibuatPada)}</p></div>
            <Badge tone={status.tone} dot>{status.label}</Badge>
          </div>
          <div className="grid-2">
            <div>
              <dl className="kv">
                <div><dt>Pemilik</dt><dd>{kos.pemilikNama}</dd></div>
                <div><dt>Alamat</dt><dd style={{ overflowWrap: 'anywhere' }}>{kos.alamat}</dd></div>
                <div><dt>Kode Pos</dt><dd>{kos.kodePos}</dd></div>
                <div><dt>Jumlah Kamar</dt><dd>{kos.jumlahKamar} kamar</dd></div>
              </dl>
              {kos.aturanKos && <p className="note mt-16"><strong>Aturan kos:</strong> {kos.aturanKos}</p>}
            </div>
            <div>
              <h4 className="card-title mb-16">Checklist Kelengkapan</h4>
              <ul className="checklist">
                {checks.map(item => <li key={item.label} className={item.checked ? undefined : 'todo'} aria-label={`${item.label}: ${item.checked ? 'lengkap' : 'belum lengkap'}`}>{item.label}</li>)}
              </ul>
            </div>
          </div>
          {kos.jumlahKamar === 0 && <div className="reason-box mt-16">Belum ada kamar, tidak dapat disetujui</div>}
          {!diJaksel(kos) && <div className="reason-box mt-16">Hanya kos di Jakarta Selatan yang dapat disetujui.</div>}
          <p className="small muted mt-16">Riwayat: Diajukan {tanggalWaktu(kos.dibuatPada)} — {menunggu ? kos.jumlahKamar === 0 ? 'Menunggu kelengkapan data kamar.' : 'Menunggu keputusan.' : status.label + '.'}</p>
          {!menunggu && <p className="note mt-8" role="status">
            {kos.diverifikasiPada && <><time dateTime={kos.diverifikasiPada}>{tanggalWaktu(kos.diverifikasiPada)}</time> — </>}
            {status.label} oleh SuperAdmin · Catatan: {kos.catatanVerifikasi || 'Tidak ada catatan.'}
          </p>}
          {menunggu && <div className="booking-foot mt-16">
            <button type="button" className="btn btn-primary btn-sm" disabled={busyId !== null || !checks.every(item => item.checked)} onClick={() => putuskan(kos, true)}>{busyId === kos.id ? 'Menyimpan…' : 'Setujui'}</button>
            <button type="button" className="btn btn-danger-outline btn-sm" disabled={busyId !== null} aria-expanded={tolakId === kos.id} aria-controls={`tolak-kos-${kos.id}`} onClick={() => { setTolakId(tolakId === kos.id ? null : kos.id); setCatatan(''); }}>Tolak</button>
          </div>}
          {menunggu && tolakId === kos.id && <form id={`tolak-kos-${kos.id}`} className="mt-16" onSubmit={event => { event.preventDefault(); void putuskan(kos, false); }}>
            <div className="field">
              <label htmlFor={`catatan-${kos.id}`}>Catatan penolakan (wajib)</label>
              <textarea id={`catatan-${kos.id}`} required rows={2} value={catatan} disabled={busyId !== null} onChange={event => setCatatan(event.target.value)} placeholder="Wajib isi catatan penolakan"/>
            </div>
            <p className="note mb-16">Catatan penolakan wajib diisi dan tercatat di audit trail.</p>
            <div className="booking-foot">
              <button type="submit" className="btn btn-danger btn-sm" disabled={busyId !== null || !catatan.trim()}>Tolak Pengajuan</button>
              <button type="button" className="btn btn-outline btn-sm" disabled={busyId !== null} onClick={() => { setTolakId(null); setCatatan(''); }}>Batal</button>
            </div>
          </form>}
        </Card>;
      })}
    </div>
  </div>;
}
