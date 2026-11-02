"""Diagram pendukung RoomFinds: use case, aktivitas, state, sequence, arsitektur, peta halaman."""
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).parent / "img"
OUT.mkdir(exist_ok=True)
FONT = 'fontname="Liberation Sans"'


def dot(name, src, fmt="svg", dpi=None):
    (OUT / f"{name}.dot").write_text(src)
    args = ["dot", f"-T{fmt}", "-o", str(OUT / f"{name}.{fmt}")] + ([f"-Gdpi={dpi}"] if dpi else [])
    subprocess.run(args, input=src.encode(), check=True, cwd=OUT)


# ---------------------------------------------------------------- use case
def actor_png():
    im = Image.new("RGBA", (60, 90), (255, 255, 255, 0))
    d = ImageDraw.Draw(im)
    k = dict(fill="black", width=3)
    d.ellipse((20, 4, 40, 24), outline="black", width=3)
    d.line((30, 24, 30, 58), **k); d.line((12, 36, 48, 36), **k)
    d.line((30, 58, 14, 84), **k); d.line((30, 58, 46, 84), **k)
    im.save(OUT / "actor.png")


def usecase_one(name, actor, cases, rel=(), extra_actor=None):
    uc = lambda s: f'"{s}" [shape=ellipse, style=filled, fillcolor="#F7F7F7", {FONT}, fontsize=10];'
    act = lambda n: f'"{n}" [shape=none, image="actor.png", labelloc=b, height=1.3, width=1.1, fixedsize=true, label="{n}", {FONT}, fontsize=11];'
    l = ['digraph G { rankdir=LR; nodesep=0.1; ranksep=0.9;', act(actor),
         'subgraph cluster_sys { label="RoomFinds"; style=rounded; ' + FONT + '; fontsize=12;']
    l += [uc(c) for c in cases] + [uc(b) for _, b, _ in rel if b not in cases]
    l += [f'"{a}" -> "{b}" [style=dashed, arrowhead=vee, label="<<{k}>>", {FONT}, fontsize=8];' for a, b, k in rel]
    if extra_actor:
        l += [uc(c) for c in extra_actor[1]]
    l += ["}"]
    l += [f'"{actor}" -> "{c}" [arrowhead=none];' for c in cases]
    if extra_actor:
        l += [act(extra_actor[0])] + [f'"{c}" -> "{extra_actor[0]}" [arrowhead=none];' for c in extra_actor[1]]
    l += ["}"]
    dot(name, "\n".join(l), fmt="png", dpi=130)


def usecase():
    actor_png()
    usecase_one("uc_penyewa", "User",
                ["Registrasi dan login", "Kelola profil", "Cari kamar kosong", "Ajukan booking", "Batalkan booking",
                 "Lihat tagihan rinci", "Bayar tagihan", "Ajukan penundaan", "Lihat riwayat pembayaran", "Laporkan keluhan"],
                rel=[("Ajukan booking", "Setujui aturan kos", "include"), ("Bayar tagihan", "Lihat tagihan rinci", "include"),
                     ("Ajukan penundaan", "Lihat tagihan rinci", "extend")])
    usecase_one("uc_pemilik", "Pemilik",
                ["Registrasi dan login", "Kelola profil dan rekening", "Daftarkan kos di Jakarta Selatan", "Kelola kos dan aturan kos", "Kelola kamar", "Atur paket sewa",
                 "Atur aturan denda", "Setujui atau tolak booking", "Check-out penyewa", "Input meteran", "Catat pembayaran tunai",
                 "Verifikasi pembayaran", "Putuskan penundaan", "Tanggapi keluhan", "Lihat dashboard dan laporan"],
                extra_actor=("Penjadwal", ["Terbitkan tagihan bulanan", "Perbarui status dan denda"]))
    usecase_one("uc_admin", "SuperAdmin",
                ["Login", "Lihat antrean kos baru", "Verifikasi kos", "Nonaktifkan kos bermasalah", "Cari dan kelola akun",
                 "Blokir atau aktifkan akun", "Lihat statistik platform"],
                rel=[("Verifikasi kos", "Periksa lokasi Jakarta Selatan", "include")])


