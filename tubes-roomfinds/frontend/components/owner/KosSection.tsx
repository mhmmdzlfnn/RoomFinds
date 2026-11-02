'use client';
import { useEffect, useState } from 'react';
import { Badge, PageHead } from '@/components/ui';
import { del, get, patch, post, put } from '@/lib/api';
import { rupiah } from '@/lib/format';
import { setKamar as pilihGambarKamar } from '@/lib/gambar';
import { FotoKamar } from '@/components/FotoKamar';
import { useKos } from '@/components/owner/useKos';
import { DemoNotice } from '@/components/owner/demo';
import type { ApiOwnerRoom } from '@/types';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const mockKamar: ApiOwnerRoom[] = [
  { id: 1, kosId: 1, nomor: '204', tipe: 'EKSKLUSIF', hargaBulanan: 1500000, luas: 12, fasilitas: '["AC","Kamar Mandi Dalam","WiFi"]', status: 'TERISI' },
  { id: 2, kosId: 1, nomor: '102', tipe: 'STANDAR', hargaBulanan: 1250000, luas: 9, fasilitas: '["WiFi","Kamar Mandi Dalam","Dapur"]', status: 'KOSONG' },
  { id: 3, kosId: 1, nomor: '305', tipe: 'EKSKLUSIF', hargaBulanan: 2100000, luas: 14, fasilitas: '["AC","WiFi","Parkir"]', status: 'DIPESAN' },
];
const parseFasilitas = (raw: string) => { try { return (JSON.parse(raw) as string[]).join(', '); } catch { return raw; } };
const statusVerif = (s: string) => s === 'TERVERIFIKASI' ? { label: 'TERVERIFIKASI', tone: 'success' } : s === 'MENUNGGU' ? { label: 'MENUNGGU', tone: 'warning' } : { label: s === 'DINONAKTIFKAN' ? 'DINONAKTIFKAN' : 'DITOLAK', tone: 'danger' };
const statusKamar = (s: string) => s === 'KOSONG' ? { label: 'Kosong', tone: 'success' } : s === 'DIPESAN' ? { label: 'Dipesan', tone: 'warning' } : { label: 'Terisi', tone: 'slate' };

