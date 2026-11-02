// Generator ilustrasi kamar RoomFinds — mengikuti Prompts_Gambar_Kamar_RoomFinds.docx
// Gaya konsisten: interior terang, siang alami, tanpa orang, tanpa teks.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'kamar');
mkdirSync(OUT, { recursive: true });

const P = {
  dinding: '#F7F4EC', dindingBayang: '#EFEAE0', lis: '#E3DCCE',
  kayu: '#D9B98C', kayuGaris: '#CBA97A', kayuTua: '#C89A66',
  keramik: '#DCDCD6', keramikGaris: '#CBCBC4',
  putih: '#FFFFFF', linen: '#FDFCF8', kasurBayang: '#E9E4D8',
  teal: '#0F766E', tealMuda: '#14B8A6', tealPucat: '#CCFBF1',
  sage: '#8FAE8B', sageMuda: '#B7CCB4',
  langitAtas: '#BFE0F5', langitBawah: '#EAF6FD',
  daun: '#5F8F6B', daunMuda: '#7FAE8B', pot: '#C96F4A',
  abu: '#8B9499', gelap: '#5B6470', emas: '#E4B95B',
};

const svg = (w, h, isi) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="langit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.langitAtas}"/><stop offset="1" stop-color="${P.langitBawah}"/></linearGradient>
<linearGradient id="dinding" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBF9F3"/><stop offset="1" stop-color="${P.dinding}"/></linearGradient>
<linearGradient id="sore" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFDFAE"/><stop offset=".6" stop-color="#FFE9C8"/><stop offset="1" stop-color="#FFF4E2"/></linearGradient>
<linearGradient id="kaca" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>
</defs>
${isi}
</svg>`;

const dinding = (h = 300) => `<rect width="800" height="${h}" fill="url(#dinding)"/><rect y="${h - 8}" width="800" height="8" fill="${P.lis}"/>`;
const lantaiKayu = (y = 300, H = 260) => `<rect y="${y}" width="800" height="${H}" fill="${P.kayu}"/>${[1, 2, 3, 4, 5].map(i => `<line x1="0" y1="${y + i * H / 6}" x2="800" y2="${y + i * H / 6}" stroke="${P.kayuGaris}" stroke-width="2"/>`).join('')}${[120, 340, 560, 720].map((x, i) => `<line x1="${x}" y1="${y + (i % 2) * 43}" x2="${x}" y2="${y + 43 + (i % 2) * 43}" stroke="${P.kayuGaris}" stroke-width="2"/>`).join('')}`;
const lantaiKeramik = (y = 300, H = 260) => `<rect y="${y}" width="800" height="${H}" fill="${P.keramik}"/>${[1, 2, 3, 4].map(i => `<line x1="0" y1="${y + i * H / 5}" x2="800" y2="${y + i * H / 5}" stroke="${P.keramikGaris}" stroke-width="2"/>`).join('')}${[100, 250, 400, 550, 700].map(x => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + H}" stroke="${P.keramikGaris}" stroke-width="2"/>`).join('')}`;
const bayang = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="10" fill="#00000012"/>`;

const jendela = (x, y, w, h, { tirai = true, sore = false } = {}) => `
<rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="4" fill="${P.putih}" stroke="${P.lis}" stroke-width="2"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${sore ? 'sore' : 'langit'})"/>
${tirai ? `<path d="M ${x} ${y} q ${w * .18} ${h * .4} 0 ${h}" fill="#FFFFFF" opacity=".55"/><path d="M ${x + w} ${y} q -${w * .18} ${h * .4} 0 ${h}" fill="#FFFFFF" opacity=".55"/><rect x="${x + w * .45}" y="${y}" width="${w * .1}" height="${h}" fill="#FFFFFF" opacity=".45"/>` : ''}
<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${P.putih}" stroke-width="6"/>
<line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" stroke="${P.putih}" stroke-width="6"/>`;

