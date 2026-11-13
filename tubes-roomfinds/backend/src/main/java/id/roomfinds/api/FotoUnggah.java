package id.roomfinds.api;

import java.util.Base64;

/**
 * Foto unggahan (PNG atau JPG) yang dikirim frontend sebagai data URL base64.
 * Satu aturan validasi dipakai bersama oleh foto kamar dan foto keluhan, sehingga ukuran dan jenis berkas
 * diperiksa di server dan tidak hanya di peramban.
 */
public final class FotoUnggah {
    public static final int BATAS_BYTE = 2 * 1024 * 1024;
    private static final String PNG = "data:image/png;base64,";
    private static final String JPEG = "data:image/jpeg;base64,";
    private static final String JPG = "data:image/jpg;base64,";

    private FotoUnggah() { }

    /**
     * Mengembalikan data URL yang sudah tervalidasi, atau null bila tidak ada foto (kosong dianggap tanpa foto).
     *
     * @param mentah nilai dari body request
     * @param nama   nama foto untuk pesan galat, misalnya "Foto kamar"
     */
    public static String dariDataUrl(Object mentah, String nama) {
        if (mentah == null) return null;
        String teks = mentah.toString().trim();
        if (teks.isEmpty()) return null;

        // Cek panjang lebih dulu supaya string raksasa tidak perlu didekode.
        if (teks.length() > (long) BATAS_BYTE * 4 / 3 + 64) throw new IllegalArgumentException(nama + " terlalu besar. Ukuran maksimal 2 MB.");

        String awalan = awalanValid(teks);
        if (awalan == null) throw new IllegalArgumentException(nama + " harus berupa gambar PNG atau JPG.");

        byte[] isi;
        try {
            isi = Base64.getDecoder().decode(teks.substring(awalan.length()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(nama + " tidak dapat dibaca. Unggah ulang gambarnya.");
        }
        if (isi.length > BATAS_BYTE) throw new IllegalArgumentException(nama + " terlalu besar. Ukuran maksimal 2 MB.");
        if (isi.length == 0) throw new IllegalArgumentException(nama + " kosong.");

        // Isi berkas harus sungguh PNG atau JPEG, bukan sekadar diberi awalan yang benar.
        boolean png = awalan.equals(PNG);
        if (png ? !tandaPng(isi) : !tandaJpeg(isi)) throw new IllegalArgumentException(nama + " harus berupa gambar PNG atau JPG.");
        return teks;
    }

    private static String awalanValid(String teks) {
        for (String awalan : new String[] { PNG, JPEG, JPG }) if (teks.startsWith(awalan)) return awalan;
        return null;
    }

    private static boolean tandaPng(byte[] b) {
        return b.length > 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
    }

    private static boolean tandaJpeg(byte[] b) {
        return b.length > 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
    }
}
