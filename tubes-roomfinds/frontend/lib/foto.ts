// Aturan foto unggahan. Harus sama dengan FotoUnggah di backend (PNG atau JPG, maksimal 2 MB),
// supaya pengguna langsung diberi tahu di peramban dan tidak menunggu penolakan dari server.
export const BATAS_FOTO_BYTE = 2 * 1024 * 1024;

/** Mengembalikan pesan galat, atau null bila berkas boleh diunggah. */
export function validasiFoto(berkas: File): string | null {
  if (!/^image\/(png|jpe?g)$/.test(berkas.type)) return 'Foto harus berformat PNG atau JPG.';
  if (berkas.size > BATAS_FOTO_BYTE) return 'Ukuran foto maksimal 2 MB.';
  return null;
}

/** Foto dikirim ke backend sebagai data URL base64, sama seperti bukti transfer. */
export function fotoSebagaiDataUrl(berkas: File): Promise<string> {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => selesai(String(pembaca.result));
    pembaca.onerror = () => gagal(new Error('Foto tidak dapat dibaca. Coba pilih ulang berkasnya.'));
    pembaca.readAsDataURL(berkas);
  });
}
