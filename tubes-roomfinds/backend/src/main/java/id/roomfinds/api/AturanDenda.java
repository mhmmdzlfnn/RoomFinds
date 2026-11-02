package id.roomfinds.api;

public sealed interface AturanDenda permits DendaHarian, DendaFlat, TanpaDenda {
    long hitung(int hariTerlambat);
    int masaTenggang();
    String deskripsi();
}
