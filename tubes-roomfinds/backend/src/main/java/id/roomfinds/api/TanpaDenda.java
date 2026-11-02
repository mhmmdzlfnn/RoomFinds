package id.roomfinds.api;

public record TanpaDenda(String deskripsi) implements AturanDenda {
    public TanpaDenda { if (deskripsi == null || deskripsi.isBlank()) throw new IllegalArgumentException("Deskripsi aturan denda wajib diisi."); }
    @Override public long hitung(int hariTerlambat) { return 0; }
    @Override public int masaTenggang() { return 0; }
}
