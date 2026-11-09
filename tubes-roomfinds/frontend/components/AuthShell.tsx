import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

const manfaat = [
  { ikon: 'verified', w: 22, h: 21, judul: 'Terverifikasi & Terpercaya', isi: 'Setiap listing kos telah melalui kurasi ketat tim kami.' },
  { ikon: 'biaya', w: 22, h: 16, judul: 'Bebas Biaya Admin Tambahan', isi: 'Bayar sewa tanpa potongan atau biaya tersembunyi.' },
  { ikon: 'kontrak', w: 16, h: 20, judul: 'Kontrak & Transaksi Transparan', isi: 'Keamanan hukum dan kejelasan perjanjian sewa terjamin.' },
];

export function AuthShell({ variant, children }: { variant: 'auth' | 'register'; children: React.ReactNode }) {
  return (
    <div className="fx-page fx-auth-page">
      <Navbar variant={variant} />
      <main className="fx-auth-split">
        <aside className="fx-auth-panel">
          <span className="fx-auth-blur fx-auth-blur-a" aria-hidden="true" />
          <span className="fx-auth-blur fx-auth-blur-b" aria-hidden="true" />
          <Link className="fx-auth-brand" href="/">
            <span className="fx-auth-brand-icon"><img src="/figma/auth/brand-home.svg" width="19" height="21" alt="" /></span>
            <span><strong>RoomFinds</strong><small>Platform Cari Kos #1 di Indonesia</small></span>
          </Link>
          <div className="fx-auth-pitch">
            <span className="fx-auth-welcome">Selamat Datang Kembali</span>
            <h1>Temukan kos impian Anda dengan mudah, aman, dan transparan tanpa biaya tersembunyi.</h1>
            <p>Bergabunglah dengan ribuan pencari kos dan pemilik properti yang telah mempercayai RoomFinds untuk transaksi hunian mereka.</p>
            <ul className="fx-auth-benefits">
              {manfaat.map(item => <li key={item.ikon}>
                <span><img src={`/figma/auth/benefit-${item.ikon}.svg`} width={item.w} height={item.h} alt="" /></span>
                <div><h2>{item.judul}</h2><p>{item.isi}</p></div>
              </li>)}
            </ul>
          </div>
          <p className="fx-auth-copy">© 2024 RoomFinds Indonesia. Seluruh hak cipta dilindungi.</p>
        </aside>
        <section className="fx-auth-side">{children}</section>
      </main>
      <footer className="fx-footer">
        <span>© 2026 RoomFinds. Hak cipta dilindungi.</span>
        <span className="fx-footer-links">
          <details className="fx-pop"><summary>Kebijakan Privasi</summary><p>Dalam mode demo, profil disimpan di browser dan tidak dikirim ke server. Peta Google Maps pada detail kamar menggunakan layanan pihak ketiga.</p></details>
          <details className="fx-pop"><summary>Syarat &amp; Ketentuan</summary><p>Booking memerlukan akun User dan persetujuan aturan kos. Harga, paket sewa, serta aturan denda ditampilkan sebelum pengajuan. Transaksi mode demo bukan transaksi sewa nyata.</p></details>
        </span>
      </footer>
    </div>
  );
}