const kasur = (x, y, w, h, { accent = P.teal, single = false } = {}) => `
${bayang(x + w / 2, y + h + 8, w * .55)}
<rect x="${x - 14}" y="${y - 26}" width="${w + 28}" height="46" rx="8" fill="${P.kayuTua}"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${P.putih}" stroke="${P.kasurBayang}" stroke-width="2"/>
<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h * .42}" rx="8" fill="${P.linen}"/>
<rect x="${x + 4}" y="${y + h * .55}" width="${w - 8}" height="${h * .38}" rx="8" fill="${accent}"/>
<rect x="${x + 4}" y="${y + h * .55}" width="${w - 8}" height="10" rx="5" fill="#FFFFFF" opacity=".25"/>
${single
    ? `<rect x="${x + w * .3}" y="${y + 10}" width="${w * .4}" height="26" rx="10" fill="${P.putih}" stroke="${P.kasurBayang}" stroke-width="2"/>`
    : `<rect x="${x + w * .12}" y="${y + 8}" width="${w * .34}" height="30" rx="12" fill="${P.putih}" stroke="${P.kasurBayang}" stroke-width="2"/><rect x="${x + w * .54}" y="${y + 8}" width="${w * .34}" height="30" rx="12" fill="${P.putih}" stroke="${P.kasurBayang}" stroke-width="2"/>`}
<rect x="${x + 6}" y="${y + h}" width="12" height="16" fill="${P.kayuTua}"/><rect x="${x + w - 18}" y="${y + h}" width="12" height="16" fill="${P.kayuTua}"/>`;

const meja = (x, y, w, h, { lampu = true, buku = false } = {}) => `
${bayang(x + w / 2, y + h + 6, w * .6)}
<rect x="${x}" y="${y}" width="${w}" height="12" rx="4" fill="${P.kayuTua}"/>
<rect x="${x + 8}" y="${y + 12}" width="10" height="${h - 12}" fill="${P.kayu}"/>
<rect x="${x + w - 18}" y="${y + 12}" width="10" height="${h - 12}" fill="${P.kayu}"/>
${lampu ? `<rect x="${x + w - 46}" y="${y - 34}" width="6" height="34" fill="${P.gelap}"/><path d="M ${x + w - 60} ${y - 34} h 28 l -6 -14 h -16 z" fill="${P.gelap}"/><circle cx="${x + w - 46}" cy="${y - 40}" r="10" fill="${P.emas}" opacity=".9"/>` : ''}
${buku ? `<rect x="${x + 20}" y="${y - 8}" width="34" height="8" rx="2" fill="${P.teal}"/><rect x="${x + 24}" y="${y - 14}" width="34" height="8" rx="2" fill="${P.abu}"/>` : ''}`;

const kursi = (x, y, s = 1) => `
<g transform="translate(${x} ${y}) scale(${s})">
${bayang(0, 74, 34)}
<rect x="-18" y="0" width="36" height="10" rx="4" fill="${P.kayuTua}"/>
<rect x="14" y="-40" width="8" height="44" rx="4" fill="${P.kayuTua}"/>
<rect x="-14" y="10" width="6" height="54" fill="${P.kayu}"/>
<rect x="10" y="10" width="6" height="54" fill="${P.kayu}"/>
</g>`;

const ac = (x, y) => `
<rect x="${x}" y="${y}" width="120" height="40" rx="8" fill="${P.putih}" stroke="${P.lis}" stroke-width="2"/>
<line x1="${x + 14}" y1="${y + 30}" x2="${x + 106}" y2="${y + 30}" stroke="${P.lis}" stroke-width="3"/>
<circle cx="${x + 108}" cy="${y + 12}" r="4" fill="${P.tealMuda}"/>`;

