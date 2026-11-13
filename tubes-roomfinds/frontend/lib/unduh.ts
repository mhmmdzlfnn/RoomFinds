/*
  Pembuat berkas unduhan (XLSX, PDF, CSV) yang dijalankan di peramban.
  Berkas dibuat dari data yang sama dengan yang tampil di layar, lalu dikirim lewat
  unduhan standar peramban, jadi masuk ke folder Unduhan (atau muncul dialog
  "Simpan sebagai" bila pengguna mengaktifkannya di pengaturan peramban).

  Pustaka berat (jsPDF, write-excel-file) dimuat dinamis saat tombol ditekan,
  supaya tidak menambah ukuran halaman yang tidak memakainya.
*/

export type JenisKolom = 'teks' | 'angka' | 'rupiah';
export type Kolom = { judul: string; jenis?: JenisKolom; lebar?: number };
export type Sel = string | number | null;
export type Bagian = { judul: string; kolom: Kolom[]; baris: Sel[][]; keterangan?: string };
export type InfoDokumen = { judul: string; subjudul: string; catatan?: string[] };

const rupiahFmt = new Intl.NumberFormat('id-ID');
export const teksSel = (sel: Sel, jenis: JenisKolom = 'teks') => {
  if (sel === null || sel === '') return '';
  if (typeof sel === 'number') return jenis === 'rupiah' ? `Rp${rupiahFmt.format(sel)}` : rupiahFmt.format(sel);
  return sel;
};

/** Nama berkas aman untuk semua sistem operasi. */
export const namaBerkas = (dasar: string, ekstensi: string) =>
  `${dasar.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')}.${ekstensi}`;

export function unduhBlob(blob: Blob, nama: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nama;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function unduhCsv(bagian: Bagian, nama: string) {
  const esc = (nilai: string) => `"${nilai.replace(/"/g, '""')}"`;
  const baris: string[][] = [
    ...(bagian.kolom.length ? [bagian.kolom.map((k) => k.judul)] : []),
    ...bagian.baris.map((b) => b.map((s) => (s === null ? '' : String(s)))),
  ];
  const isi = baris.map((b) => b.map(esc).join(',')).join('\n');
  // BOM supaya Excel membaca UTF-8 dengan benar.
  unduhBlob(new Blob(['﻿' + isi], { type: 'text/csv;charset=utf-8' }), nama);
}

const namaSheet = (judul: string, dipakai: Set<string>) => {
  let dasar = judul.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 28) || 'Data';
  let nama = dasar;
  let n = 2;
  while (dipakai.has(nama.toLowerCase())) nama = `${dasar.slice(0, 26)} ${n++}`;
  dipakai.add(nama.toLowerCase());
  return nama;
};

export async function buatXlsx(bagian: Bagian[], info: InfoDokumen): Promise<Blob> {
  const { default: tulisExcel } = await import('write-excel-file/universal');
  const dipakai = new Set<string>();
  const lembar = bagian.map((b, indeks) => {
    const kepala = b.kolom.map((k) => ({ value: k.judul, fontWeight: 'bold' as const, backgroundColor: '#111111', textColor: '#FFFFFF' }));
    const isi = b.baris.map((baris) =>
      baris.map((sel, i) => {
        const jenis = b.kolom[i]?.jenis ?? 'teks';
        if (sel === null || sel === '') return null;
        if (typeof sel === 'number') return { value: sel, type: Number, format: jenis === 'rupiah' ? '"Rp"#,##0' : '#,##0.##' };
        return { value: sel, type: String };
      }),
    );
    const catatan = indeks === 0 ? [[{ value: info.judul, fontWeight: 'bold' as const }], [{ value: info.subjudul }], ...(info.catatan ?? []).map((c) => [{ value: c }]), []] : [];
    return {
      data: [...catatan, kepala, ...isi],
      sheet: namaSheet(b.judul, dipakai),
      columns: b.kolom.map((k) => ({ width: k.lebar ?? Math.max(14, k.judul.length + 4) })),
      stickyRowsCount: catatan.length + 1,
    };
  });
  // Tipe pustaka sangat ketat pada bentuk sel; bentuk di atas sesuai dokumentasinya.
  return (tulisExcel as unknown as (l: unknown) => { toBlob: () => Promise<Blob> })(lembar).toBlob();
}

export async function buatPdf(bagian: Bagian[], info: InfoDokumen): Promise<Blob> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const mendatar = bagian.some((b) => b.kolom.length > 6);
  const doc = new jsPDF({ orientation: mendatar ? 'landscape' : 'portrait', unit: 'pt', format: 'a4' });
  const lebar = doc.internal.pageSize.getWidth();
  const margin = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(info.judul, margin, 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70);
  doc.text(info.subjudul, margin, 70);
  let y = 70;
  (info.catatan ?? []).forEach((c) => {
    y += 14;
    doc.text(c, margin, y);
  });
  doc.setTextColor(0);
  y += 22;

  bagian.forEach((b) => {
    if (y > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      y = 52;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(b.judul, margin, y);
    y += 8;
    if (!b.baris.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(90);
      doc.text(b.keterangan ?? 'Tidak ada data untuk periode ini.', margin, y + 14);
      doc.setTextColor(0);
      y += 40;
      return;
    }
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [b.kolom.map((k) => k.judul)],
      body: b.baris.map((baris) => baris.map((sel, i) => teksSel(sel, b.kolom[i]?.jenis))),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineColor: [210, 210, 210], lineWidth: 0.4 },
      headStyles: { fillColor: [17, 17, 17], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: Object.fromEntries(b.kolom.map((k, i) => [i, { halign: k.jenis === 'rupiah' || k.jenis === 'angka' ? 'right' : 'left' }])) as never,
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 26;
  });

  const halaman = doc.getNumberOfPages();
  for (let i = 1; i <= halaman; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(`Halaman ${i} dari ${halaman}`, lebar - margin, doc.internal.pageSize.getHeight() - 24, { align: 'right' });
    doc.text('RoomFinds', margin, doc.internal.pageSize.getHeight() - 24);
  }
  return doc.output('blob');
}

export type FormatBerkas = 'pdf' | 'xlsx' | 'csv';

/** Membuat dan mengunduh dokumen. Mengembalikan nama berkas yang dikirim ke peramban. */
export async function unduhDokumen(format: FormatBerkas, bagian: Bagian[], info: InfoDokumen, dasarNama: string): Promise<string> {
  const nama = namaBerkas(dasarNama, format);
  if (format === 'xlsx') unduhBlob(await buatXlsx(bagian, info), nama);
  else if (format === 'pdf') unduhBlob(await buatPdf(bagian, info), nama);
  else {
    // CSV hanya satu tabel; beberapa bagian digabung dengan baris judul agar tetap terbaca di Excel.
    const gabung: Bagian = bagian.length === 1 ? bagian[0] : {
      judul: info.judul,
      kolom: [],
      baris: bagian.flatMap((b) => [[b.judul], b.kolom.map((k) => k.judul), ...b.baris, []]),
    };
    unduhCsv(gabung, nama);
  }
  return nama;
}
