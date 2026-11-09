'use client';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Ban, Building2, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Download, Info, RefreshCw, Search, ShieldAlert, ShieldCheck, UserPlus, UserRound, X } from 'lucide-react';
import { get, patch, post } from '@/lib/api';
import { Dialog } from '@/components/owner/DashboardModals';
import type { ApiAdminKos, Peran } from '@/types';
import { demoUsers, type AdminUser } from '../demo';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const roles: { value: '' | Peran; label: string }[] = [
  { value: '', label: 'Semua' }, { value: 'PEMILIK', label: 'Pemilik' }, { value: 'USER', label: 'User' }, { value: 'SUPERADMIN', label: 'SuperAdmin' },
];
const roleLabels: Record<Peran, string> = { USER: 'User', PEMILIK: 'Pemilik', SUPERADMIN: 'SuperAdmin' };
const demoKos = ['Kos Melati Putri', 'Kos Dahlia', 'Kos Kenanga Indah'];
const ukuranHalaman = 10;

const inisial = (nama: string) => nama.split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
const kodeAkun = (user: AdminUser) => user.kodeId ?? `RF-${user.peran === 'USER' ? 'USR' : user.peran === 'PEMILIK' ? 'OWN' : 'ADM'}-${String(user.id).padStart(4, '0')}`;
const tanggalPendek = (iso?: string | null) => iso ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)) : '';

