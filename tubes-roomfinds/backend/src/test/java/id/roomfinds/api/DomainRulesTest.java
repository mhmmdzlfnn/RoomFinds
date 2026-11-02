package id.roomfinds.api;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class DomainRulesTest {
    private final DendaService denda = new DendaService();

    @Test
    void dailyPenaltyAppliesGracePeriodAndCap() {
        var rule = new DendaHarian(10_000, 3, 25_000, "Denda harian setelah tenggang.");

        assertEquals(0, denda.hitung(rule, 3));
        assertEquals(10_000, denda.hitung(rule, 4));
        assertEquals(25_000, denda.hitung(rule, 8));
        assertEquals(0, denda.sisaMasaTenggang(rule, 5));
    }

    @Test
    void flatAndNoPenaltyRulesRespectTheirContracts() {
        var flat = new DendaFlat(50_000, 2, "Denda tetap.");
        var none = new TanpaDenda("Tidak ada denda.");

        assertEquals(0, denda.hitung(flat, 2));
        assertEquals(50_000, denda.hitung(flat, 3));
        assertEquals(0, denda.hitung(none, 30));
    }

    @Test
    void rentPackageUsesHalfUpRounding() {
        var packagePlan = new PaketSewa("Semesteran", 6, new BigDecimal("5.00"));

        assertEquals(5_700_000, packagePlan.hitungTotal(1_000_000));
        assertEquals(501, new PaketSewa("Bulanan", 1, new BigDecimal("50")).hitungTotal(1_001));
    }

    @Test
    void invalidDomainValuesAreRejected() {
        assertThrows(IllegalArgumentException.class, () -> new DendaHarian(-1, 0, 10, "Aturan"));
        assertThrows(IllegalArgumentException.class, () -> new DendaFlat(10, -1, "Aturan"));
        assertThrows(IllegalArgumentException.class, () -> new PaketSewa("Paket", 0, BigDecimal.ZERO));
        assertThrows(IllegalArgumentException.class, () -> new PaketSewa("Paket", 1, new BigDecimal("100.01")));
    }
}
