package id.roomfinds.api;

import org.springframework.stereotype.Service;

@Service
public class DendaService {
    public long hitung(AturanDenda aturan, int hariTerlambat) { return aturan.hitung(hariTerlambat); }
    public int sisaMasaTenggang(AturanDenda aturan, int hariTerlambat) { return Math.max(0, aturan.masaTenggang() - hariTerlambat); }
}
