package id.roomfinds.api;

import jakarta.servlet.http.HttpSession;
import java.sql.Timestamp;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Fitur yang dibutuhkan frontend terbaru: manajemen akun oleh SuperAdmin (tambah akun, blokir dengan alasan),
 * notifikasi (dihitung dari data yang sudah ada, status baca disimpan per pengguna), dan pencatatan pengeluaran.
 */
@RestController
@RequestMapping("/api")
public class FiturTambahanController {
    private static final Locale ID = Locale.forLanguageTag("id-ID");
    private static final List<String> KATEGORI_PENGELUARAN = List.of("Perbaikan & Perawatan", "Listrik & Air", "Kebersihan", "Gaji Pegawai", "Lain-lain");
    private static final String PENGGUNA_SELECT = "SELECT u.id,u.nama,u.email,u.no_hp AS \"noHp\",u.peran,u.aktif,u.dibuat_pada AS \"dibuatPada\","
        + "u.alasan_nonaktif AS \"alasanNonaktif\",u.diblokir_pada AS \"diblokirPada\","
        + "'RF-' || CASE u.peran WHEN 'USER' THEN 'USR' WHEN 'PEMILIK' THEN 'OWN' ELSE 'ADM' END || '-' || lpad(u.id::text,4,'0') AS \"kodeId\","
        + "(SELECT string_agg(k.nama, ', ' ORDER BY k.id) FROM kos k WHERE k.pemilik_id=u.id) AS \"kosNama\" FROM pengguna u";

    private final JdbcTemplate db;
    private final PasswordEncoder passwords;

    public FiturTambahanController(JdbcTemplate db, PasswordEncoder passwords) { this.db = db; this.passwords = passwords; }

