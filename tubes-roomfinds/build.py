"""Merakit proposal RoomFinds: HTML -> PDF (Chrome headless), daftar isi dua lintasan, nomor halaman (PyMuPDF)."""
import html
import re
import subprocess
from pathlib import Path

import pymupdf

from content import (BLACKBOX, ENDPOINTS, FITUR, FR, HALAMAN, JADWAL, NAMA, NFR, REFERENSI, RISIKO, TEAM,
                     UNIT_TESTS)
from model import CLASSES, ENUMS, SERVICES, split

ROOT = Path(__file__).parent
HTML = ROOT / "proposal.html"
PDF = ROOT / "Proposal_Tubes_PBO_RoomFinds.pdf"
esc = html.escape


class Doc:
    def __init__(self):
        self.parts, self.toc, self.figs, self.tabs = [], [], [], []
        self.ch = self.sec = self.sub = self.nfig = self.ntab = 0

    def add(self, s):
        self.parts.append(s)

    def chapter(self, title):
        self.ch += 1; self.sec = self.nfig = self.ntab = 0
        hid = f"bab{self.ch}"
        self.toc.append((1, f"BAB {self.ch} {title.upper()}", hid))
        self.add(f'<h1 id="{hid}" class="bab">BAB {self.ch}<br>{esc(title.upper())}</h1>')

    def h2(self, title):
        self.sec += 1; self.sub = 0
        num = f"{self.ch}.{self.sec}"
        hid = f"s{num}"
        self.toc.append((2, f"{num} {title}", hid))
        self.add(f'<h2 id="{hid}">{num} {esc(title)}</h2>')

    def h3(self, title, toc=False):
        self.sub += 1
        num = f"{self.ch}.{self.sec}.{self.sub}"
        hid = f"s{num}"
        if toc:
            self.toc.append((3, f"{num} {title}", hid))
        self.add(f'<h3 id="{hid}">{num} {esc(title)}</h3>')

    def p(self, *texts):
        for t in texts:
            self.add(f"<p>{t}</p>")

    def ul(self, items, ordered=False):
        tag = "ol" if ordered else "ul"
        self.add(f"<{tag}>" + "".join(f"<li>{i}</li>" for i in items) + f"</{tag}>")

    def fig(self, src, caption, width="100%"):
        self.nfig += 1
        label = f"Gambar {self.ch}.{self.nfig}"
        fid = f"g{self.ch}_{self.nfig}"
        self.figs.append((f"{label} {caption}", fid, label))
        self.add(f'<figure id="{fid}"><img src="{src}" style="max-width:{width};max-height:var(--figmax)">'
                 f'<figcaption>{label} {esc(caption)}</figcaption></figure>')
        return label

    def table(self, caption, head, rows, widths=None, cls=""):
        self.ntab += 1
        label = f"Tabel {self.ch}.{self.ntab}"
        tid = f"t{self.ch}_{self.ntab}"
        self.tabs.append((f"{label} {caption}", tid, label))
        cols = "".join(f'<col style="width:{w}">' for w in widths) if widths else ""
        th = "".join(f"<th>{h}</th>" for h in head)
        body = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
        self.add(f'<div class="tcap" id="{tid}">{label} {esc(caption)}</div>'
                 f'<table class="{cls}"><colgroup>{cols}</colgroup><thead><tr>{th}</tr></thead><tbody>{body}</tbody></table>')
        return label

    def landscape(self, inner_fn):
        self.add('<div class="landscape">'); inner_fn(); self.add("</div>")

    def code(self, src):
        self.add(f"<pre><code>{esc(src.strip())}</code></pre>")


def c(x):
    return f"<code>{esc(x)}</code>"


def role(t):
    """Istilah role di narasi fitur: orang yang menyewa disebut User (kelas Penyewa tetap)."""
    return re.sub(r"\b[Pp]enyewa\b(?! \(role)", "User", t)


