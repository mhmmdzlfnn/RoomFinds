'use client';
import { useRef, useState } from 'react';
import { BedDouble, Building2, ChevronDown, ImagePlus, Info, Save } from 'lucide-react';

export type DataKamarBaru = {
  nomor: string;
  lantai: string;
  sayap: string;
  tipe: 'STANDAR' | 'EKSKLUSIF';
  harga: number;
  fasilitas: string[];
  foto: string;
};

const lantaiOpsi = ['Lantai 1', 'Lantai 2', 'Lantai 3', 'Lantai 4'];
const sayapOpsi = ['Sayap Timur', 'Sayap Barat', 'Sayap Utara', 'Sayap Selatan'];
const fasilitasOpsi = ['AC', 'K. Mandi Dalam', 'WiFi', 'Kipas Angin', 'K. Mandi Luar', 'Water Heater', 'Balkon', 'Dapur'];
const batasFoto = 5 * 1024 * 1024;

export function TambahKamar({ namaKos, onBatal, onSimpan, galatServer }: {
  namaKos: string;
  onBatal: () => void;
  onSimpan: (data: DataKamarBaru) => Promise<void> | void;
  galatServer?: string;
}) {
  const [foto, setFoto] = useState('');
  const [namaFoto, setNamaFoto] = useState('');
  const [nomor, setNomor] = useState('');
  const [lantai, setLantai] = useState('');
  const [sayap, setSayap] = useState('');
  const [tipe, setTipe] = useState<'' | 'STANDAR' | 'EKSKLUSIF'>('');
  const [harga, setHarga] = useState('');
  const [fasilitas, setFasilitas] = useState<string[]>([]);
  const [galat, setGalat] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function pilihFoto(berkas?: File) {
    if (!berkas) return;
    if (!/^image\/(png|jpe?g)$/.test(berkas.type)) { setGalat('Foto harus berformat PNG atau JPG.'); return; }
    if (berkas.size > batasFoto) { setGalat('Ukuran foto maksimal 5 MB.'); return; }
    setGalat('');
    const pembaca = new FileReader();
    pembaca.onload = () => { setFoto(String(pembaca.result)); setNamaFoto(berkas.name); };
    pembaca.readAsDataURL(berkas);
  }

  async function kirim(event: React.FormEvent) {
    event.preventDefault();
    const nilai = Number(harga.replace(/\D/g, ''));
    if (!foto) { setGalat('Unggah foto kamar terlebih dahulu.'); return; }
    if (!nomor.trim() || !lantai || !tipe) { setGalat('Isi nomor kamar, lantai, dan tipe kamar.'); return; }
    if (!nilai) { setGalat('Isi harga per bulan dengan angka lebih dari nol.'); return; }
    setGalat('');
    setBusy(true);
    try {
      await onSimpan({ nomor: nomor.trim(), lantai, sayap, tipe, harga: nilai, fasilitas, foto });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fx-kamar-page">
      <nav className="fx-kamar-crumb" aria-label="Breadcrumb">
        <Building2 size={14} aria-hidden="true" />
        <button type="button" onClick={onBatal}>Kelola Kos &amp; Kamar</button>
        <span>&gt;</span>
        <strong>Tambah Kamar</strong>
      </nav>
      <div className="fx-kamar-head">
        <div>
          <h1>Tambah Kamar</h1>
          <p>Lengkapi detail unit kamar baru untuk {namaKos}.</p>
        </div>
        <span className="fx-kamar-mode"><i aria-hidden="true" />Mode Input Unit Baru</span>
      </div>

      <form className="fx-kamar-card" onSubmit={kirim} noValidate>
        <div className="fx-kamar-card-head">
          <span className="fx-kamar-card-icon"><BedDouble size={22} aria-hidden="true" /></span>
          <div><h2>Data Kamar</h2><p>Informasi detail dan fasilitas unit kamar baru.</p></div>
        </div>

        <div className="fx-kamar-field">
          <div className="fx-kamar-label-row"><span className="fx-kamar-label">Foto Kamar</span><small>Wajib diisi</small></div>
          <button type="button" className={`fx-kamar-upload${foto ? ' ada' : ''}`} onClick={() => input.current?.click()}>
            {foto ? <img src={foto} alt="Pratinjau foto kamar" /> : <>
              <span className="fx-kamar-upload-icon"><ImagePlus size={20} aria-hidden="true" /></span>
              <b>Klik untuk unggah foto kamar</b>
              <small>PNG atau JPG, maks. 5 MB</small>
            </>}
            {foto && <small className="fx-kamar-upload-nama">{namaFoto} · klik untuk mengganti</small>}
          </button>
          <input ref={input} type="file" accept="image/png,image/jpeg" hidden onChange={event => pilihFoto(event.target.files?.[0])} />
        </div>

        <div className="fx-kamar-grid">
          <div className="fx-kamar-field">
            <label htmlFor="kmr-nomor">Nomor Kamar <em>*</em></label>
            <input id="kmr-nomor" className="fx-kamar-input" value={nomor} onChange={event => setNomor(event.target.value)} placeholder="Contoh: 206" />
          </div>
          <div className="fx-kamar-field">
            <label htmlFor="kmr-lantai">Lantai <em>*</em></label>
            <div className="fx-kamar-select"><select id="kmr-lantai" value={lantai} onChange={event => setLantai(event.target.value)}><option value="">Pilih lantai</option>{lantaiOpsi.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div>
          </div>
          <div className="fx-kamar-field">
            <label htmlFor="kmr-sayap">Sayap</label>
            <div className="fx-kamar-select"><select id="kmr-sayap" value={sayap} onChange={event => setSayap(event.target.value)}><option value="">Pilih sayap</option>{sayapOpsi.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div>
          </div>
          <div className="fx-kamar-field">
            <label htmlFor="kmr-tipe">Tipe Kamar <em>*</em></label>
            <div className="fx-kamar-select"><select id="kmr-tipe" value={tipe} onChange={event => setTipe(event.target.value as typeof tipe)}><option value="">Pilih tipe</option><option value="STANDAR">Standar</option><option value="EKSKLUSIF">Eksklusif</option></select><ChevronDown size={16} aria-hidden="true" /></div>
          </div>
        </div>

        <div className="fx-kamar-field">
          <label htmlFor="kmr-harga">Harga per Bulan <em>*</em></label>
          <div className="fx-kamar-rp"><span>Rp</span><input id="kmr-harga" inputMode="numeric" value={harga} onChange={event => setHarga(event.target.value.replace(/\D/g, ''))} placeholder="Contoh: 1500000" /></div>
        </div>

        <fieldset className="fx-kamar-field">
          <legend>Fasilitas</legend>
          <div className="fx-kamar-chips">
            {fasilitasOpsi.map(item => <label key={item} className={fasilitas.includes(item) ? 'on' : ''}>
              <input type="checkbox" checked={fasilitas.includes(item)} onChange={() => setFasilitas(list => list.includes(item) ? list.filter(x => x !== item) : [...list, item])} />
              <span className="fx-kamar-box" aria-hidden="true" />{item}
            </label>)}
          </div>
        </fieldset>

        <div className="fx-kamar-info"><Info size={15} aria-hidden="true" /><span>Kamar baru berstatus <b>KOSONG</b> setelah disimpan. Anda dapat memperbarui ketersediaan kapan saja.</span></div>
        {(galat || galatServer) && <p className="fx-kamar-error" role="alert">{galat || galatServer}</p>}

        <div className="fx-kamar-actions">
          <button type="button" className="fx-kamar-batal" onClick={onBatal}>Batal</button>
          <button type="submit" className="fx-kamar-simpan" disabled={busy}><Save size={15} aria-hidden="true" />{busy ? 'Menyimpan…' : 'Simpan Kamar'}</button>
        </div>
      </form>
    </div>
  );
}
