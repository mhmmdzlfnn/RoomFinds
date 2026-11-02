"""Class diagram RoomFinds dari model.py (graphviz dot -> svg)."""
import html
import subprocess
from pathlib import Path

from model import CLASSES, SERVICES, RELATIONS, split

OUT = Path(__file__).parent / "img"
OUT.mkdir(exist_ok=True)
FILL = {"A": "#EAF1FB", "B": "#EAF7EE", "C": "#FDF3E6"}
esc = html.escape


def row(text, abstract=False, static=False):
    t = esc(text)
    if abstract:
        t = f"<I>{t}</I>"
    if static:
        t = f"<U>{t}</U>"
    return f'<TR><TD ALIGN="LEFT">{t}</TD></TR>'


def header(name, st, owner):
    stereo = f'<FONT POINT-SIZE="9">&lt;&lt;{st}&gt;&gt;</FONT><BR/>' if st else ""
    title = f"<I>{esc(name)}</I>" if st == "abstract" else f"<B>{esc(name)}</B>"
    return f'<TD BGCOLOR="{FILL[owner]}">{stereo}{title}</TD>'


def box(name, attrs, meths, st, owner):
    a = "".join(row(split(x)[0]) for x in attrs) or '<TR><TD> </TD></TR>'
    m = "".join(row(s, ab, stt) for s, _, ab, stt in map(split, meths))
    return (f'"{name}" [label=<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="3">'
            f'<TR>{header(name, st, owner)}</TR>'
            f'<TR><TD><TABLE BORDER="0" CELLSPACING="0" CELLPADDING="1">{a}</TABLE></TD></TR>'
            f'<TR><TD><TABLE BORDER="0" CELLSPACING="0" CELLPADDING="1">{m}</TABLE></TD></TR></TABLE>>];')


def small(name, ghost=False):
    st, owner = (CLASSES[name]["st"], CLASSES[name]["owner"]) if name in CLASSES else ("service", SERVICES[name]["owner"])
    stereo = f'<FONT POINT-SIZE="9">&lt;&lt;{st}&gt;&gt;</FONT><BR/>' if st else ""
    title = f"<I>{esc(name)}</I>" if st == "abstract" else f"<B>{esc(name)}</B>"
    bg = "#FFFFFF" if ghost else FILL[owner]
    dash = ' STYLE="dashed"' if ghost else ""
    return (f'"{name}" [label=<<TABLE BORDER="1"{dash} CELLBORDER="0" CELLSPACING="0" CELLPADDING="5">'
            f'<TR><TD BGCOLOR="{bg}">{stereo}{title}</TD></TR></TABLE>>];')


def edge(r):
    a, b, kind = r[:3]
    tl, hl, lab = (list(r[3:]) + ["", "", ""])[:3]
    style = {"inh": "arrowhead=empty", "real": "arrowhead=empty, style=dashed",
             "comp": "dir=back, arrowtail=diamond", "aggr": "dir=back, arrowtail=odiamond",
             "assoc": "arrowhead=vee", "dep": "arrowhead=vee, style=dashed"}[kind]
    extra = [f'taillabel="{tl}"'] * bool(tl) + [f'headlabel="{hl}"'] * bool(hl) + [f'label="{lab}"'] * bool(lab)
    return f'"{a}" -> "{b}" [{", ".join([style] + extra)}];'


HEAD = ['node [shape=plain, fontname="Liberation Sans", fontsize=10];',
        'edge [fontname="Liberation Sans", fontsize=9, labelfontsize=9];']


def write(fname, body, rankdir="BT", extra=""):
    dot = "\n".join([f"digraph G {{ rankdir={rankdir}; nodesep=0.35; ranksep=0.55; {extra}"] + HEAD + body + ["}"])
    (OUT / f"{fname}.dot").write_text(dot)
    subprocess.run(["dot", "-Tsvg", "-o", str(OUT / f"{fname}.svg")], input=dot.encode(), check=True)


def render_model(fname, names, detail=True):
    names = list(names)
    body, ghosts = [], set()
    for r in RELATIONS:
        inside = [x in names for x in r[:2]]
        if detail and any(inside):
            ghosts |= {x for x in r[:2] if x not in names}
            body.append(edge(r))
        elif not detail and all(inside):
            body.append(edge(r))
    nodes = [box(n, CLASSES[n]["attrs"], CLASSES[n]["meths"], CLASSES[n]["st"], CLASSES[n]["owner"])
             if detail else small(n) for n in names]
    write(fname, nodes + [small(g, ghost=True) for g in sorted(ghosts)] + body)


def render_services():
    body = []
    for n, s in SERVICES.items():
        deps = "".join(row(f"- {d[0].lower() + d[1:]}: {d}") for d in s["deps"])
        m = "".join(row(split(x)[0]) for x in s["meths"])
        body.append(f'"{n}" [label=<<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="3">'
                    f'<TR>{header(n, "service", s["owner"])}</TR>'
                    f'<TR><TD><TABLE BORDER="0" CELLSPACING="0" CELLPADDING="1">{deps}</TABLE></TD></TR>'
                    f'<TR><TD><TABLE BORDER="0" CELLSPACING="0" CELLPADDING="1">{m}</TABLE></TD></TR></TABLE>>];')
    for n, s in SERVICES.items():
        for d in s["deps"]:
            if d in SERVICES:
                body.append(f'"{n}" -> "{d}" [arrowhead=vee, style=dashed, label="memanggil"];')
    write("service", body, rankdir="LR")


mod = lambda o: [n for n, c in CLASSES.items() if c["owner"] == o]
render_model("overview", CLASSES, detail=False)
render_model("modul_a1", ["Pengguna", "Pemilik", "Penyewa", "Kos", "LaporanBulanan", "Booking"])
render_model("modul_a2", ["DapatDitagih", "Tagihan", "ItemTagihan", "BiayaSewa", "BiayaTetap", "BiayaPemakaian"])
render_model("modul_b", mod("B"))
render_model("modul_c", mod("C"))
render_services()
print("diagram kelas ok")