def rp(n):
    return f"Rp{n:,.0f}".replace(",", ".")


# ====================================================================== isi
def build(pages=None):
    d = Doc()
    pg = lambda hid: str(pages.get(hid, "")) if pages else "00"
    owner_of = lambda k: [n for n, x in CLASSES.items() if x["owner"] == k]

    # ---------------------------------------------------------- bab 1
    d.chapter("Pendahuluan")
    d.h2("Latar Belakang")
    d.p("Kos merupakan pilihan tempat tinggal utama bagi mahasiswa dan pekerja muda, tetapi pengelolaannya di banyak tempat masih manual. "
        "Verdinan dkk. mencatat bahwa pencatatan dengan buku tulis atau spreadsheet kerap menimbulkan ketidaktepatan pencatatan pembayaran, kesulitan "
        "memantau ketersediaan kamar, serta laporan keuangan yang lambat dan tidak akurat. Pada studi kasus mereka, pencatatan pembayaran dan laporan "
        "bulanan yang sebelumnya memerlukan sekitar 30 menit dapat diselesaikan dalam sekitar 5 menit dengan aplikasi web [1].",
        "Hubungan pemilik dan penyewa juga sering bermasalah karena kesepakatannya tidak jelas. Perjanjian sewa kos umumnya dibuat secara lisan sehingga "
        "berisiko menimbulkan masalah, misalnya saat penyewa menunggak dan pemilik menahan barang penyewa secara sepihak [2]. Tagihan listrik yang dibagi "
        "rata tanpa melihat pemakaian juga menjadi sumber keluhan [3]. Aplikasi pengelola kos yang sudah ada umumnya berfokus pada pengingat tagihan dan "
        "laporan keuangan [4].",
        "RoomFinds menggabungkan pencarian kamar dengan pengelolaan kos yang adil dan transparan: aturan kos dan denda disetujui penyewa secara tertulis "
        "saat booking, tagihan dirinci per komponen termasuk biaya pemakaian meteran, denda memiliki masa tenggang, penyewa dapat mengajukan penundaan, "
        "keluhan tercatat sampai selesai, dan setiap kos baru diverifikasi sebelum tampil di pencarian. Variasi di dunia kos, seperti jenis kamar, durasi "
        "sewa, komponen tagihan, aturan denda, metode pembayaran, dan role pengguna, dimodelkan sebagai inheritance, abstract class, dan interface.")
    d.h2("Tujuan")
    d.ul(["Membangun aplikasi web RoomFinds untuk pencarian dan pengelolaan kos di Jakarta Selatan dengan backend Java Spring Boot dan frontend Next.js.",
          f"Menerapkan konsep OOP secara menyeluruh pada {len(CLASSES)} kelas model dan {len(SERVICES)} kelas service.",
          "Membagi pekerjaan sehingga setiap anggota membuat kelas dan logika untuk fiturnya sendiri, sambil memegang peran utama di backend, basis data, atau frontend, dalam 4 minggu."], ordered=True)
    d.h2("Ruang Lingkup dan Batasan")
    d.ul(["Wilayah layanan hanya Jakarta Selatan. Alamat kos diisi manual oleh pemilik, dan sistem memvalidasi kode pos pada rentang 12110 sampai 12980. "
          "SuperAdmin memeriksa kesesuaian alamat sebelum kos tampil di pencarian.",
          "Aplikasi berbasis web dan dijalankan di lingkungan lokal untuk demo.",
          "Pembayaran tidak terhubung ke payment gateway. Transfer dibuktikan dengan unggah bukti, dan tunai dicatat pemilik.",
          "Notifikasi email atau WhatsApp dan aplikasi mobile tidak termasuk ruang lingkup."])
    d.table("Role pengguna", ["Role", "Kelas", "Akun", "Hak akses utama"],
            [["SuperAdmin", "SuperAdmin", "Data awal (seed)", "Verifikasi dan nonaktifkan kos, blokir dan aktifkan akun, statistik platform"],
             ["Pemilik", "Pemilik", "Registrasi", "Kelola kos, kamar, paket sewa, denda, booking, tagihan, pembayaran, keluhan, laporan"],
             ["User", "Penyewa", "Registrasi", "Cari kamar, booking, bayar tagihan, ajukan penundaan, lapor keluhan"]],
            ["14%", "13%", "17%", "56%"])
    d.p("Role User dimodelkan oleh kelas " + c("Penyewa") + " karena perilaku khususnya adalah perilaku penyewa kos, sedangkan nama " + c("Pengguna") +
        " dipakai untuk abstract class induk ketiga role.")

    # ---------------------------------------------------------- bab 2
    d.chapter("Analisis dan Daftar Fitur")
    d.h2("Perbandingan Solusi")
    d.table("Perbandingan dengan pencatatan manual dan aplikasi sejenis",
            ["Kebutuhan", "Pencatatan manual", "Pengelola kos umum [4]", "RoomFinds"],
            [["Pencatatan tagihan dan laporan", "Buku tulis, rawan salah [1]", "Tersedia", "Tagihan otomatis dan laporan bulanan"],
             ["Aturan kos dan denda", "Umumnya lisan [2]", "-", "Disetujui tertulis saat booking, ada simulasi denda"],
             ["Biaya pemakaian", "Sering dibagi rata [3]", "-", "Per kamar dari meteran, rumus terlihat"],
             ["Toleransi keterlambatan", "Tergantung pemilik", "-", "Masa tenggang dan pengajuan penundaan"],
             ["Keluhan kamar", "Lewat chat", "-", "Tercatat dengan status"],
             ["Keabsahan kos", "-", "-", "Diverifikasi SuperAdmin sebelum tampil"]],
            ["24%", "22%", "22%", "32%"])
    d.p("Tanda strip berarti fitur tidak disebutkan dalam sumber, bukan berarti tidak ada.")
    d.h2("Daftar Fitur")
    d.p(f"RoomFinds memiliki {len(FITUR)} fitur inti. PJ adalah anggota penanggung jawab: A {NAMA['A']}, B {NAMA['B']}, dan C {NAMA['C']}.")
    rows = []
    for fid, nama, pj, aktor, pra, alur, alt, aturan, kelas, ep in FITUR:
        rows.append([fid, f"<b>{esc(nama)}</b><br>" + role(" ".join(alur[:3]) if len(" ".join(alur[:3])) < 330 else " ".join(alur[:2])),
                     role("; ".join(aturan)), aktor, pj])
    d.table("Daftar fitur, alur, dan aturan bisnis", ["ID", "Fitur dan alur utama", "Aturan bisnis", "Aktor", "PJ"], rows,
            ["6%", "46%", "30%", "12%", "6%"], cls="small")
    d.h2("Use Case Diagram")
    d.p("Aktor terdiri dari tiga role manusia dan Penjadwal, yaitu proses terjadwal Spring (" + c("@Scheduled") +
        ") yang menerbitkan tagihan bulanan dan memperbarui status serta denda setiap hari.")
    d.add('<div class="ucgrid">')
    d.fig("img/uc_penyewa.png", "Use case User", "100%")
    d.fig("img/uc_admin.png", "Use case SuperAdmin", "100%")
    d.add('</div>')
    d.fig("img/uc_pemilik.png", "Use case Pemilik dan Penjadwal", "46%")

    # ---------------------------------------------------------- bab 3
    d.chapter("Rancangan Kelas")
    d.h2("Ringkasan dan Notasi")
    rows = []
    for k, _, _, _ in TEAM:
        cl = owner_of(k); sv = [n for n, x in SERVICES.items() if x["owner"] == k]
        rows.append([f"{k} ({NAMA[k]})", str(len(cl)), str(sum(CLASSES[n]["st"] == "abstract" for n in cl)),
                     str(sum(CLASSES[n]["st"] == "interface" for n in cl)), str(len(sv))])
    d.p(f"Rancangan terdiri dari {len(CLASSES)} kelas model, {len(SERVICES)} kelas service, dan {len(ENUMS)} enum, dengan 5 abstract class "
        "(Pengguna, Kamar, PaketSewa, ItemTagihan, Pembayaran) dan 2 interface (DapatDitagih, AturanDenda). Getter, setter, dan konstruktor tidak ditampilkan.")
    d.table("Jumlah kelas per anggota", ["Anggota", "Kelas model", "Abstract", "Interface", "Service"], rows, ["44%", "14%", "14%", "14%", "14%"])
    d.table("Notasi class diagram", ["Notasi", "Arti", "Notasi", "Arti"],
            [[c("+ - #"), "public, private, protected", "Segitiga garis lurus", "Inheritance"],
             ["Nama atau method miring", "Abstract", "Segitiga putus-putus", "Realization"],
             ["Method bergaris bawah", "Static", "Belah ketupat hitam / putih", "Composition / aggregation"],
             ["Kotak putus-putus", "Kelas modul lain", "Panah terbuka lurus / putus-putus", "Association / dependency"],
             ["Biru, hijau, jingga", "Modul A, B, C", "Angka di ujung garis", "Multiplisitas"]], ["20%", "24%", "30%", "26%"])

    def overview():
        d.h2("Gambaran Umum Relasi Antar Kelas")
        d.fig("img/overview.svg", "Class diagram gambaran umum RoomFinds")
    d.landscape(overview)

    def mod(title, img, text, cap):
        def inner():
            d.h2(title)
            d.p(text)
            d.fig(img, cap)
        d.landscape(inner)
    mod("Class Diagram Modul A: Pengguna, Kos, dan Booking", "img/modul_a1.svg",
        "Pengguna adalah abstract class dengan tiga subclass (SuperAdmin, Pemilik, Penyewa) yang masing-masing mengimplementasikan " + c("getPeran()") +
        ". Kos memiliki kamar dan paket sewa secara composition, memvalidasi kode pos Jakarta Selatan, dan membentuk AturanDenda lewat AturanDendaFactory. "
        "Booking menyimpan bukti persetujuan aturan dan menghubungkan penyewa, kamar, paket, dan tagihan.",
        "Class diagram modul A: pengguna, kos, laporan, booking (Sulthan)")
    mod("Class Diagram Modul A: Tagihan", "img/modul_a2.svg",
        "Tagihan mengimplementasikan DapatDitagih dan tersusun dari ItemTagihan. " + c("hitungTotal()") + " menjumlahkan " + c("item.hitung()") +
        " tanpa memeriksa jenis item (BiayaSewa, BiayaTetap, BiayaPemakaian), lalu menambahkan denda dari AturanDenda.",
        "Class diagram modul A: tagihan dan item tagihan (Sulthan)")
    mod("Class Diagram Modul B", "img/modul_b.svg",
        "Kamar adalah abstract class dengan " + c("hitungHargaBulanan()") + " dan " + c("getTipe()") + "; atribut " + c("hargaDasar") +
        " bersifat protected. PaketSewa menghitung total sewa di kelas induk, sedangkan durasi ditentukan subclass. Keluhan dan PengajuanPenundaan "
        "menjaga urutan statusnya sendiri.",
        "Class diagram modul B: kamar, paket sewa, keluhan, penundaan (Fariz)")
    mod("Class Diagram Modul C", "img/modul_c.svg",
        "AturanDenda adalah interface dengan tiga implementasi yang dibuat AturanDendaFactory. Pembayaran adalah abstract class dengan " + c("proses()") +
        " yang menentukan status awal sesuai metode. SuperAdmin adalah subclass Pengguna yang memverifikasi kos dan mengelola akun, dibantu StatistikPlatform.",
        "Class diagram modul C: denda, pembayaran, SuperAdmin (Zulfan)")

    d.h2("Class Diagram Lapisan Service")
    d.p("Service berisi logika yang melibatkan beberapa objek, penyimpanan, dan proses terjadwal. Panah putus-putus menunjukkan service yang memanggil service modul lain.")
    d.fig("img/service.svg", "Class diagram lapisan service", "88%")

    d.h2("Enum, Relasi, dan Penerapan OOP")
    d.table("Enum", ["Enum", "Nilai", "Dipakai oleh"], [[n, ", ".join(v), u] for n, (v, u) in ENUMS.items()], ["24%", "52%", "24%"], cls="small")
    d.table("Penerapan konsep OOP", ["Konsep", "Penerapan"],
            [["Encapsulation", "Atribut private atau protected dan diubah lewat method yang memvalidasi, misalnya " + c("Kamar.tandaiTerisi()") + ", " +
              c("Kos.ubahLokasi()") + ", " + c("PaketSewa.ubahDiskon()") + ", " + c("Keluhan.selesaikan()") + "."],
             ["Inheritance", "Pengguna (SuperAdmin, Pemilik, Penyewa), Kamar, PaketSewa, ItemTagihan, Pembayaran."],
             ["Abstract class dan interface", "Lima abstract class dan dua interface (DapatDitagih, AturanDenda)."],
             ["Polimorfisme", c("getPeran()") + ", " + c("hitungHargaBulanan()") + ", " + c("getDurasiBulan()") + ", " + c("hitung()") + ", " +
              c("hitungDenda()") + ", dan " + c("proses()") + " dipanggil tanpa memeriksa jenis objek."],
             ["Composition, aggregation, dependency", "Kos dengan Kamar dan PaketSewa; Tagihan dengan ItemTagihan dan PengajuanPenundaan (composition); "
              "Tagihan dengan Pembayaran (aggregation); Kos dan Tagihan memakai AturanDenda (dependency)."]], ["24%", "76%"])
    d.code("""
public double hitungTotal() {                       // Tagihan implements DapatDitagih
    double item = items.stream().mapToDouble(ItemTagihan::hitung).sum();
    long telat = ChronoUnit.DAYS.between(getJatuhTempoEfektif(), LocalDate.now());
    AturanDenda aturan = booking.getKamar().getKos().getAturanDenda();
    return item + (telat > 0 ? aturan.hitungDenda(item, (int) telat) : 0);
}""")

    # ---------------------------------------------------------- bab 4
    d.chapter("Arsitektur dan Teknologi")
    d.p("Next.js hanya menangani tampilan. Request " + c("/api/*") + " diteruskan ke Spring Boot melalui rewrites, sehingga tidak perlu CORS dan login cukup "
        "memakai session cookie. Spring Boot dibagi menjadi controller, service, model, dan repository.")
    d.fig("img/arsitektur.svg", "Arsitektur sistem", "100%")
    d.table("Teknologi", ["Komponen", "Teknologi"],
            [["Backend", "Java 21, Spring Boot 3, Spring Web, Spring Data JPA, Bean Validation, JUnit 5"],
             ["Basis data", "PostgreSQL. Hierarki kelas dipetakan dengan @Inheritance (JOINED untuk Pengguna, SINGLE_TABLE untuk Kamar, PaketSewa, ItemTagihan, Pembayaran)"],
             ["Frontend", "Next.js (App Router), TypeScript, Tailwind CSS"],
             ["Kolaborasi dan uji", "Git dan GitHub (satu branch per anggota), Postman"]], ["22%", "78%"])

    # ---------------------------------------------------------- bab 5
    d.chapter("Pembagian Tugas dan Jadwal")
    detail = {
        "A": "Backend lead: desain skema basis data dan pemetaan JPA, kontrak API, integrasi antarmodul, review kode backend anggota lain.",
        "B": "Setup PostgreSQL, data awal (termasuk akun SuperAdmin dan data contoh), dan halaman sisi pemilik.",
        "C": "Kerangka Next.js (layout, lib/api.ts, rewrites) dan halaman publik, User, serta SuperAdmin.",
    }
    peran = {"A": "Backend + basis data", "B": "Frontend + basis data", "C": "Frontend"}
    rows = []
    for k, n, nim, judul in TEAM:
        fitur = ", ".join(f"{f[0]} {f[1]}" for f in FITUR if f[2] == k)
        kelas = ", ".join(owner_of(k))
        svc = ", ".join(x for x, y in SERVICES.items() if y["owner"] == k)
        hal = ", ".join(h[0] for h in HALAMAN if h[3] == k)
        rows.append([f"<b>{n}</b><br>{nim}<br>Modul {k}<br><i>{peran[k]}</i>", fitur, kelas + "<br><i>Service:</i> " + svc,
                     detail[k] + (f"<br><i>Halaman:</i> {hal}." if hal else "")])
    d.table("Pembagian tugas anggota", ["Anggota", "Fitur", "Kelas yang dibuat dan diprogram", "Peran utama dan halaman"], rows,
            ["16%", "28%", "30%", "26%"], cls="small")
    d.p("Setiap anggota tetap membuat kelas model, service, controller, dan unit test untuk fiturnya sendiri, sehingga tidak ada yang hanya mengerjakan tampilan. "
        "Sulthan memegang fitur paling banyak karena berperan sebagai backend lead, sedangkan Fariz dan Zulfan memegang fitur yang lebih mandiri agar dapat "
        "membagi waktu dengan pekerjaan frontend. Titik integrasi antarmodul disepakati di minggu 1.")
    d.table("Titik integrasi antarmodul", ["Pemicu", "Pemanggil", "Dipanggil", "Akibat"],
            [["Booking disetujui", "BookingService (A)", "KamarService.tandaiTerisi() (B), TagihanService.terbitkanTagihanPertama() (A)", "Kamar terisi, tagihan pertama terbit"],
             ["Hitung denda", "Tagihan (A)", "Kos.getAturanDenda() (A), AturanDenda.hitungDenda() (C)", "Denda sesuai aturan kos"],
             ["Penundaan disetujui", "PenundaanService (B)", "Tagihan.getJatuhTempoEfektif() (A)", "Denda tidak dihitung sampai tanggal baru"],
             ["Pembayaran diverifikasi", "PembayaranService (C)", "Tagihan.catatPembayaran() (A)", "Sisa dan status tagihan diperbarui"],
             ["Kos diverifikasi", "AdminService (C)", "Kos.setujuiVerifikasi() (A)", "Kos tampil di pencarian (B)"]],
            ["18%", "20%", "38%", "24%"], cls="small")
    d.h2("Jadwal Pengerjaan")
    d.table("Jadwal 4 minggu", ["Minggu", f"A ({NAMA['A'].split()[0]})", f"B ({NAMA['B'].split()[0]})", f"C ({NAMA['C'].split()[1]})", "Bersama"],
            [list(j) for j in JADWAL], ["8%", "23%", "23%", "23%", "23%"], cls="small")
    d.h2("Risiko dan Mitigasi")
    d.table("Risiko dan mitigasi", ["Risiko", "Mitigasi"], [[r[0], r[2]] for r in RISIKO[:4]] + [[RISIKO[5][0], RISIKO[5][2]]], ["32%", "68%"], cls="small")

    # ---------------------------------------------------------- pustaka
    d.toc.append((1, "DAFTAR PUSTAKA", "pustaka"))
    d.add('<h1 id="pustaka" class="bab">DAFTAR PUSTAKA</h1><ol class="ref">' + "".join(f"<li>{r}</li>" for r in REFERENSI) + "</ol>")

    team_rows = "".join(f"<tr><td>{n}</td><td>{nim}</td></tr>" for _, n, nim, _ in TEAM)
    cover = f"""
<section class="cover">
  <div class="c1">PROPOSAL TUGAS BESAR<br>PEMROGRAMAN BERORIENTASI OBJEK</div>
  <div class="logo">RoomFinds</div>
  <div class="c2">Platform Pencarian dan Pengelolaan Kos yang Adil dan Transparan<br>di Jakarta Selatan</div>
  <div class="c3">Disusun oleh Kelompok [Nomor Kelompok]</div>
  <table class="team"><tbody>{team_rows}</tbody></table>
  <div class="c4">Telkom University<br>2026</div>
</section>"""
    rows = "".join(f'<div class="toc l{lv}"><a href="#{i}"><span class="t">{esc(t)}</span><span class="dots"></span><span class="n">{pg(i)}</span></a></div>'
                   for lv, t, i in d.toc)
    toc = f'<section class="front"><h1 class="front">DAFTAR ISI</h1>{rows}</section>'
    css = (ROOT / "style.css").read_text()
    HTML.write_text(f'<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Proposal RoomFinds</title><style>{css}</style></head><body>'
                    + cover + toc + "".join(d.parts) + "</body></html>")
    return d


