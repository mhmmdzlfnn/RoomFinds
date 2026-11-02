package id.roomfinds.api;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record PaketSewa(String nama, int durasiBulan, BigDecimal persenDiskon) {
    public PaketSewa {
        if (nama == null || nama.isBlank()) throw new IllegalArgumentException("Nama paket wajib diisi.");
        if (durasiBulan <= 0) throw new IllegalArgumentException("Durasi paket harus lebih dari nol bulan.");
        if (persenDiskon == null || persenDiskon.signum() < 0 || persenDiskon.compareTo(BigDecimal.valueOf(100)) > 0)
            throw new IllegalArgumentException("Diskon harus berada di antara 0 dan 100 persen.");
    }
    public long hitungTotal(long hargaBulanan) {
        if (hargaBulanan <= 0) throw new IllegalArgumentException("Harga bulanan harus lebih dari nol.");
        var faktor = BigDecimal.ONE.subtract(persenDiskon.movePointLeft(2));
        return BigDecimal.valueOf(hargaBulanan).multiply(BigDecimal.valueOf(durasiBulan)).multiply(faktor)
                .setScale(0, RoundingMode.HALF_UP).longValueExact();
    }
}
