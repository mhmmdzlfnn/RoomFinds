package id.roomfinds.api;

public record DendaFlat(long nominal, int masaTenggang, String deskripsi) implements AturanDenda {
    public DendaFlat {
        if (nominal < 0 || masaTenggang < 0) throw new IllegalArgumentException("Nilai aturan denda tidak boleh negatif.");
        if (deskripsi == null || deskripsi.isBlank()) throw new IllegalArgumentException("Deskripsi aturan denda wajib diisi.");
    }
    @Override public long hitung(int hariTerlambat) { return hariTerlambat > masaTenggang ? nominal : 0; }
}