function unduhCsv(users: AdminUser[], nama: string) {
  const esc = (nilai: string) => `"${nilai.replace(/"/g, '""')}"`;
  const baris = [['Nama', 'Email', 'Peran', 'Kos', 'Status', 'Alasan Blokir'], ...users.map(u => [u.nama, u.email, roleLabels[u.peran], u.kosNama ?? '', u.aktif ? 'Aktif' : 'Diblokir', u.alasanNonaktif ?? ''])];
  const blob = new Blob(['﻿' + baris.map(b => b.map(esc).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AccountsSection() {
  const [users, setUsers] = useState<AdminUser[]>(useMock ? demoUsers : []);
  const [kos, setKos] = useState<ApiAdminKos[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'' | Peran>('');
  const [halaman, setHalaman] = useState(1);
  const [loading, setLoading] = useState(!useMock);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [blokirId, setBlokirId] = useState<number | null>(null);
  const [alasan, setAlasan] = useState('');
  const [error, setError] = useState('');
  const [kosError, setKosError] = useState('');
  const [ok, setOk] = useState('');
  const [modal, setModal] = useState<'' | 'ekspor' | 'tambah'>('');

  useEffect(() => {
    if (useMock) return;
    let active = true;
    get<AdminUser[]>('/api/admin/pengguna')
      .then(data => { if (active) setUsers(data); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Daftar akun belum berhasil dimuat.'); })
      .finally(() => { if (active) setLoading(false); });
    get<ApiAdminKos[]>('/api/admin/kos')
      .then(data => { if (active) setKos(data); })
      .catch(() => { if (active) setKosError('Data kos pemilik belum berhasil dimuat.'); });
    return () => { active = false; };
  }, []);

  async function ubahStatus(user: AdminUser, aktif: boolean) {
    if (busyId !== null || user.peran === 'SUPERADMIN' || user.aktif === aktif) return;
    setError(''); setOk('');
    if (!aktif && !alasan.trim()) { setError('Alasan pemblokiran wajib diisi.'); return; }
    const note = aktif ? '' : alasan.trim();
    setBusyId(user.id);
    try {
      const response = useMock ? undefined : await patch<AdminUser | undefined>(`/api/admin/pengguna/${user.id}/status`, { aktif, alasan: note });
      setUsers(items => items.map(item => item.id === user.id ? {
        ...item, ...response,
        aktif: response?.aktif ?? aktif,
        alasanNonaktif: aktif ? null : response?.alasanNonaktif ?? note,
        diblokirPada: aktif ? null : new Date().toISOString(),
      } : item));
      setBlokirId(null); setAlasan('');
      setOk(`Akun ${user.nama} ${aktif ? 'diaktifkan kembali' : 'diblokir'}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status akun belum berhasil disimpan.');
    } finally { setBusyId(null); }
  }

  const keyword = query.trim().toLocaleLowerCase('id-ID');
  const filtered = useMemo(() => users.filter(user => (!role || user.peran === role) && (!keyword || user.nama.toLocaleLowerCase('id-ID').includes(keyword) || user.email.toLocaleLowerCase('id-ID').includes(keyword))), [users, role, keyword]);
  const hitungReal = (peran: '' | Peran) => users.filter(u => !peran || u.peran === peran).length;
  const hitung = hitungReal;
  const total = hitung('');
  const diblokir = users.filter(user => !user.aktif).length;
  const aktif = total - diblokir;
  const jumlahHalaman = Math.max(1, Math.ceil(filtered.length / ukuranHalaman));
  const halamanAktif = Math.min(halaman, jumlahHalaman);
  const tampil = filtered.slice((halamanAktif - 1) * ukuranHalaman, halamanAktif * ukuranHalaman);
  const kosPemilik = (user: AdminUser) => user.peran === 'PEMILIK' ? user.kosNama || kos.filter(item => item.pemilikEmail.toLowerCase() === user.email.toLowerCase()).map(item => item.nama).join(', ') || '' : '';
  const daftarKos = useMock ? demoKos : kos.map(item => item.nama);

  return <>
  <div className="fx-ak">
    <header className="fx-ak-head">
      <div>
        <div className="fx-ak-tag"><ShieldCheck size={13} aria-hidden="true" />MANAJEMEN PENGGUNA TERPUSAT</div>
        <h1>Kelola Akun</h1>
        <p>Manajemen data akun pengguna, peran sistem, dan status akses platform RoomFinds.</p>
      </div>
      <div className="fx-ak-actions">
        <button type="button" className="fx-ak-btn fx-ak-btn-soft" onClick={() => setModal('ekspor')}><Download size={15} aria-hidden="true" />Ekspor Data</button>
        <button type="button" className="fx-ak-btn" onClick={() => setModal('tambah')}><UserPlus size={15} aria-hidden="true" />Tambah Akun</button>
      </div>
    </header>

    {ok && <div className="success-inline" role="status">{ok}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}
    {kosError && <div className="form-alert" role="alert">{kosError}</div>}

    <section className="fx-ak-filter">
      <div className="fx-ak-bar">
        <div className="fx-ak-tabs" role="group" aria-label="Filter peran">
          {roles.map(item => <button key={item.label} type="button" className={role === item.value ? 'on' : ''} aria-pressed={role === item.value} onClick={() => { setRole(item.value); setBlokirId(null); setAlasan(''); setHalaman(1); }}>{item.label}<em>{hitung(item.value)}</em></button>)}
        </div>
        <label className="fx-ak-search">
          <Search size={16} aria-hidden="true" />
          <input type="text" placeholder="Cari nama atau email..." value={query} onChange={event => { setQuery(event.target.value); setHalaman(1); }} aria-label="Cari akun" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Hapus pencarian"><X size={14} aria-hidden="true" /></button>}
        </label>
      </div>
      {!loading && <div className="fx-ak-sum">
        <span>Menampilkan hasil terfilter:</span>
        <i className="p-total">Total <b>{total}</b> akun</i><i className="p-aktif">{aktif} Aktif</i><i className="p-blok">{diblokir} Diblokir</i>
        <small><RefreshCw size={11} aria-hidden="true" />Terakhir diperbarui: Baru saja</small>
      </div>}
    </section>

    <section className="fx-ak-table-card">
      <div className="table-wrap">
        <table className="fx-ak-table">
          <thead><tr><th>NAMA</th><th>EMAIL</th><th>PERAN</th><th>KOS</th><th>STATUS</th><th>AKSI</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="fx-ak-empty" role="status">Memuat daftar akun…</td></tr> : tampil.length === 0 ? <tr><td colSpan={6} className="fx-ak-empty">{error ? 'Daftar akun belum tersedia.' : 'Tidak ada akun yang sesuai pencarian dan filter.'}</td></tr> : tampil.map((user, i) => <Fragment key={user.id}>
              <tr className={!user.aktif ? 'blok' : ''}>
                <td><div className="fx-ak-user"><span className={`fx-ak-avatar${!user.aktif ? ' off' : i % 2 ? ' alt' : ''}`}>{inisial(user.nama)}</span><div><b>{user.nama}</b><small>ID: {kodeAkun(user)}</small></div></div></td>
                <td>{user.email}</td>
                <td><span className={`fx-ak-peran p-${user.peran.toLowerCase()}`}>{user.peran === 'USER' ? <UserRound size={11} aria-hidden="true" /> : user.peran === 'PEMILIK' ? <Building2 size={11} aria-hidden="true" /> : <ShieldCheck size={11} aria-hidden="true" />}{roleLabels[user.peran]}</span></td>
                <td>{kosPemilik(user) ? <span className="fx-ak-kos"><Building2 size={14} aria-hidden="true" />{kosPemilik(user)}</span> : '-'}</td>
                <td><span className={`fx-ak-status ${user.aktif ? 'on' : 'off'}`}><i aria-hidden="true" />{user.aktif ? 'Aktif' : 'Diblokir'}</span></td>
                <td>
                  {user.peran === 'SUPERADMIN' ? <span className="fx-ak-muted">Akun data awal</span> : user.aktif
                    ? <button type="button" className="fx-ak-blok" disabled={busyId !== null} aria-expanded={blokirId === user.id} aria-controls={`blokir-akun-${user.id}`} onClick={() => { setBlokirId(blokirId === user.id ? null : user.id); setAlasan(''); }}><Ban size={13} aria-hidden="true" />Blokir</button>
                    : <button type="button" className="fx-ak-aktif" disabled={busyId !== null} onClick={() => ubahStatus(user, true)}><CheckCircle2 size={13} aria-hidden="true" />{busyId === user.id ? 'Menyimpan…' : 'Aktifkan'}</button>}
                </td>
              </tr>
              {!user.aktif && user.alasanNonaktif && <tr className="blok-info"><td colSpan={6}><div><span><ShieldAlert size={14} aria-hidden="true" />Alasan blokir: {user.alasanNonaktif}</span>{user.diblokirPada && <small>Diblokir sejak {tanggalPendek(user.diblokirPada)}</small>}</div></td></tr>}
              {blokirId === user.id && user.aktif && <tr><td colSpan={6}>
                <form id={`blokir-akun-${user.id}`} className="fx-ak-panel" onSubmit={event => { event.preventDefault(); void ubahStatus(user, false); }}>
                  <div className="fx-ak-panel-head"><h3><Info size={15} aria-hidden="true" />Alasan pemblokiran (wajib diisi)</h3><span>Tindakan Kritis</span></div>
                  <p>Berikan alasan spesifik pemblokiran untuk {user.peran === 'PEMILIK' ? 'pemilik kos' : 'user'} {user.nama}. Catatan ini akan tersimpan dalam riwayat audit platform.</p>
                  <textarea id={`alasan-${user.id}`} required rows={2} value={alasan} disabled={busyId !== null} onChange={event => setAlasan(event.target.value)} placeholder="Tuliskan alasan pemblokiran…" aria-label={`Alasan pemblokiran ${user.nama}`} />
                  <div className="fx-ak-panel-foot">
                    <button type="button" className="fx-ak-batal" disabled={busyId !== null} onClick={() => { setBlokirId(null); setAlasan(''); }}>Batal</button>
                    <button type="submit" className="fx-ak-konfirm" disabled={busyId !== null || !alasan.trim()}><Ban size={13} aria-hidden="true" />{busyId === user.id ? 'Menyimpan…' : 'Konfirmasi Blokir'}</button>
                  </div>
                </form>
              </td></tr>}
            </Fragment>)}
          </tbody>
        </table>
      </div>
      <div className="fx-ak-foot">
        <span>Menampilkan <b>{filtered.length ? (halamanAktif - 1) * ukuranHalaman + 1 : 0} - {(halamanAktif - 1) * ukuranHalaman + tampil.length}</b> dari <b>{filtered.length}</b> pengguna</span>
        <nav className="fx-ak-pager" aria-label="Halaman">
          <button type="button" disabled={halamanAktif <= 1} onClick={() => setHalaman(halamanAktif - 1)} aria-label="Sebelumnya"><ChevronLeft size={14} aria-hidden="true" /></button>
          {Array.from({ length: jumlahHalaman }, (_, n) => n + 1).map(n => <button key={n} type="button" className={n === halamanAktif ? 'on' : ''} aria-current={n === halamanAktif ? 'page' : undefined} onClick={() => setHalaman(n)}>{n}</button>)}
          <button type="button" disabled={halamanAktif >= jumlahHalaman} onClick={() => setHalaman(halamanAktif + 1)} aria-label="Berikutnya"><ChevronRight size={14} aria-hidden="true" /></button>
        </nav>
      </div>
    </section>

    <aside className="fx-ak-policy">
      <span><Info size={18} aria-hidden="true" /></span>
      <div><b>Kebijakan Pemblokiran Akun RoomFinds</b><p>Akun yang diblokir tidak dapat login, datanya tetap tersimpan, dan kos milik pemilik yang diblokir disembunyikan dari pencarian. Pembukaan blokir memerlukan persetujuan dari SuperAdmin.</p></div>
    </aside>

  </div>
    {modal === 'ekspor' && <EksporDialog users={users} hitung={hitung} onClose={() => setModal('')} onSelesai={pesan => { setModal(''); setOk(pesan); }} />}
    {modal === 'tambah' && <TambahDialog daftarKos={daftarKos} onClose={() => setModal('')} onTambah={async data => {
      if (useMock) {
        setUsers(list => [...list, { id: Math.max(0, ...list.map(u => u.id)) + 1, nama: data.nama, email: data.email, noHp: '', peran: data.peran, aktif: true, kosNama: data.kos || null, dibuatPada: new Date().toISOString() }]);
      } else {
        const kosDipilih = kos.find(k => k.nama === data.kos);
        await post('/api/admin/pengguna', { nama: data.nama, email: data.email, peran: data.peran, kosId: kosDipilih?.id, password: data.password });
        const baru = await get<AdminUser[]>('/api/admin/pengguna');
        setUsers(baru);
      }
      setModal(''); setOk(`Akun ${data.nama} berhasil ditambahkan.`);
    }} />}
  </>;
}

function EksporDialog({ users, hitung, onClose, onSelesai }: { users: AdminUser[]; hitung: (peran: '' | Peran) => number; onClose: () => void; onSelesai: (pesan: string) => void }) {
  const [cakupan, setCakupan] = useState<'' | Peran>('');
  const [format, setFormat] = useState<'xlsx' | 'csv' | 'pdf'>('xlsx');
  const opsiCakupan: { v: '' | Peran; l: string }[] = [{ v: '', l: 'Semua Akun' }, { v: 'PEMILIK', l: 'Pemilik' }, { v: 'USER', l: 'User' }, { v: 'SUPERADMIN', l: 'SuperAdmin' }];
  const opsiFormat: { v: typeof format; l: string }[] = [{ v: 'xlsx', l: 'Excel (.xlsx)' }, { v: 'csv', l: 'CSV' }, { v: 'pdf', l: 'PDF' }];
  function unduh(event: React.FormEvent) {
    event.preventDefault();
    unduhCsv(users.filter(u => !cakupan || u.peran === cakupan), 'Data_Akun_RoomFinds.csv');
    onSelesai(format === 'csv' ? 'Data akun berhasil diunduh.' : 'Format Excel dan PDF belum tersedia, data akun diunduh sebagai CSV.');
  }
  return <Dialog judul="Ekspor Data" sub="Pilih cakupan dan format dokumen untuk mengunduh data akun." onClose={onClose} lebar={520}>
    <form className="fx-modal-form" onSubmit={unduh}>
      <fieldset className="fx-modal-field"><legend>Cakupan Data</legend>
        <div className="fx-modal-grid">{opsiCakupan.map(o => <label key={o.l} className={`fx-modal-radio${cakupan === o.v ? ' on tint' : ''}`}><input type="radio" name="cakupan" checked={cakupan === o.v} onChange={() => setCakupan(o.v)} /><i aria-hidden="true" /><span>{o.l} ({hitung(o.v)})</span></label>)}</div>
      </fieldset>
      <fieldset className="fx-modal-field"><legend>Format Dokumen</legend>
        <div className="fx-modal-grid tiga">{opsiFormat.map(o => <label key={o.v} className={`fx-modal-radio${format === o.v ? ' on tint' : ''}`}><input type="radio" name="format" checked={format === o.v} onChange={() => setFormat(o.v)} /><i aria-hidden="true" /><span>{o.l}</span></label>)}</div>
      </fieldset>
      <div className="fx-modal-info"><Info size={14} aria-hidden="true" /><span>File berisi nama, email, peran, kos, dan status akun. Akun yang diblokir ikut disertakan dengan keterangan statusnya.</span></div>
      <div className="fx-modal-actions fx-modal-actions-plain">
        <button type="button" className="fx-modal-btn fx-modal-btn-outline" onClick={onClose}>Batal</button>
        <button type="submit" className="fx-modal-btn"><Download size={14} aria-hidden="true" />Unduh</button>
      </div>
    </form>
  </Dialog>;
}

function TambahDialog({ daftarKos, onClose, onTambah }: { daftarKos: string[]; onClose: () => void; onTambah: (data: { nama: string; email: string; peran: Peran; kos: string; password: string }) => Promise<void> }) {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [peran, setPeran] = useState<'USER' | 'PEMILIK'>('USER');
  const [kos, setKos] = useState('');
  const [password, setPassword] = useState('');
  const [galat, setGalat] = useState('');
  const [busy, setBusy] = useState(false);
  async function kirim(event: React.FormEvent) {
    event.preventDefault();
    if (!nama.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setGalat('Isi nama lengkap dan email yang valid.'); return; }
    if (peran === 'PEMILIK' && !kos) { setGalat('Kos wajib dipilih untuk peran Pemilik.'); return; }
    if (password.length < 8) { setGalat('Kata sandi sementara minimal 8 karakter.'); return; }
    setGalat(''); setBusy(true);
    try { await onTambah({ nama: nama.trim(), email: email.trim(), peran, kos: peran === 'PEMILIK' ? kos : '', password }); }
    catch (e) { setGalat(e instanceof Error ? e.message : 'Akun belum berhasil ditambahkan.'); setBusy(false); }
  }
  return <Dialog judul="Tambah Akun" onClose={onClose} lebar={480}>
    <form className="fx-modal-form" onSubmit={kirim} noValidate>
      <div className="fx-modal-field"><label htmlFor="ak-nama">Nama Lengkap</label><input id="ak-nama" className="fx-modal-plain" value={nama} onChange={e => setNama(e.target.value)} placeholder="Contoh: Ahmad Fauzi" /></div>
      <div className="fx-modal-field"><label htmlFor="ak-email">Email</label><input id="ak-email" type="email" className="fx-modal-plain" value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com" /></div>
      <fieldset className="fx-modal-field"><legend>Peran</legend>
        <div className="fx-modal-grid">{(['USER', 'PEMILIK'] as const).map(p => <label key={p} className={`fx-modal-radio center${peran === p ? ' on tint' : ''}`}><input type="radio" name="peran" checked={peran === p} onChange={() => setPeran(p)} /><i aria-hidden="true" /><span>{roleLabels[p]}</span></label>)}</div>
      </fieldset>
      <div className="fx-modal-field"><label htmlFor="ak-kos">Kos</label>
        <div className="fx-modal-select-plain"><select id="ak-kos" value={kos} onChange={e => setKos(e.target.value)} disabled={peran !== 'PEMILIK'}><option value="">Pilih kos</option>{daftarKos.map(k => <option key={k}>{k}</option>)}</select><ChevronDown size={15} aria-hidden="true" /></div>
        <small className="fx-modal-hint">Wajib diisi untuk peran Pemilik.</small>
      </div>
      <div className="fx-modal-field"><label htmlFor="ak-sandi">Kata Sandi Sementara</label><input id="ak-sandi" type="password" className="fx-modal-plain" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 8 karakter" autoComplete="new-password" /></div>
      <div className="fx-modal-info"><Info size={14} aria-hidden="true" /><span>Akun SuperAdmin tidak dapat ditambahkan di sini, akun SuperAdmin hanya dibuat lewat data awal.</span></div>
      {galat && <p className="fx-modal-error" role="alert">{galat}</p>}
      <div className="fx-modal-actions fx-modal-actions-plain">
        <button type="button" className="fx-modal-btn fx-modal-btn-outline" onClick={onClose}>Batal</button>
        <button type="submit" className="fx-modal-btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Tambah Akun'}</button>
      </div>
    </form>
  </Dialog>;
}