# ---------------------------------------------------------------- aktivitas
def lane(name, label, nodes):
    return [f'subgraph cluster_{name} {{ label="{label}"; style=filled; fillcolor="#FAFAFA"; color="#999999"; {FONT}; fontsize=11;'] + nodes + ["}"]


ACT = f'node [shape=box, style="rounded,filled", fillcolor="white", {FONT}, fontsize=10]; edge [{FONT}, fontsize=9, arrowhead=vee];'
START = '[shape=circle, style=filled, fillcolor=black, label="", width=0.2]'
END = '[shape=doublecircle, style=filled, fillcolor=black, label="", width=0.15]'
DEC = '[shape=diamond, label="", width=0.3, height=0.3]'


def act_booking():
    l = ["digraph G { rankdir=TB; newrank=true; nodesep=0.3; ranksep=0.3;", ACT]
    l += lane("p", "User", [f"s {START};", 'a1 [label="Cari kamar kosong"];', 'a2 [label="Pilih kamar, paket,\\ndan tanggal masuk"];',
                               'a3 [label="Baca aturan kos\\ndan simulasi denda"];', 'a4 [label="Centang persetujuan\\ndan ajukan booking"];',
                               'a9 [label="Lihat alasan penolakan"];', f"e2 {END};"])
    l += lane("s", "Sistem", ['b1 [label="Validasi kamar tersedia\\ndan setujuAturan"];', 'b2 [label="Simpan booking MENUNGGU,\\nkamar DIPESAN"];',
                              'b4 [label="Booking DISETUJUI,\\nkamar TERISI"];', 'b5 [label="Terbitkan tagihan pertama"];',
                              'b6 [label="Booking DITOLAK,\\nkamar KOSONG"];', f"e1 {END};"])
    l += lane("o", "Pemilik", ['c1 [label="Tinjau booking masuk"];', f"d1 {DEC};"])
    l += ['s -> a1 -> a2 -> a3 -> a4 -> b1 -> b2 -> c1 -> d1;',
          'd1 -> b4 [label="setuju"]; b4 -> b5 -> e1;',
          'd1 -> b6 [label="tolak"]; b6 -> a9 -> e2;', "}"]
    dot("act_booking", "\n".join(l))


def act_bayar():
    l = ["digraph G { rankdir=TB; newrank=true; nodesep=0.3; ranksep=0.3;", ACT]
    l += lane("p", "User", [f"s {START};", 'a1 [label="Buka tagihan rinci"];', f"d1 {DEC};",
                               'a2 [label="Isi jumlah, bank,\\nunggah bukti"];', 'a3 [label="Serahkan uang tunai"];', 'a5 [label="Ajukan lagi\\ndengan bukti benar"];'])
    l += lane("s", "Sistem", ['b1 [label="Simpan PembayaranTransfer\\nMENUNGGU_VERIFIKASI"];', 'b3 [label="Hitung ulang sisa\\ndan status tagihan"];',
                              f"d3 {DEC};", 'b4 [label="Tagihan LUNAS"];', 'b5 [label="Tagihan tetap\\nBELUM_BAYAR / TERLAMBAT"];', f"e {END};"])
    l += lane("o", "Pemilik", ['c1 [label="Periksa bukti transfer"];', f"d2 {DEC};", 'c2 [label="Catat PembayaranTunai\\n(langsung DITERIMA)"];',
                               'c3 [label="Tolak dengan catatan"];'])
    l += ['s -> a1 -> d1; d1 -> a2 [label="transfer"]; d1 -> a3 [label="tunai"];',
          'a2 -> b1 -> c1 -> d2; d2 -> b3 [label="terima"]; d2 -> c3 [label="tolak"]; c3 -> a5;',
          'a3 -> c2 -> b3; b3 -> d3; d3 -> b4 [label="sisa 0"]; d3 -> b5 [label="sisa > 0"]; b4 -> e; b5 -> e;', "}"]
    dot("act_bayar", "\n".join(l))


