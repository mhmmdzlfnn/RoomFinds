package id.roomfinds.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Base64;
import org.junit.jupiter.api.Test;

class FotoUnggahTest {
    private static final byte[] PNG = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0 };
    private static final byte[] JPEG = { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0x10 };

    private static String url(String jenis, byte[] isi) {
        return "data:image/" + jenis + ";base64," + Base64.getEncoder().encodeToString(isi);
    }

    @Test
    void emptyValueMeansNoPhoto() {
        assertNull(FotoUnggah.dariDataUrl(null, "Foto kamar"));
        assertNull(FotoUnggah.dariDataUrl("", "Foto kamar"));
        assertNull(FotoUnggah.dariDataUrl("   ", "Foto kamar"));
    }

    @Test
    void validPngAndJpegAreAccepted() {
        assertEquals(url("png", PNG), FotoUnggah.dariDataUrl(url("png", PNG), "Foto kamar"));
        assertEquals(url("jpeg", JPEG), FotoUnggah.dariDataUrl(url("jpeg", JPEG), "Foto kamar"));
        assertEquals(url("jpg", JPEG), FotoUnggah.dariDataUrl(url("jpg", JPEG), "Foto kamar"));
    }

    @Test
    void otherFormatsAndPlainTextAreRejected() {
        var gif = assertThrows(IllegalArgumentException.class, () -> FotoUnggah.dariDataUrl(url("gif", PNG), "Foto kamar"));
        assertTrue(gif.getMessage().contains("PNG atau JPG"));
        assertThrows(IllegalArgumentException.class, () -> FotoUnggah.dariDataUrl("https://contoh.id/foto.png", "Foto kamar"));
        assertThrows(IllegalArgumentException.class, () -> FotoUnggah.dariDataUrl("<script>alert(1)</script>", "Foto kamar"));
    }

    @Test
    void contentMustMatchTheDeclaredType() {
        // Awalan PNG tetapi isinya JPEG, dan sebaliknya.
        assertThrows(IllegalArgumentException.class, () -> FotoUnggah.dariDataUrl(url("png", JPEG), "Foto kamar"));
        assertThrows(IllegalArgumentException.class, () -> FotoUnggah.dariDataUrl(url("jpeg", PNG), "Foto kamar"));
        assertThrows(IllegalArgumentException.class, () -> FotoUnggah.dariDataUrl(url("png", "bukan gambar sama sekali".getBytes()), "Foto kamar"));
    }

    @Test
    void brokenBase64IsRejected() {
        assertThrows(IllegalArgumentException.class, () -> FotoUnggah.dariDataUrl("data:image/png;base64,@@@bukan-base64@@@", "Foto kamar"));
        assertThrows(IllegalArgumentException.class, () -> FotoUnggah.dariDataUrl("data:image/png;base64,", "Foto kamar"));
    }

    @Test
    void sizeLimitIsTwoMegabytes() {
        byte[] pas = new byte[FotoUnggah.BATAS_BYTE];
        System.arraycopy(PNG, 0, pas, 0, PNG.length);
        FotoUnggah.dariDataUrl(url("png", pas), "Foto kamar");

        byte[] lebih = new byte[FotoUnggah.BATAS_BYTE + 1];
        System.arraycopy(PNG, 0, lebih, 0, PNG.length);
        var galat = assertThrows(IllegalArgumentException.class, () -> FotoUnggah.dariDataUrl(url("png", lebih), "Foto keluhan"));
        assertTrue(galat.getMessage().startsWith("Foto keluhan"));
        assertTrue(galat.getMessage().contains("2 MB"));
    }
}
