'use client';
import { Fragment, useEffect, useState } from 'react';
import { Badge, Card, PageHead } from '@/components/ui';
import { get, patch } from '@/lib/api';
import type { ApiAdminKos, Peran } from '@/types';
import { demoUsers, type AdminUser } from '../demo';

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
const roles: { value: '' | Peran; label: string }[] = [
  { value: '', label: 'Semua' }, { value: 'PEMILIK', label: 'Pemilik' }, { value: 'USER', label: 'User' }, { value: 'SUPERADMIN', label: 'SuperAdmin' },
];
const roleLabels: Record<Peran, string> = { USER: 'User', PEMILIK: 'Pemilik', SUPERADMIN: 'SuperAdmin' };
const roleTones: Record<Peran, string> = { USER: 'slate', PEMILIK: 'teal', SUPERADMIN: 'warning' };

export function AccountsSection() {
  const [users, setUsers] = useState<AdminUser[]>(useMock ? demoUsers : []);
  const [kos, setKos] = useState<ApiAdminKos[]>([]);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'' | Peran>('');
  const [loading, setLoading] = useState(!useMock);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [blokirId, setBlokirId] = useState<number | null>(null);
  const [alasan, setAlasan] = useState('');
  const [error, setError] = useState('');
  const [kosError, setKosError] = useState('');
  const [ok, setOk] = useState('');

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
      } : item));
      setBlokirId(null); setAlasan('');
      setOk(`Akun ${user.nama} ${aktif ? 'diaktifkan kembali' : 'diblokir'}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status akun belum berhasil disimpan.');
    } finally { setBusyId(null); }
  }

  const keyword = query.trim().toLocaleLowerCase('id-ID');
  const filtered = users.filter(user => (!role || user.peran === role) && (!keyword || user.nama.toLocaleLowerCase('id-ID').includes(keyword) || user.email.toLocaleLowerCase('id-ID').includes(keyword)));
  const total = useMock ? 211 : users.length;
  // Data demo menampilkan sebagian akun; pertahankan agregat platform saat status berubah.
  const diblokir = users.filter(user => !user.aktif).length + (useMock ? 3 - demoUsers.filter(user => !user.aktif).length : 0);
  const aktif = total - diblokir;
  const kosPemilik = (user: AdminUser) => user.peran === 'PEMILIK' ? user.kosNama || kos.filter(item => item.pemilikEmail.toLowerCase() === user.email.toLowerCase()).map(item => item.nama).join(', ') || '—' : '—';

  return <div style={{ minWidth: 0 }}>
    <PageHead title="Kelola Akun" sub="Cari, filter, dan kelola status akun di seluruh platform."/>
    {ok && <div className="success-inline" role="status">{ok}</div>}
    {error && <div className="form-alert" role="alert">{error}</div>}
    {kosError && <div className="form-alert" role="alert">{kosError}</div>}
    <Card className="mb-16">
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="cari-akun">Cari akun</label>
        <input id="cari-akun" type="text" placeholder="Cari nama atau email" value={query} onChange={event => setQuery(event.target.value)}/>
      </div>
      <div className="filter-tabs mt-16" role="group" aria-label="Filter peran" style={{ flexWrap: 'wrap', borderRadius: 12 }}>
        {roles.map(item => <button key={item.label} type="button" className={`btn btn-sm${role === item.value ? ' btn-primary active' : ' btn-ghost'}`} aria-pressed={role === item.value} onClick={() => { setRole(item.value); setBlokirId(null); setAlasan(''); }}>{item.label}</button>)}
      </div>
    </Card>
    {!loading && <div className="info-box mb-16" role="status">Total {total} akun · Aktif {aktif} · Diblokir {diblokir}</div>}
    <Card style={{ padding: 0, width: '100%', minWidth: 0 }}>
      <div className="table-wrap">
        <table className="data-table" style={{ width: '100%' }}>
          <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Kos</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="muted" role="status">Memuat daftar akun…</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="muted">{error ? 'Daftar akun belum tersedia.' : 'Tidak ada akun yang sesuai pencarian dan filter.'}</td></tr> : filtered.map(user => <Fragment key={user.id}>
              <tr>
                <td className="bold" style={{ minWidth: 110 }}>{user.nama}</td>
                <td style={{ overflowWrap: 'anywhere' }}>{user.email}</td>
                <td style={{ whiteSpace: 'nowrap' }}><Badge tone={roleTones[user.peran]}>{roleLabels[user.peran]}</Badge></td>
                <td>{kosPemilik(user)}</td>
                <td style={{ minWidth: 130 }}>
                  <Badge tone={user.aktif ? 'success' : 'danger'} dot>{user.aktif ? 'Aktif' : 'Diblokir'}</Badge>
                  {!user.aktif && user.alasanNonaktif && <div className="deny-reason" style={{ color: 'var(--red-ink)', fontSize: 12, marginTop: 4 }}>Alasan: {user.alasanNonaktif}</div>}
                </td>
                <td style={{ minWidth: 140, whiteSpace: 'nowrap' }}>
                  {user.peran === 'SUPERADMIN' ? <span className="muted">Akun data awal</span> : user.aktif ? <button type="button" className="btn btn-danger-outline btn-sm" disabled={busyId !== null} aria-expanded={blokirId === user.id} aria-controls={`blokir-akun-${user.id}`} onClick={() => { setBlokirId(blokirId === user.id ? null : user.id); setAlasan(''); }}>Blokir</button> : <button type="button" className="btn btn-outline btn-sm" disabled={busyId !== null} onClick={() => ubahStatus(user, true)}>{busyId === user.id ? 'Menyimpan…' : 'Buka Blokir'}</button>}
                </td>
              </tr>
              {blokirId === user.id && user.aktif && <tr><td colSpan={6}>
                <form id={`blokir-akun-${user.id}`} className="acc-panel" style={{ display: 'flex', flexDirection: 'column', gap: 8 }} onSubmit={event => { event.preventDefault(); void ubahStatus(user, false); }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label htmlFor={`alasan-${user.id}`}>Alasan pemblokiran {user.nama} (wajib)</label>
                    <textarea id={`alasan-${user.id}`} required rows={2} value={alasan} disabled={busyId !== null} onChange={event => setAlasan(event.target.value)} placeholder="Wajib isi alasan pemblokiran"/>
                  </div>
                  <div className="booking-foot">
                    <button type="submit" className="btn btn-danger btn-sm" disabled={busyId !== null || !alasan.trim()}>{busyId === user.id ? 'Menyimpan…' : 'Blokir Akun'}</button>
                    <button type="button" className="btn btn-outline btn-sm" disabled={busyId !== null} onClick={() => { setBlokirId(null); setAlasan(''); }}>Batal</button>
                  </div>
                </form>
              </td></tr>}
            </Fragment>)}
          </tbody>
        </table>
      </div>
    </Card>
    <div className="info-box mt-16">Akun yang diblokir tidak dapat login, datanya tetap tersimpan, dan kos milik pemilik yang diblokir otomatis tersembunyi dari pencarian.</div>
  </div>;
}