def render():
    subprocess.run(["google-chrome-stable", "--headless=new", "--disable-gpu", "--no-pdf-header-footer",
                    f"--print-to-pdf={PDF}", f"file://{HTML}"], check=True, capture_output=True)


def find_pages(d):
    doc = pymupdf.open(PDF)
    texts = [" ".join(p.get_text().split()) for p in doc]
    # cari setelah halaman daftar (lewati halaman yang memuat entri daftar isi)
    first_body = next(i for i, t in enumerate(texts) if "BAB 1 PENDAHULUAN" in t and "1.1 Latar Belakang" in t and "Kos merupakan" in t)
    pages = {"daftar-isi": None, "daftar-gambar": None, "daftar-tabel": None}
    for i, t in enumerate(texts[:first_body]):
        for key, title in (("daftar-isi", "DAFTAR ISI"), ("daftar-gambar", "DAFTAR GAMBAR"), ("daftar-tabel", "DAFTAR TABEL")):
            if pages[key] is None and t.startswith(title):
                pages[key] = i + 1
    def locate(needle, start):
        for i in range(start, len(texts)):
            if needle in texts[i]:
                return i
        raise SystemExit(f"tidak ditemukan: {needle}")
    for lv, t, hid in d.toc:
        if hid.startswith("bab"):
            needle = f"BAB {hid[3:]} " + t.split(" ", 2)[2]
        elif hid == "pustaka":
            needle = "DAFTAR PUSTAKA"
        else:
            needle = t
        pages[hid] = locate(needle, first_body) + 1
    for t, i, label in d.figs + d.tabs:
        pages[i] = locate(t[:60], first_body) + 1
    return pages, len(texts)


def stamp():
    doc = pymupdf.open(PDF)
    for i, page in enumerate(doc):
        if i == 0:
            continue
        r = page.rect
        page.insert_text((r.width / 2 - 6, r.height - 28), str(i + 1), fontsize=9, fontname="helv")
        page.insert_text((r.width - 190, r.height - 28), "RoomFinds | Proposal Tubes PBO", fontsize=7.5, fontname="helv", color=(0.45, 0.45, 0.45))
    doc.save(PDF.with_suffix(".tmp.pdf"))
    doc.close()
    PDF.with_suffix(".tmp.pdf").replace(PDF)


if __name__ == "__main__":
    d = build(); render()
    pages, n = find_pages(d)
    for _ in range(3):
        d = build(pages); render()
        new, n = find_pages(d)
        if new == pages:
            break
        pages = new
    stamp()
    print("halaman:", n, "| gambar:", len(d.figs), "| tabel:", len(d.tabs))