const kipas = (x, y) => `
<circle cx="${x}" cy="${y}" r="34" fill="${P.putih}" stroke="${P.lis}" stroke-width="3"/>
${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${x + Math.cos(a * Math.PI / 180) * 16}" cy="${y + Math.sin(a * Math.PI / 180) * 16}" rx="14" ry="7" fill="#D9DDE0" transform="rotate(${a} ${x + Math.cos(a * Math.PI / 180) * 16} ${y + Math.sin(a * Math.PI / 180) * 16})"/>`).join('')}
<circle cx="${x}" cy="${y}" r="8" fill="${P.abu}"/>`;

const lemari = (x, y, w, h, { sliding = true } = {}) => `
${bayang(x + w / 2, y + h + 6, w * .55)}
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#EEDDC2" stroke="${P.kayuTua}" stroke-width="3"/>
${sliding
    ? `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${P.kayuTua}" stroke-width="3"/><rect x="${x + w / 2 - 4}" y="${y + h / 2 - 22}" width="4" height="44" rx="2" fill="${P.kayuTua}"/><rect x="${x + w / 2 + 2}" y="${y + h / 2 - 22}" width="4" height="44" rx="2" fill="${P.kayuTua}"/>`
    : `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${P.kayuTua}" stroke-width="3"/><circle cx="${x + w / 2 - 12}" cy="${y + h / 2}" r="4" fill="${P.kayuTua}"/><circle cx="${x + w / 2 + 12}" cy="${y + h / 2}" r="4" fill="${P.kayuTua}"/>`}`;

const rakBuku = (x, y, w, h) => `
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="#EEDDC2" stroke="${P.kayuTua}" stroke-width="3"/>
${[1, 2].map(i => `<line x1="${x}" y1="${y + i * h / 3}" x2="${x + w}" y2="${y + i * h / 3}" stroke="${P.kayuTua}" stroke-width="3"/>`).join('')}
${[0, 1, 2].flatMap(baris => [0, 1, 2].map(i => `<rect x="${x + 10 + i * 16}" y="${y + baris * h / 3 + 8}" width="10" height="${h / 3 - 18}" rx="2" fill="${[P.teal, P.sage, P.emas, P.abu][(baris + i) % 4]}"/>`)).join('')}`;

const tanaman = (x, y, s = 1) => `
<g transform="translate(${x} ${y}) scale(${s})">
${bayang(0, 2, 22)}
<path d="M -12 0 h 24 l -4 -26 h -16 z" fill="${P.pot}"/>
${[-30, -8, 14].map((dx, i) => `<path d="M 0 -26 q ${dx} -22 ${dx * 1.4} -40" stroke="${i === 1 ? P.daunMuda : P.daun}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}
</g>`;

const nakas = (x, y, { lampu = true } = {}) => `
${bayang(x + 26, y + 56, 34)}
<rect x="${x}" y="${y}" width="52" height="52" rx="6" fill="#EEDDC2" stroke="${P.kayuTua}" stroke-width="3"/>
<rect x="${x + 10}" y="${y + 14}" width="32" height="24" rx="4" fill="${P.kayu}"/>
${lampu ? `<rect x="${x + 20}" y="${y - 20}" width="5" height="20" fill="${P.gelap}"/><path d="M ${x + 8} ${y - 20} h 30 l -7 -13 h -16 z" fill="${P.gelap}"/><circle cx="${x + 23}" cy="${y - 27}" r="9" fill="${P.emas}" opacity=".9"/>` : ''}`;

// ===== Kamar 204 Eksklusif (aksen teal) =====
const k204utama = svg(800, 450, `
${dinding(290)}${lantaiKayu(290, 160)}
${jendela(560, 60, 170, 150)}
${ac(60, 40)}
${lemari(40, 120, 110, 168)}
${meja(430, 210, 150, 78, { buku: true })}
${kursi(470, 240)}
${nakas(330, 236)}
${kasur(90, 190, 230, 96)}
${tanaman(660, 288, 1.1)}
`);

const k204tidur = svg(800, 600, `
${dinding(360)}${lantaiKayu(360, 240)}
${jendela(560, 70, 160, 170)}
<rect x="120" y="180" width="560" height="330" rx="16" fill="${P.putih}" stroke="${P.kasurBayang}" stroke-width="3"/>
<rect x="120" y="140" width="560" height="70" rx="12" fill="${P.kayuTua}"/>
<rect x="150" y="196" width="220" height="70" rx="18" fill="${P.putih}" stroke="${P.kasurBayang}" stroke-width="3"/>
<rect x="430" y="196" width="220" height="70" rx="18" fill="${P.putih}" stroke="${P.kasurBayang}" stroke-width="3"/>
<path d="M 132 380 q 270 -46 536 0 v 100 q -270 40 -536 0 z" fill="${P.teal}"/>
<path d="M 132 380 q 270 -46 536 0" stroke="#FFFFFF" stroke-width="8" fill="none" opacity=".35"/>
${nakas(40, 420)}${nakas(700, 420)}
<circle cx="730" cy="330" r="120" fill="#FFE9B8" opacity=".25"/>
`);

const kamarMandi = (aksen) => svg(800, 600, `
<rect width="800" height="600" fill="#F2F1EC"/>
${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="600" stroke="#E2E0D8" stroke-width="2"/>`).join('')}
${[0, 1, 2, 3, 4, 5].map(i => `<line x1="0" y1="${i * 100}" x2="800" y2="${i * 100}" stroke="#E2E0D8" stroke-width="2"/>`).join('')}
<rect y="270" width="800" height="14" fill="${aksen}"/>
<rect x="480" y="0" width="320" height="600" fill="#DCEEF5" opacity=".5"/>
<rect x="480" y="0" width="14" height="600" fill="#9FC9DC"/>
<rect x="600" y="60" width="10" height="120" rx="5" fill="${P.abu}"/>
<path d="M 575 60 h 60 l -8 -18 h -44 z" fill="${P.gelap}"/>
<circle cx="200" cy="150" r="70" fill="none" stroke="${P.gelap}" stroke-width="8"/>
<rect x="150" y="300" width="120" height="16" rx="6" fill="${P.putih}" stroke="${P.lis}" stroke-width="2"/>
<rect x="166" y="316" width="12" height="120" fill="${P.putih}"/><rect x="242" y="316" width="12" height="120" fill="${P.putih}"/>
<rect x="196" y="270" width="8" height="30" fill="${P.abu}"/>
<rect x="360" y="330" width="90" height="10" rx="5" fill="${P.kayuTua}"/>
<rect x="372" y="300" width="28" height="34" rx="4" fill="${P.putih}" stroke="${P.lis}" stroke-width="2"/>
<rect x="406" y="300" width="28" height="34" rx="4" fill="${P.putih}" stroke="${P.lis}" stroke-width="2"/>
${tanaman(540, 560, 1.4)}
`);

const k204belajar = svg(800, 600, `
${dinding(380)}${lantaiKayu(380, 220)}
${jendela(250, 70, 300, 230)}
<path d="M 270 250 q 40 -60 90 -20 q 50 -70 110 -10 q 60 -40 100 30 l 0 30 l -300 0 z" fill="${P.daunMuda}" opacity=".85"/>
${meja(230, 340, 340, 90, { buku: true })}
${kursi(370, 380, 1.5)}
${rakBuku(60, 180, 120, 200)}
${tanaman(650, 378, 1.5)}
`);

const k204jendela = svg(800, 600, `
<rect width="800" height="600" fill="url(#langit)"/>
<rect x="-8" y="-8" width="816" height="616" fill="none" stroke="${P.putih}" stroke-width="24"/>
<line x1="400" y1="0" x2="400" y2="600" stroke="${P.putih}" stroke-width="16"/>
<line x1="0" y1="300" x2="800" y2="300" stroke="${P.putih}" stroke-width="16"/>
<rect y="420" width="800" height="180" fill="#B9C4A9"/>
<path d="M 40 420 v -120 h 150 v 120 z" fill="#EFE6D6"/><path d="M 30 300 l 85 -50 l 85 50 z" fill="#B96A4B"/>
<path d="M 250 420 v -100 h 130 v 100 z" fill="#F3EBDD"/><path d="M 240 320 l 70 -45 l 70 45 z" fill="#A85F42"/>
<path d="M 600 420 v -130 h 160 v 130 z" fill="#EFE6D6"/><path d="M 588 290 l 92 -52 l 92 52 z" fill="#B96A4B"/>
${[80, 130, 180, 480, 540].map((x, i) => `<circle cx="${x}" cy="${330 - (i % 3) * 20}" r="${34 + (i % 2) * 10}" fill="${P.daun}"/><rect x="${x - 6}" y="${340 - (i % 3) * 20}" width="12" height="60" fill="#8A6B4F"/>`).join('')}
<g transform="translate(340 452)"><rect x="0" y="14" width="110" height="26" rx="10" fill="#3E6E8E"/><rect x="16" y="-14" width="78" height="34" rx="12" fill="#4A7FA3"/><circle cx="24" cy="52" r="12" fill="#222"/><circle cx="88" cy="52" r="12" fill="#222"/></g>
`);

// ===== Kamar 102 Standar (kipas, keramik abu) =====
const k102utama = svg(800, 600, `
${dinding(340)}${lantaiKeramik(340, 260)}
${jendela(560, 90, 150, 130)}
${kipas(150, 90)}
${lemari(40, 170, 110, 168, { sliding: false })}
${meja(430, 250, 140, 80, { lampu: false })}
${kursi(470, 282)}
${kasur(120, 220, 200, 110, { accent: '#DCE4E8', single: true })}
`);

const k102lemari = svg(800, 600, `
${dinding(340)}${lantaiKeramik(340, 260)}
${jendela(560, 90, 150, 130)}
${lemari(470, 150, 180, 190, { sliding: false })}
${kasur(90, 230, 230, 104, { accent: '#DCE4E8', single: true })}
${tanaman(240, 540, 1.2)}
`);

const k102meja = svg(800, 600, `
${dinding(340)}${lantaiKeramik(340, 260)}
${jendela(300, 80, 220, 180)}
${kipas(180, 100)}
${meja(270, 330, 260, 90, { lampu: false })}
${kursi(380, 372, 1.5)}
<rect x="330" y="316" width="22" height="14" rx="3" fill="#4A7FA3"/>
<rect x="360" y="312" width="40" height="18" rx="3" fill="${P.putih}" stroke="${P.lis}" stroke-width="2"/>
${tanaman(640, 540, 1.2)}
`);

// ===== Kamar 305 Eksklusif (aksen sage) =====
const k305utama = svg(800, 450, `
${dinding(290)}${lantaiKayu(290, 160)}
${jendela(540, 40, 190, 200)}
${ac(50, 36)}
${lemari(36, 110, 120, 178)}
${meja(430, 214, 160, 76, { buku: true })}
${kursi(478, 244)}
${kasur(96, 192, 226, 94, { accent: P.sage })}
${tanaman(690, 286, 1.1)}
`);

const k305kerja = svg(800, 600, `
${dinding(380)}${lantaiKayu(380, 220)}
${jendela(280, 60, 260, 240)}
${meja(240, 350, 320, 90, { buku: true })}
<g transform="translate(360 396) scale(1.5)">
${bayang(0, 76, 36)}
<rect x="-20" y="-2" width="40" height="12" rx="6" fill="${P.gelap}"/>
<rect x="16" y="-46" width="9" height="48" rx="4" fill="${P.gelap}"/>
<rect x="-22" y="-52" width="44" height="16" rx="8" fill="${P.sage}"/>
<rect x="-14" y="10" width="7" height="56" fill="${P.gelap}"/>
<rect x="10" y="10" width="7" height="56" fill="${P.gelap}"/>
</g>
${tanaman(660, 380, 1.6)}
${rakBuku(50, 200, 110, 180)}
`);

// ===== Fasilitas bersama & eksterior =====
const dapur = svg(800, 600, `
${dinding(360)}${lantaiKeramik(360, 240)}
${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="240" stroke="#E2E0D8" stroke-width="2"/>`).join('')}
${[0, 1, 2].map(i => `<line x1="0" y1="${i * 80}" x2="800" y2="${i * 80}" stroke="#E2E0D8" stroke-width="2"/>`).join('')}
<rect x="60" y="240" width="300" height="120" rx="8" fill="${P.putih}" stroke="${P.lis}" stroke-width="3"/>
<circle cx="150" cy="280" r="22" fill="${P.gelap}"/><circle cx="150" cy="280" r="12" fill="#E85D3D" opacity=".7"/>
<circle cx="230" cy="280" r="22" fill="${P.gelap}"/><circle cx="230" cy="280" r="12" fill="#E85D3D" opacity=".7"/>
<rect x="290" y="170" width="60" height="70" rx="8" fill="#C8CDD1"/><rect x="298" y="180" width="44" height="10" rx="4" fill="#9AA3A8"/>
<rect x="420" y="120" width="110" height="240" rx="10" fill="#DDE3E6" stroke="${P.abu}" stroke-width="3"/>
<line x1="420" y1="200" x2="530" y2="200" stroke="${P.abu}" stroke-width="3"/>
<rect x="452" y="150" width="8" height="34" rx="4" fill="${P.abu}"/><rect x="486" y="150" width="8" height="34" rx="4" fill="${P.abu}"/>
${meja(120, 430, 220, 90, { lampu: false })}
${kursi(150, 462)}${kursi(280, 462)}
<rect x="620" y="300" width="120" height="14" rx="6" fill="${P.kayuTua}"/>
${[0, 1, 2].map(i => `<rect x="${632 + i * 34}" y="276" width="26" height="24" rx="4" fill="${P.putih}" stroke="${P.lis}" stroke-width="2"/>`).join('')}
${tanaman(730, 552, 1.3)}
`);

const parkir = svg(800, 600, `
<rect width="800" height="340" fill="url(#langit)"/>
<rect y="340" width="800" height="260" fill="#CFCFC9"/>
<rect x="0" y="330" width="800" height="16" fill="#B9B9B2"/>
<rect x="80" y="240" width="640" height="10" fill="#E8E6DE"/>
<rect x="60" y="380" width="8" height="180" fill="#F3F1E9"/><rect x="740" y="380" width="8" height="180" fill="#F3F1E9"/>
${[0, 1, 2].map(i => { const x = 170 + i * 200; return `<g transform="translate(${x} 430)">
${bayang(0, 120, 70)}
<rect x="-14" y="20" width="120" height="34" rx="14" fill="${[P.teal, '#4A7FA3', '#C96F4A'][i]}"/>
<path d="M 10 24 q 30 -34 70 -6 l 24 10" stroke="#2E3640" stroke-width="8" fill="none"/>
<rect x="34" y="-26" width="8" height="52" rx="4" fill="#2E3640"/>
<circle cx="16" cy="92" r="26" fill="#22262B"/><circle cx="16" cy="92" r="10" fill="#8B9499"/>
<circle cx="106" cy="92" r="26" fill="#22262B"/><circle cx="106" cy="92" r="10" fill="#8B9499"/>
</g>`; }).join('')}
<rect x="708" y="180" width="70" height="40" rx="6" fill="${P.putih}" stroke="${P.lis}" stroke-width="3"/>
<circle cx="726" cy="200" r="9" fill="${P.gelap}"/><path d="M 726 200 l 16 10" stroke="${P.gelap}" stroke-width="4"/>
<rect x="736" y="220" width="8" height="120" fill="${P.abu}"/>
`);

const eksterior = svg(800, 450, `
<rect width="800" height="450" fill="url(#sore)"/>
<circle cx="120" cy="90" r="46" fill="#FFE1A6" opacity=".9"/>
<rect y="340" width="800" height="110" fill="#9DB88F"/>
<rect x="150" y="120" width="500" height="230" fill="${P.putih}" stroke="${P.lis}" stroke-width="3"/>
<rect x="150" y="120" width="500" height="14" fill="${P.teal}"/>
<rect x="150" y="238" width="500" height="10" fill="${P.teal}" opacity=".65"/>
${[0, 1].map(lantai => [0, 1, 2].map(i => { const x = 200 + i * 150, y = 170 + lantai * 118; return `
<rect x="${x}" y="${y}" width="90" height="58" rx="4" fill="url(#langit)" stroke="${P.lis}" stroke-width="3"/>
<rect x="${x - 12}" y="${y + 58}" width="114" height="8" rx="3" fill="${P.teal}"/>
${lantai === 0 ? '' : `<rect x="${x - 14}" y="${y + 66}" width="118" height="6" fill="${P.lis}"/>`}
${[0, 1].map(j => `<circle cx="${x + 18 + j * 54}" cy="${y + 50}" r="10" fill="${P.daun}"/>`).join('')}`; }).join('')).join('')}
<rect x="380" y="238" width="44" height="112" fill="${P.teal}" opacity=".9"/>
<rect x="240" y="350" width="320" height="70" fill="#D8CDB8"/>
${[100, 620].map(x => `<circle cx="${x}" cy="330" r="34" fill="${P.daun}"/><rect x="${x - 8}" y="348" width="16" height="40" fill="#8A6B4F"/>`).join('')}
${[0, 1, 2].map(i => `<circle cx="${320 + i * 80}" cy="376" r="12" fill="${P.daunMuda}"/>`).join('')}
`);

const berkas = {
  '204-utama': k204utama, '204-tempat-tidur': k204tidur, '204-kamar-mandi': kamarMandi(P.teal), '204-sudut-belajar': k204belajar, '204-jendela': k204jendela,
  '102-utama': k102utama, '102-lemari': k102lemari, '102-meja': k102meja,
  '305-utama': k305utama, '305-kamar-mandi': kamarMandi(P.sage), '305-sudut-kerja': k305kerja,
  'fasilitas-dapur': dapur, 'fasilitas-parkir': parkir, 'eksterior-kos': eksterior,
};

for (const [nama, isi] of Object.entries(berkas)) {
  writeFileSync(join(OUT, `${nama}.svg`), isi);
  console.log('✔', `${nama}.svg`);
}
console.log(`Total ${Object.keys(berkas).length} ilustrasi ditulis ke ${OUT}`);