def act_denda():
    l = ["digraph G { rankdir=TB; nodesep=0.4; ranksep=0.3;", ACT,
         f"s {START};",
         'a1 [label="Ambil tanggal acuan = getJatuhTempoEfektif()"];',
         'a2 [label="hariTerlambat = hariIni - tanggal acuan"];',
         'd1 [shape=diamond, label="hariTerlambat\\n<= masaTenggang?", fontsize=9];',
         'a3 [label="denda = 0"];',
         'd2 [shape=diamond, label="Jenis aturan?", fontsize=9];',
         'h [label="DendaHarian:\\nmin(nominalPerHari x (hariTerlambat - masaTenggang),\\nbatasMaksimal)"];',
         'f [label="DendaFlat:\\nnominal"];', 't [label="TanpaDenda:\\n0"];',
         'a4 [label="total = jumlah item.hitung() + denda"];', f"e {END};",
         's -> a1 -> a2 -> d1; d1 -> a3 [label="ya"]; d1 -> d2 [label="tidak"];',
         'd2 -> h; d2 -> f; d2 -> t; a3 -> a4; h -> a4; f -> a4; t -> a4; a4 -> e;', "}"]
    dot("act_denda", "\n".join(l))


def act_verifikasi():
    l = ["digraph G { rankdir=TB; newrank=true; nodesep=0.3; ranksep=0.3;", ACT]
    l += lane("o", "Pemilik", [f"s {START};", 'a1 [label="Isi data kos: nama,\\nalamat, kode pos"];',
                               'a2 [label="Tambah kamar dan aturan kos"];', 'a3 [label="Perbaiki data\\nsesuai catatan"];'])
    l += lane("s", "Sistem", [f"v {DEC};", 'b0 [label="Tolak: kode pos di luar\\nJakarta Selatan"];',
                              'b1 [label="Simpan kos MENUNGGU,\\nbuat 3 paket default"];', 'b2 [label="Kos TERVERIFIKASI,\\ntampil di pencarian"];',
                              'b3 [label="Kos DITOLAK\\ndengan catatan"];', f"e {END};"])
    l += lane("a", "SuperAdmin", ['c1 [label="Periksa antrean kos baru:\\nalamat, kamar, aturan"];', f"d {DEC};"])
    l += ['s -> a1 -> v; v -> b0 [label="tidak valid"]; b0 -> a1; v -> b1 [label="valid"]; b1 -> a2 -> c1 -> d;',
          'd -> b2 [label="setuju"]; d -> b3 [label="tolak"]; b3 -> a3 -> c1; b2 -> e;', "}"]
    dot("act_verifikasi", "\n".join(l))


# ---------------------------------------------------------------- state
def state(name, states, trans, final):
    l = [f"digraph G {{ rankdir=LR; nodesep=0.3; ranksep=0.45; node [shape=box, style=rounded, {FONT}, fontsize=10]; edge [{FONT}, fontsize=8, arrowhead=vee];",
         f"start {START};", f'start -> "{states[0]}";'] + ([f"end {END};"] if final else [])
    l += [f'"{a}" -> "{b}" [label="{lab}"];' for a, b, lab in trans]
    l += [f'"{s}" -> end;' for s in final] + ["}"]
    dot(name, "\n".join(l))


