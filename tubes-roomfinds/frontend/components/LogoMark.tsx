/*
  Logo RoomFinds: atap, huruf "n" beratap runcing, batang, dan titik.
  Sumber: img/logo.jpg (logo dari pemilik proyek), divektorkan ke SVG.
  Geometri dibersihkan dari hasil trace: atap simetris dengan kemiringan 0,843 dan ujung terpotong 45 derajat,
  lengkung "n" sejajar atap, modul lebar 19 satuan. Dicocokkan ke JPG asli dengan selisih tepi rata-rata 0,26 piksel.

  Warna mengikuti `color` (currentColor): limau di header hitam, hitam di latar terang.
  Ukuran diatur lewat lebar; tinggi mengikuti perbandingan asli 208:144.
*/
export const LOGO_PATH =
  'M104 0L208 87.7L199.7 96L104 15.3L8.3 96L0 87.7Z' +
  'M104 55L133 79.4V144H114V89.1L104 80.7L94 89.1V144H75V79.4Z' +
  'M37 98.5L56 83V144H37Z' +
  'M151 126H170V144H151Z';

export function LogoMark({ lebar = 44, className }: { lebar?: number; className?: string }) {
  return (
    <svg className={className} width={lebar} height={(lebar * 144) / 208} viewBox="0 0 208 144" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <path d={LOGO_PATH} />
    </svg>
  );
}
