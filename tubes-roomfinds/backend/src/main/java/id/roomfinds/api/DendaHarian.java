package id.roomfinds.api;

public record DendaHarian(long nominalPerHari, int masaTenggang, long batasMaksimal, String deskripsi) implements AturanDenda {
    public DendaHarian {
        if (nominalPerHari < 0 || masaTenggang < 0 || batasMaksimal < 0) throw new IllegalArgumentException("Nilai aturan denda tidak boleh negatif.");
        if (deskripsi == null || deskripsi.isBlank()) throw new IllegalArgumentException("Deskripsi aturan denda wajib diisi.");
    }
    @Override public long hitung(int hariTerlambat) {
        long hariDikenakan = Math.max(0L, (long) hariTerlambat - masaTenggang);
        if (nominalPerHari == 0 || batasMaksimal == 0) return 0;
        if (hariDikenakan > batasMaksimal / nominalPerHari) return batasMaksimal;
        return hariDikenakan * nominalPerHari;
    }
}