def states():
    state("st_booking", ["MENUNGGU"], [("MENUNGGU", "DISETUJUI", "konfirmasi()"), ("MENUNGGU", "DITOLAK", "tolak(alasan)"),
                                      ("MENUNGGU", "DIBATALKAN", "batalkan()"), ("DISETUJUI", "SELESAI", "checkOut()\\n[semua tagihan lunas]")],
          ["DITOLAK", "DIBATALKAN", "SELESAI"])
    state("st_tagihan", ["BELUM_BAYAR"], [("BELUM_BAYAR", "MENUNGGU_VERIFIKASI", "bayar transfer"),
                                          ("MENUNGGU_VERIFIKASI", "LUNAS", "diterima\\n[sisa = 0]"),
                                          ("MENUNGGU_VERIFIKASI", "BELUM_BAYAR", "ditolak / sisa > 0"),
                                          ("BELUM_BAYAR", "TERLAMBAT", "lewat masa tenggang"),
                                          ("TERLAMBAT", "MENUNGGU_VERIFIKASI", "bayar transfer"),
                                          ("BELUM_BAYAR", "LUNAS", "tunai\\n[sisa = 0]"), ("TERLAMBAT", "LUNAS", "tunai\\n[sisa = 0]")],
          ["LUNAS"])
    state("st_kos", ["MENUNGGU"], [("MENUNGGU", "TERVERIFIKASI", "setujuiVerifikasi()"), ("MENUNGGU", "DITOLAK", "tolakVerifikasi(catatan)"),
                                   ("DITOLAK", "MENUNGGU", "data diperbaiki"), ("TERVERIFIKASI", "DINONAKTIFKAN", "nonaktifkan(alasan)"),
                                   ("TERVERIFIKASI", "MENUNGGU", "ubahLokasi()"), ("DINONAKTIFKAN", "MENUNGGU", "ajukan ulang")], [])
    state("st_keluhan", ["DILAPORKAN"], [("DILAPORKAN", "DIPROSES", "proses(tanggapan)"), ("DIPROSES", "SELESAI", "selesaikan(tanggapan)"),
                                         ("DILAPORKAN", "DIHAPUS", "hapus oleh penyewa")], ["SELESAI", "DIHAPUS"])


# ---------------------------------------------------------------- sequence
def sequence():
    parts = ["Pemilik\n(Next.js)", ":BookingController", ":BookingService", ":Booking", ":KamarService", ":TagihanService", ":Tagihan"]
    msgs = [  # (dari, ke, teks, balasan?)
        (0, 1, "PATCH /api/booking/{id}/konfirmasi", False),
        (1, 2, "konfirmasi(id, pemilik)", False),
        (2, 2, "cek kos milik pemilik", False),
        (2, 3, "konfirmasi()", False),
        (3, 2, "status = DISETUJUI", True),
        (2, 4, "tandaiTerisi(kamarId)", False),
        (4, 2, "kamar TERISI", True),
        (2, 5, "terbitkanTagihanPertama(booking)", False),
        (5, 6, "new Tagihan + tambahItem(BiayaSewa, BiayaTetap)", False),
        (6, 5, "tagihan", True),
        (5, 2, "tagihan", True),
        (2, 1, "booking", True),
        (1, 0, "200 OK + BookingDto", True),
    ]
    W, gap, top, step = 150, 0, 60, 34
    width = W * len(parts) + 20
    height = top + step * (len(msgs) + 1) + 20
    x = lambda i: 10 + W * i + W / 2
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" font-family="Liberation Sans" font-size="11">',
         '<defs><marker id="f" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker>'
         '<marker id="o" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10" fill="none" stroke="black"/></marker></defs>']
    for i, p in enumerate(parts):
        lines = p.split("\n")
        s.append(f'<rect x="{x(i) - 68}" y="10" width="136" height="34" fill="#F7F7F7" stroke="black"/>')
        for k, t in enumerate(lines):
            s.append(f'<text x="{x(i)}" y="{27 + (k - (len(lines) - 1) / 2) * 13 + 4}" text-anchor="middle">{t}</text>')
        s.append(f'<line x1="{x(i)}" y1="44" x2="{x(i)}" y2="{height - 10}" stroke="#666" stroke-dasharray="4,3"/>')
    for k, (a, b, t, ret) in enumerate(msgs):
        y = top + step * (k + 1)
        if a == b:
            s.append(f'<path d="M{x(a)},{y - 8} h30 v14 h-30" fill="none" stroke="black" marker-end="url(#f)"/>')
            s.append(f'<text x="{x(a) + 36}" y="{y + 2}">{t}</text>')
            continue
        dash = ' stroke-dasharray="5,3"' if ret else ""
        s.append(f'<line x1="{x(a)}" y1="{y}" x2="{x(b)}" y2="{y}" stroke="black"{dash} marker-end="url(#{"o" if ret else "f"})"/>')
        s.append(f'<text x="{(x(a) + x(b)) / 2}" y="{y - 5}" text-anchor="middle">{t.replace("{", "&#123;").replace("}", "&#125;")}</text>')
    s.append("</svg>")
    (OUT / "seq_konfirmasi.svg").write_text("\n".join(s))