export function KosSection() {
  const { kosList, kosId, setKosId, kos, loaded, error: kosError, muat, perbaruiDemo } = useKos();
  const [kamar, setKamar] = useState<ApiOwnerRoom[]>(useMock ? mockKamar : []);
  const [form, setForm] = useState({ nama: '', alamat: '', kodePos: '', aturanKos: '', tanggalJatuhTempo: 5 });
  const [roomForm, setRoomForm] = useState<{ id?: number; nomor: string; tipe: 'STANDAR' | 'EKSKLUSIF'; hargaBulanan: string; luas: string; fasilitas: string } | null>(null);
  const [ok, setOk] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => { if (kos) setForm({ nama: kos.nama, alamat: kos.alamat, kodePos: kos.kodePos, aturanKos: kos.aturanKos, tanggalJatuhTempo: kos.tanggalJatuhTempo }); }, [kos]);
  const muatKamar = () => {
    if (!useMock && kosId) get<ApiOwnerRoom[]>(`/api/kos/${kosId}/kamar`).then(setKamar).catch(e => setError(e instanceof Error ? e.message : 'Daftar kamar belum berhasil dimuat.'));
  };
  useEffect(() => { setRoomForm(null); muatKamar(); }, [kosId]);

  async function simpanKos() {
    if (!kos) return;
    setError(''); setOk('');
    if (!form.nama.trim() || !form.alamat.trim() || !form.aturanKos.trim() || !/^\d{5}$/.test(form.kodePos) || !Number.isInteger(form.tanggalJatuhTempo) || form.tanggalJatuhTempo < 1 || form.tanggalJatuhTempo > 28) {
      setError('Isi nama, alamat, aturan kos, kode pos 5 digit, dan tanggal jatuh tempo 1–28 dengan benar.'); return;
    }
    setBusy(true);
    const body = { ...form, nama: form.nama.trim(), alamat: form.alamat.trim(), tanggalJatuhTempo: Number(form.tanggalJatuhTempo) };
    try { if (useMock) perbaruiDemo(kos.id, body); else await put(`/api/kos/${kos.id}`, body); setOk(useMock ? 'Data kos diperbarui dalam demo.' : 'Data kos tersimpan.'); muat(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan data kos.'); } finally { setBusy(false); }
  }
  async function simpanKamar() {
    if (!kosId || !roomForm) return;
    setError(''); setOk('');
    const body = { nomor: roomForm.nomor.trim(), tipe: roomForm.tipe, hargaBulanan: Number(roomForm.hargaBulanan), luas: Number(roomForm.luas.replace(',', '.')), fasilitas: JSON.stringify(roomForm.fasilitas.split(',').map(s => s.trim()).filter(Boolean)) };
    if (!body.nomor || !Number.isFinite(body.hargaBulanan) || body.hargaBulanan <= 0 || !Number.isFinite(body.luas) || body.luas <= 0) { setError('Nomor kamar wajib diisi. Harga dan luas harus berupa angka lebih dari nol.'); return; }
    if (kamar.some(k => k.id !== roomForm.id && k.nomor.toLowerCase() === body.nomor.toLowerCase())) { setError('Nomor kamar sudah digunakan.'); return; }
    setBusy(true);
    try {
      if (!useMock) { if (roomForm.id) await patch(`/api/kos/${kosId}/kamar/${roomForm.id}`, body); else await post(`/api/kos/${kosId}/kamar`, body); }
      else setKamar(list => roomForm.id ? list.map(k => k.id === roomForm.id ? { ...k, ...body } : k) : [...list, { ...body, id: Math.max(0, ...list.map(k => k.id)) + 1, kosId, status: 'KOSONG' }]);
      setOk(`${roomForm.id ? 'Kamar diperbarui' : 'Kamar ditambahkan'}${useMock ? ' dalam demo' : ''}.`); setRoomForm(null);
      muatKamar();
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan kamar.'); } finally { setBusy(false); }
  }
  async function hapusKamar(id: number) {
    if (busy || !kosId || kamar.find(k => k.id === id)?.status !== 'KOSONG' || !window.confirm('Hapus kamar ini?')) return;
    setBusy(true); setError(''); setOk('');
    try { if (!useMock) await del(`/api/kos/${kosId}/kamar/${id}`); else setKamar(list => list.filter(k => k.id !== id)); setOk(useMock ? 'Kamar dihapus dalam demo.' : 'Kamar dihapus.'); muatKamar(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghapus kamar.'); } finally { setBusy(false); }
  }
  const verif = kos ? statusVerif(kos.statusVerifikasi) : null;

  return <div>
    <PageHead title="Kelola Kos dan Kamar" sub="Kelola data kos dan daftar kamar dalam satu halaman."/>
    <DemoNotice/>
    {!loaded && <p className="note mb-16" role="status">Memuat data kos…</p>}
    {loaded && !kos && !kosError && <p className="note mb-16">Belum ada data kos yang dapat dikelola.</p>}
    {kosError && <div className="form-alert" role="alert">{kosError}</div>}
    {kosList.length > 1 && <div className="select-row" style={{ marginBottom: 14 }}><label className="note">Kos:</label><select value={kosId ?? ''} onChange={e => setKosId(Number(e.target.value))}>{kosList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}</select></div>}
    {ok && <div className="success-inline">✅ {ok}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}
    {kos && verif && <section className="card card-pad mb-24">
      <div className="card-head"><div><h3 className="card-title">Data Kos</h3><p className="card-sub">Informasi utama kos yang tampil di pencarian.</p></div><Badge tone={verif.tone} dot>{verif.label}</Badge></div>
      <div className="form-grid-2">
        <div className="field"><label>Nama Kos</label><input type="text" aria-label="Nama Kos" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })}/></div>
        <div className="field"><label>Kode Pos</label><input type="text" inputMode="numeric" maxLength={5} aria-label="Kode Pos" value={form.kodePos} onChange={e => setForm({ ...form, kodePos: e.target.value })}/></div>
      </div>
      <div className="field"><label>Alamat Lengkap</label><input type="text" aria-label="Alamat Lengkap" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })}/></div>
      <div className="field"><label>Aturan Kos</label><textarea aria-label="Aturan Kos" rows={4} value={form.aturanKos} onChange={e => setForm({ ...form, aturanKos: e.target.value })}/></div>
      <div className="field" style={{ maxWidth: 260 }}><label>Tanggal Jatuh Tempo</label><input type="number" aria-label="Tanggal Jatuh Tempo" min={1} max={28} value={form.tanggalJatuhTempo} onChange={e => setForm({ ...form, tanggalJatuhTempo: Number(e.target.value) })}/><span className="hint">Tanggal 1–28 setiap bulan.</span></div>
      <button className="btn btn-primary" disabled={busy} onClick={simpanKos}>Simpan</button>
    </section>}
    <section className="card card-pad">
      <div className="card-head"><div><h3 className="card-title">Daftar Kamar</h3><p className="card-sub">{kamar.length} kamar terdaftar</p></div><button className="btn btn-primary" disabled={busy || !kosId} onClick={() => setRoomForm({ nomor: '', tipe: 'STANDAR', hargaBulanan: '1250000', luas: '9', fasilitas: 'WiFi, Lemari' })}>Tambah Kamar</button></div>
      {roomForm && <div style={{ background: 'var(--gray-bg)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
        <div className="form-grid-2">
          <div className="field"><label>Nomor Kamar</label><input type="text" aria-label="Nomor Kamar" value={roomForm.nomor} onChange={e => setRoomForm({ ...roomForm, nomor: e.target.value })} placeholder="cth. 12"/></div>
          <div className="field"><label>Tipe</label><select aria-label="Tipe Kamar" value={roomForm.tipe} onChange={e => setRoomForm({ ...roomForm, tipe: e.target.value as 'STANDAR' | 'EKSKLUSIF' })}><option value="STANDAR">Standar</option><option value="EKSKLUSIF">Eksklusif</option></select></div>
          <div className="field"><label>Harga Bulanan (Rp)</label><input type="number" min={1} aria-label="Harga Bulanan" value={roomForm.hargaBulanan} inputMode="numeric" onChange={e => setRoomForm({ ...roomForm, hargaBulanan: e.target.value })}/></div>
          <div className="field"><label>Luas (m²)</label><input type="text" aria-label="Luas Kamar" value={roomForm.luas} inputMode="decimal" onChange={e => setRoomForm({ ...roomForm, luas: e.target.value })}/></div>
        </div>
        <div className="field"><label>Fasilitas (pisahkan dengan koma)</label><input type="text" aria-label="Fasilitas Kamar" value={roomForm.fasilitas} onChange={e => setRoomForm({ ...roomForm, fasilitas: e.target.value })}/></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" disabled={busy || !roomForm.nomor} onClick={simpanKamar}>Simpan Kamar</button>
          <button className="btn btn-outline" onClick={() => setRoomForm(null)}>Batal</button>
        </div>
      </div>}
      <div className="table-wrap"><table className="data-table">
        <thead><tr><th>Kamar</th><th>Tipe</th><th>Harga</th><th>Fasilitas</th><th>Status</th><th>Aksi</th></tr></thead>
        <tbody>
          {kamar.map(k => { const st = statusKamar(k.status); return <tr key={k.id}>
            <td className="bold" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 64, height: 46, borderRadius: 8, overflow: 'hidden', flex: 'none' }}><FotoKamar nama={`${['204', '102', '305'].includes(k.nomor) ? k.nomor : pilihGambarKamar(k.tipe, k.id).slug}-utama`} alt={`Kamar ${k.nomor}`}/></span>Kamar {k.nomor}</td>
            <td><Badge tone={k.tipe === 'EKSKLUSIF' ? 'teal' : 'slate'}>{k.tipe === 'EKSKLUSIF' ? 'Eksklusif' : 'Standar'}</Badge></td>
            <td className="num">{rupiah(k.hargaBulanan)}</td>
            <td className="muted">{parseFasilitas(k.fasilitas)}</td>
            <td><Badge tone={st.tone} dot>{st.label}</Badge></td>
            <td style={{ whiteSpace: 'nowrap' }}>
              <button className="btn btn-outline btn-sm" disabled={busy} onClick={() => setRoomForm({ id: k.id, nomor: k.nomor, tipe: k.tipe, hargaBulanan: String(k.hargaBulanan), luas: String(k.luas), fasilitas: parseFasilitas(k.fasilitas) })}>Edit</button>{' '}
              <button className="btn btn-danger-outline btn-sm" disabled={busy || k.status !== 'KOSONG'} title={k.status !== 'KOSONG' ? 'Kamar terisi tidak dapat dihapus' : 'Hapus kamar'} onClick={() => hapusKamar(k.id)}>Hapus</button>
            </td>
          </tr>; })}
        </tbody>
      </table></div>
      <p className="note mt-16">ℹ️ Kamar terisi tidak dapat dihapus.</p>
    </section>
  </div>;
}