    private long userId(HttpSession s) {
        Object id = s.getAttribute("userId");
        if (id == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Silakan masuk untuk melanjutkan.");
        return (long) id;
    }
    private String role(HttpSession s) {
        Object role = s.getAttribute("role");
        if (role == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Silakan masuk untuk melanjutkan.");
        return role.toString();
    }
    private void require(HttpSession s, String allowed) {
        if (!allowed.equals(role(s))) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kamu tidak memiliki akses untuk melakukan tindakan ini.");
    }
    private long ownerId(HttpSession s) { require(s, "PEMILIK"); return userId(s); }
    private void requireOwnedKos(long kosId, long ownerId) {
        Long n = db.queryForObject("SELECT COUNT(*) FROM kos WHERE id=? AND pemilik_id=?", Long.class, kosId, ownerId);
        if (n == null || n == 0) throw new IllegalArgumentException("Kos tidak ditemukan atau kamu tidak memiliki akses.");
    }
    private static String text(Map<String, Object> body, String key) {
        Object v = body.get(key);
        return v == null ? "" : v.toString().trim();
    }
    private Map<String, Object> pengguna(long id) {
        return db.queryForMap(PENGGUNA_SELECT + " WHERE u.id=?", id);
    }

    // ---------- Kelola akun (SuperAdmin) ----------

    @GetMapping("/admin/pengguna")
    List<Map<String, Object>> daftarPengguna(HttpSession s, @RequestParam(required = false) String q, @RequestParam(required = false) String peran) {
        require(s, "SUPERADMIN");
        return db.queryForList(PENGGUNA_SELECT + " WHERE (CAST(? AS TEXT) IS NULL OR u.nama ILIKE '%'||?||'%' OR u.email ILIKE '%'||?||'%') AND (CAST(? AS TEXT) IS NULL OR u.peran=?) ORDER BY u.id DESC",
            q, q, q, peran, peran);
    }

    @PostMapping("/admin/pengguna") @Transactional
    Map<String, Object> tambahAkun(HttpSession s, @RequestBody Map<String, Object> body) {
        require(s, "SUPERADMIN");
        String nama = text(body, "nama"), email = text(body, "email").toLowerCase(Locale.ROOT), peran = text(body, "peran"), sandi = text(body, "password"), hp = text(body, "noHp");
        if (nama.isBlank()) throw new IllegalArgumentException("Nama lengkap wajib diisi.");
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) throw new IllegalArgumentException("Format email tidak valid.");
        if (!List.of("USER", "PEMILIK").contains(peran)) throw new IllegalArgumentException("Akun SuperAdmin tidak dapat ditambahkan di sini, akun SuperAdmin hanya dibuat lewat data awal.");
        if (sandi.length() < 8) throw new IllegalArgumentException("Kata sandi sementara minimal 8 karakter.");
        if (!hp.isBlank() && !hp.matches("08[0-9]{8,11}")) throw new IllegalArgumentException("Nomor HP harus diawali 08 dan terdiri dari 10 sampai 13 digit.");
        Long kosId = null;
        if ("PEMILIK".equals(peran) && body.get("kosId") != null) {
            try { kosId = Long.parseLong(body.get("kosId").toString()); }
            catch (NumberFormatException e) { throw new IllegalArgumentException("Kos yang dipilih tidak valid."); }
        }
        long id;
        try {
            id = db.queryForObject("INSERT INTO pengguna(nama,email,no_hp,password_hash,peran) VALUES(?,?,?,?,?) RETURNING id", Long.class,
                nama, email, hp.isBlank() ? "-" : hp, passwords.encode(sandi), peran);
        } catch (DuplicateKeyException e) {
            throw new IllegalArgumentException("Email sudah terdaftar.");
        }
        if (kosId != null && db.update("UPDATE kos SET pemilik_id=? WHERE id=?", id, kosId) == 0) throw new IllegalArgumentException("Kos yang dipilih tidak ditemukan.");
        return pengguna(id);
    }

    @PatchMapping("/admin/pengguna/{id}/status") @Transactional
    Map<String, Object> ubahStatus(HttpSession s, @PathVariable long id, @RequestBody Map<String, Object> body) {
        require(s, "SUPERADMIN");
        if (!(body.get("aktif") instanceof Boolean aktif)) throw new IllegalArgumentException("Status aktif wajib diisi.");
        String alasan = text(body, "alasan");
        if (!aktif && alasan.isBlank()) throw new IllegalArgumentException("Alasan pemblokiran wajib diisi.");
        int n = db.update("UPDATE pengguna SET aktif=?,alasan_nonaktif=?,diblokir_pada=? WHERE id=? AND peran<>'SUPERADMIN'",
            aktif, aktif ? null : alasan, aktif ? null : new Timestamp(System.currentTimeMillis()), id);
        if (n == 0) throw new IllegalArgumentException("Akun tidak ditemukan atau tidak dapat diubah.");
        return pengguna(id);
    }

    // ---------- Notifikasi ----------

    @GetMapping("/notifikasi")
    List<Map<String, Object>> notifikasi(HttpSession s) {
        long uid = userId(s);
        String peran = role(s);
        List<Map<String, Object>> out = new ArrayList<>();
        switch (peran) {
            case "USER" -> notifikasiUser(uid, out);
            case "PEMILIK" -> notifikasiPemilik(uid, out);
            default -> notifikasiAdmin(out);
        }
        Set<String> dibaca = new HashSet<>(db.queryForList("SELECT kunci FROM notifikasi_baca WHERE pengguna_id=?", String.class, uid));
        for (Map<String, Object> n : out) n.put("dibaca", dibaca.contains(n.get("id")));
        out.sort(Comparator.comparing((Map<String, Object> n) -> n.get("waktu").toString()).reversed());
        return out.size() > 20 ? new ArrayList<>(out.subList(0, 20)) : out;
    }

    @PatchMapping("/notifikasi/baca") @Transactional
    Map<String, Object> tandaiBaca(HttpSession s, @RequestBody Map<String, Object> body) {
        long uid = userId(s);
        if (!(body.get("ids") instanceof List<?> ids)) throw new IllegalArgumentException("Daftar notifikasi wajib diisi.");
        int n = 0;
        for (Object o : ids) {
            String kunci = String.valueOf(o);
            if (kunci.isBlank() || kunci.length() > 80) continue;
            n += db.update("INSERT INTO notifikasi_baca(pengguna_id,kunci) VALUES(?,?) ON CONFLICT DO NOTHING", uid, kunci);
        }
        return Map.of("ditandai", n);
    }

    private void notifikasiUser(long uid, List<Map<String, Object>> out) {
        // Pengingat yang dikirim pemilik lewat tombol "Kirim Ulang Notifikasi". Hanya yang terbaru per tagihan dan yang belum lunas.
        for (var r : db.queryForList("SELECT pg.id,pg.dikirim_pada,t.periode,t.total-t.terbayar AS sisa FROM pengingat_tagihan pg JOIN tagihan t ON t.id=pg.tagihan_id JOIN booking b ON b.id=t.booking_id WHERE b.penyewa_id=? AND t.status<>'LUNAS' AND t.total>t.terbayar AND pg.dikirim_pada>NOW()-INTERVAL '14 days' AND pg.id=(SELECT MAX(p2.id) FROM pengingat_tagihan p2 WHERE p2.tagihan_id=pg.tagihan_id) ORDER BY pg.dikirim_pada DESC LIMIT 3", uid)) {
            String bulan = DateTimeFormatter.ofPattern("MMMM yyyy", ID).format(tanggal(r.get("periode")));
            out.add(item("u-pengingat-" + r.get("id"), "Pengingat pembayaran dari pemilik kos", "Tagihan " + bulan + " sebesar " + rupiah(r.get("sisa")) + " belum lunas. Mohon segera dibayar.", r.get("dikirim_pada"), "/user/tagihan", "kuning"));
        }
        for (var r : db.queryForList("SELECT t.id,t.periode,t.jatuh_tempo,t.total-t.terbayar AS sisa FROM tagihan t JOIN booking b ON b.id=t.booking_id WHERE b.penyewa_id=? AND t.status<>'LUNAS' AND t.total>t.terbayar AND t.jatuh_tempo<=CURRENT_DATE+7 ORDER BY t.jatuh_tempo LIMIT 5", uid)) {
            LocalDate tempo = tanggal(r.get("jatuh_tempo"));
            long hari = ChronoUnit.DAYS.between(LocalDate.now(), tempo);
            String bulan = DateTimeFormatter.ofPattern("MMMM yyyy", ID).format(tanggal(r.get("periode")));
            String sisa = rupiah(r.get("sisa"));
            String tempoTeks = DateTimeFormatter.ofPattern("d MMMM yyyy", ID).format(tempo);
            if (hari < 0) out.add(item("u-tagihan-" + r.get("id") + "-telat", "Tagihan " + bulan + " sudah terlambat", sisa + " · jatuh tempo " + tempoTeks + " (terlambat " + (-hari) + " hari).", null, "/user/tagihan", "merah"));
            else out.add(item("u-tagihan-" + r.get("id"), "Tagihan " + bulan + " segera jatuh tempo", sisa + " · jatuh tempo " + tempoTeks + (hari == 0 ? " (hari ini)." : " (" + hari + " hari lagi)."), null, "/user/tagihan", "kuning"));
        }
        for (var r : db.queryForList("SELECT b.id,b.status,b.alasan_tolak,b.dibuat_pada,km.nomor FROM booking b JOIN kamar km ON km.id=b.kamar_id WHERE b.penyewa_id=? AND b.status IN ('MENUNGGU','DISETUJUI','DITOLAK') ORDER BY b.id DESC LIMIT 3", uid)) {
            String status = r.get("status").toString(), kamar = "Kamar " + r.get("nomor");
            String key = "u-booking-" + r.get("id") + "-" + status;
            switch (status) {
                case "MENUNGGU" -> out.add(item(key, "Booking " + kamar + " menunggu konfirmasi", "Pemilik kos sedang meninjau pengajuan booking Anda.", r.get("dibuat_pada"), "/user/booking", "biru"));
                case "DISETUJUI" -> out.add(item(key, "Booking " + kamar + " disetujui", "Selamat, pemilik kos menyetujui booking Anda.", r.get("dibuat_pada"), "/user/booking", "hijau"));
                default -> out.add(item(key, "Booking " + kamar + " ditolak", potong(r.get("alasan_tolak"), 110), r.get("dibuat_pada"), "/user/booking", "merah"));
            }
        }
        for (var r : db.queryForList("SELECT p.id,p.status,p.jumlah,p.tanggal,p.catatan_verifikasi FROM pembayaran p JOIN tagihan t ON t.id=p.tagihan_id JOIN booking b ON b.id=t.booking_id WHERE b.penyewa_id=? AND p.status IN ('DITERIMA','DITOLAK') ORDER BY p.id DESC LIMIT 3", uid)) {
            boolean ok = "DITERIMA".equals(r.get("status"));
            out.add(item("u-bayar-" + r.get("id") + "-" + r.get("status"), "Pembayaran " + rupiah(r.get("jumlah")) + (ok ? " diterima" : " ditolak"),
                ok ? "Pembayaran Anda sudah diverifikasi oleh pemilik kos." : potong(r.get("catatan_verifikasi"), 110), r.get("tanggal"), "/user/tagihan", ok ? "hijau" : "merah"));
        }
        for (var r : db.queryForList("SELECT q.id,q.status,q.deskripsi,q.tanggapan_pemilik,q.diperbarui_pada FROM keluhan q JOIN booking b ON b.id=q.booking_id WHERE b.penyewa_id=? AND q.status IN ('DIPROSES','SELESAI') ORDER BY q.diperbarui_pada DESC LIMIT 3", uid)) {
            boolean selesai = "SELESAI".equals(r.get("status"));
            String isi = r.get("tanggapan_pemilik") == null ? r.get("deskripsi") == null ? "" : r.get("deskripsi").toString() : r.get("tanggapan_pemilik").toString();
            out.add(item("u-keluhan-" + r.get("id") + "-" + r.get("status"), selesai ? "Keluhan Anda sudah selesai ditangani" : "Keluhan Anda sedang diproses", potong(isi, 110), r.get("diperbarui_pada"), "/user/keluhan", selesai ? "hijau" : "biru"));
        }
    }

    private void notifikasiPemilik(long uid, List<Map<String, Object>> out) {
        var booking = db.queryForMap("SELECT COUNT(*) AS c,COALESCE(MAX(b.id),0) AS m,MAX(b.dibuat_pada) AS w FROM booking b JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE k.pemilik_id=? AND b.status='MENUNGGU'", uid);
        if (angka(booking.get("c")) > 0) out.add(item("p-booking-" + booking.get("m"), angka(booking.get("c")) + " booking menunggu persetujuan", "Periksa pengajuan pada menu Booking Masuk.", booking.get("w"), "/pemilik/booking", "kuning"));
        var bayar = db.queryForMap("SELECT COUNT(*) AS c,COALESCE(MAX(p.id),0) AS m,MAX(p.tanggal) AS w FROM pembayaran p JOIN tagihan t ON t.id=p.tagihan_id JOIN booking b ON b.id=t.booking_id JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE k.pemilik_id=? AND p.status='MENUNGGU_VERIFIKASI'", uid);
        if (angka(bayar.get("c")) > 0) out.add(item("p-bayar-" + bayar.get("m"), angka(bayar.get("c")) + " pembayaran menunggu verifikasi", "Periksa bukti transfer pada menu Verifikasi Pembayaran.", bayar.get("w"), "/pemilik/pembayaran", "kuning"));
        for (var r : db.queryForList("SELECT pp.id,pp.dibuat_pada,pp.tanggal_diminta,t.jatuh_tempo,u.nama FROM pengajuan_penundaan pp JOIN tagihan t ON t.id=pp.tagihan_id JOIN booking b ON b.id=t.booking_id JOIN pengguna u ON u.id=b.penyewa_id JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE k.pemilik_id=? AND pp.status='MENUNGGU' ORDER BY pp.id DESC LIMIT 3", uid)) {
            DateTimeFormatter f = DateTimeFormatter.ofPattern("d MMMM", ID);
            out.add(item("p-tunda-" + r.get("id"), "Pengajuan penundaan dari " + r.get("nama"), "Jatuh tempo " + f.format(tanggal(r.get("jatuh_tempo"))) + " diminta mundur ke " + f.format(tanggal(r.get("tanggal_diminta"))) + ".", r.get("dibuat_pada"), "/pemilik/pembayaran", "biru"));
        }
        for (var r : db.queryForList("SELECT q.id,q.deskripsi,q.dibuat_pada,km.nomor FROM keluhan q JOIN booking b ON b.id=q.booking_id JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE k.pemilik_id=? AND q.status='DILAPORKAN' ORDER BY q.id DESC LIMIT 3", uid))
            out.add(item("p-keluhan-" + r.get("id"), "Keluhan baru dilaporkan", "Kamar " + r.get("nomor") + ": " + potong(r.get("deskripsi"), 90), r.get("dibuat_pada"), "/pemilik/keluhan", "merah"));
        Long meteran = db.queryForObject("SELECT COUNT(*) FROM tagihan t JOIN booking b ON b.id=t.booking_id JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE k.pemilik_id=? AND t.meteran_akhir IS NULL AND t.status<>'LUNAS' AND to_char(t.periode,'YYYY-MM')=to_char(CURRENT_DATE,'YYYY-MM')", Long.class, uid);
        if (meteran != null && meteran > 0) out.add(item("p-meteran-" + LocalDate.now().toString().substring(0, 7) + "-" + meteran, meteran + " meteran bulan ini belum diisi", "Isi meteran pada menu Tagihan sebelum tagihan diterbitkan.", null, "/pemilik/tagihan", "kuning"));
    }

    private void notifikasiAdmin(List<Map<String, Object>> out) {
        var kos = db.queryForMap("SELECT COUNT(*) AS c,COALESCE(MAX(id),0) AS m,MAX(dibuat_pada) AS w FROM kos WHERE status_verifikasi='MENUNGGU'");
        if (angka(kos.get("c")) > 0) {
            List<String> nama = db.queryForList("SELECT nama FROM kos WHERE status_verifikasi='MENUNGGU' ORDER BY id DESC LIMIT 3", String.class);
            out.add(item("a-kos-" + kos.get("m"), angka(kos.get("c")) + " kos menunggu verifikasi", String.join(", ", nama) + " menunggu peninjauan.", kos.get("w"), "/admin/verifikasi", "kuning"));
        }
        for (var r : db.queryForList("SELECT id,nama,alasan_nonaktif,diblokir_pada FROM pengguna WHERE aktif=false AND diblokir_pada IS NOT NULL AND diblokir_pada > NOW() - INTERVAL '14 days' ORDER BY diblokir_pada DESC LIMIT 3"))
            out.add(item("a-akun-" + r.get("id") + "-" + waktuIso(r.get("diblokir_pada")).hashCode(), "Akun " + r.get("nama") + " diblokir", potong(r.get("alasan_nonaktif"), 110), r.get("diblokir_pada"), "/admin/akun", "merah"));
    }

    private Map<String, Object> item(String id, String judul, String isi, Object waktu, String href, String nada) {
        Map<String, Object> n = new LinkedHashMap<>();
        n.put("id", id); n.put("judul", judul); n.put("isi", isi); n.put("waktu", waktuIso(waktu)); n.put("href", href); n.put("nada", nada);
        return n;
    }
    private static String waktuIso(Object o) {
        if (o instanceof Timestamp t) return t.toInstant().toString();
        if (o instanceof OffsetDateTime t) return t.toInstant().toString();
        return Instant.now().toString();
    }
    private static LocalDate tanggal(Object o) {
        if (o instanceof java.sql.Date d) return d.toLocalDate();
        if (o instanceof LocalDate d) return d;
        return LocalDate.parse(String.valueOf(o));
    }
    private static long angka(Object o) { return o instanceof Number n ? n.longValue() : 0; }
    private static String rupiah(Object o) { return "Rp" + NumberFormat.getNumberInstance(ID).format(angka(o)); }
    private static String potong(Object o, int max) {
        String t = o == null ? "" : o.toString().trim();
        return t.length() <= max ? t : t.substring(0, max - 1) + "…";
    }

    // ---------- Pengingat tagihan (Pemilik) ----------

    private static final int JEDA_PENGINGAT_JAM = 12;

    /**
     * Pemilik mengingatkan penghuni yang tagihannya belum lunas dan sudah atau hampir jatuh tempo (7 hari ke depan).
     * Pengingat muncul sebagai notifikasi di akun penghuni. Satu tagihan hanya bisa diingatkan sekali per 12 jam
     * supaya penghuni tidak dibanjiri pesan.
     */
    @PostMapping("/kos/{kosId}/pengingat") @Transactional
    Map<String, Object> kirimPengingat(HttpSession s, @PathVariable long kosId) {
        long uid = ownerId(s);
        requireOwnedKos(kosId, uid);
        List<Long> sasaran = db.queryForList("SELECT t.id FROM tagihan t JOIN booking b ON b.id=t.booking_id JOIN kamar km ON km.id=b.kamar_id WHERE km.kos_id=? AND b.status='DISETUJUI' AND t.status<>'LUNAS' AND t.total>t.terbayar AND t.jatuh_tempo<=CURRENT_DATE+7 ORDER BY t.id", Long.class, kosId);
        if (sasaran.isEmpty()) throw new IllegalArgumentException("Tidak ada tagihan yang perlu diingatkan saat ini.");
        int terkirim = 0, dilewati = 0;
        for (Long tagihanId : sasaran) {
            Long baru = db.queryForObject("SELECT COUNT(*) FROM pengingat_tagihan WHERE tagihan_id=? AND dikirim_pada>NOW()-(?*INTERVAL '1 hour')", Long.class, tagihanId, JEDA_PENGINGAT_JAM);
            if (baru != null && baru > 0) { dilewati++; continue; }
            db.update("INSERT INTO pengingat_tagihan(tagihan_id,dikirim_oleh) VALUES(?,?)", tagihanId, uid);
            terkirim++;
        }
        if (terkirim == 0) throw new IllegalArgumentException("Pengingat untuk semua tagihan sudah dikirim dalam " + JEDA_PENGINGAT_JAM + " jam terakhir.");
        return Map.of("terkirim", terkirim, "dilewati", dilewati);
    }

    // ---------- Nonaktifkan akun sendiri (Penyewa) ----------

    /**
     * Penyewa menonaktifkan akunnya sendiri. Data tidak dihapus dan SuperAdmin tetap dapat mengaktifkannya kembali.
     * Ditolak selama masih ada sewa aktif atau tagihan belum lunas, supaya kewajiban pembayaran tidak hilang.
     * Booking yang masih menunggu dibatalkan dan kamarnya dikembalikan menjadi tersedia.
     */
    @PatchMapping("/profil/nonaktif") @Transactional
    Map<String, Object> nonaktifkanAkunSendiri(HttpSession s) {
        require(s, "USER");
        long uid = userId(s);
        Long sewaAktif = db.queryForObject("SELECT COUNT(*) FROM booking WHERE penyewa_id=? AND status='DISETUJUI'", Long.class, uid);
        if (sewaAktif != null && sewaAktif > 0) throw new IllegalArgumentException("Akun belum dapat dinonaktifkan karena masih ada sewa aktif. Selesaikan check-out bersama pemilik kos lebih dulu.");
        Long belumLunas = db.queryForObject("SELECT COALESCE(SUM(t.total-t.terbayar),0) FROM tagihan t JOIN booking b ON b.id=t.booking_id WHERE b.penyewa_id=? AND t.status<>'LUNAS'", Long.class, uid);
        if (belumLunas != null && belumLunas > 0) throw new IllegalArgumentException("Akun belum dapat dinonaktifkan karena masih ada tagihan yang belum lunas.");
        db.update("UPDATE kamar SET status='KOSONG' WHERE id IN (SELECT kamar_id FROM booking WHERE penyewa_id=? AND status='MENUNGGU')", uid);
        db.update("UPDATE booking SET status='DIBATALKAN' WHERE penyewa_id=? AND status='MENUNGGU'", uid);
        db.update("UPDATE pengguna SET aktif=false,alasan_nonaktif='Dinonaktifkan oleh pemilik akun' WHERE id=?", uid);
        s.invalidate();
        return Map.of("nonaktif", true);
    }

    // ---------- Pengeluaran (Pemilik) ----------

    @GetMapping("/kos/{kosId}/pengeluaran")
    List<Map<String, Object>> daftarPengeluaran(HttpSession s, @PathVariable long kosId, @RequestParam(required = false) String periode) {
        requireOwnedKos(kosId, ownerId(s));
        return db.queryForList("SELECT id,tanggal,kategori,keterangan,jumlah,dibuat_pada AS \"dibuatPada\" FROM pengeluaran WHERE kos_id=? AND (CAST(? AS TEXT) IS NULL OR to_char(tanggal,'YYYY-MM')=?) ORDER BY tanggal DESC,id DESC",
            kosId, periode, periode);
    }

    @PostMapping("/kos/{kosId}/pengeluaran") @Transactional
    Map<String, Object> catatPengeluaran(HttpSession s, @PathVariable long kosId, @RequestBody Map<String, Object> body) {
        requireOwnedKos(kosId, ownerId(s));
        long jumlah;
        try { jumlah = Long.parseLong(text(body, "jumlah").replaceAll("\\D", "")); }
        catch (NumberFormatException e) { throw new IllegalArgumentException("Jumlah pengeluaran harus berupa angka lebih dari nol."); }
        if (jumlah <= 0) throw new IllegalArgumentException("Jumlah pengeluaran harus lebih dari nol.");
        LocalDate tanggal;
        try { tanggal = LocalDate.parse(text(body, "tanggal")); }
        catch (DateTimeParseException e) { throw new IllegalArgumentException("Tanggal pengeluaran tidak valid."); }
        String kategori = text(body, "kategori"), keterangan = text(body, "keterangan");
        if (!KATEGORI_PENGELUARAN.contains(kategori)) throw new IllegalArgumentException("Kategori pengeluaran tidak valid.");
        if (keterangan.length() > 180) throw new IllegalArgumentException("Keterangan maksimal 180 karakter.");
        return db.queryForMap("INSERT INTO pengeluaran(kos_id,tanggal,kategori,keterangan,jumlah) VALUES(?,?,?,?,?) RETURNING id,kos_id AS \"kosId\",tanggal,kategori,keterangan,jumlah,dibuat_pada AS \"dibuatPada\"",
            kosId, tanggal, kategori, keterangan, jumlah);
    }
}