# ---------------------------------------------------------------- arsitektur & peta halaman
def arsitektur():
    l = [f'digraph G {{ rankdir=LR; nodesep=0.3; ranksep=0.5; node [shape=box, style="rounded,filled", fillcolor=white, {FONT}, fontsize=10]; edge [{FONT}, fontsize=9, arrowhead=vee];',
         'browser [label="Browser\\n(User / Pemilik / SuperAdmin)"];',
         'subgraph cluster_fe { label="Frontend: Next.js + Tailwind (port 3000)"; style=filled; fillcolor="#F5F5F5"; ' + FONT + ';',
         'hal [label="Halaman (app/)\\npenyewa/* dan pemilik/*"]; komp [label="Komponen\\n(components/)"]; api [label="lib/api.ts\\nfetch /api/*"]; }',
         'subgraph cluster_be { label="Backend: Spring Boot 3, Java 21 (port 8080)"; style=filled; fillcolor="#F5F5F5"; ' + FONT + ';',
         'ctrl [label="controller\\nREST + DTO"]; svc [label="service\\nlogika bisnis, @Scheduled"]; model [label="model\\nentitas OOP + JPA"]; repo [label="repository\\nSpring Data JPA"]; }',
         'db [label="PostgreSQL", shape=cylinder];',
         'browser -> hal; hal -> komp [arrowhead=none, style=dotted]; hal -> api; api -> ctrl [label="rewrites /api/*\\nsession cookie"];',
         'ctrl -> svc -> model; svc -> repo -> db;', "}"]
    dot("arsitektur", "\n".join(l))


def sitemap():
    adm = ["Dashboard statistik", "Verifikasi kos", "Kelola akun"]
    pen = ["Cari kamar", "Detail kamar", "Persetujuan aturan", "Booking saya", "Tagihan saya", "Bayar tagihan",
           "Ajukan penundaan", "Riwayat pembayaran", "Keluhan", "Profil"]
    pem = ["Dashboard", "Kos dan kamar", "Paket sewa", "Aturan denda", "Booking masuk", "Tagihan dan meteran",
           "Verifikasi pembayaran", "Penundaan", "Papan keluhan", "Laporan", "Profil dan rekening"]
    l = [f'digraph G {{ rankdir=LR; nodesep=0.08; ranksep=0.5; node [shape=box, style="rounded,filled", fillcolor=white, {FONT}, fontsize=10]; edge [arrowhead=none];',
         'root [label="RoomFinds"]; pub [label="Publik\\nlanding, login, registrasi"]; p [label="User", fillcolor="#EAF7EE"]; o [label="Pemilik", fillcolor="#EAF1FB"]; a [label="SuperAdmin", fillcolor="#FDF3E6"];',
         'root -> pub; root -> p; root -> o; root -> a;']
    l += [f'a{i} [label="{t}"]; a -> a{i};' for i, t in enumerate(adm)]
    l += [f'p{i} [label="{t}"]; p -> p{i};' for i, t in enumerate(pen)]
    l += [f'o{i} [label="{t}"]; o -> o{i};' for i, t in enumerate(pem)]
    l += ["}"]
    dot("sitemap", "\n".join(l))


usecase(); act_booking(); act_bayar(); act_denda(); act_verifikasi(); states(); sequence(); arsitektur(); sitemap()
print("diagram pendukung ok")
