package id.roomfinds.api;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class RoomFindsController {
    private final JdbcTemplate db;
    private final PasswordEncoder passwords;
    private final DendaService dendaService;
    private static final com.fasterxml.jackson.databind.ObjectMapper JSON = new com.fasterxml.jackson.databind.ObjectMapper();
    public RoomFindsController(JdbcTemplate db, PasswordEncoder passwords, DendaService dendaService) { this.db = db; this.passwords = passwords; this.dendaService = dendaService; }

    private List<String> facilityList(Object value) {
        if (value == null) return List.of();
        try { return JSON.readValue(value.toString(), new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}); }
        catch (com.fasterxml.jackson.core.JsonProcessingException e) { throw new IllegalStateException("Data fasilitas kamar tidak valid.", e); }
    }

    private long userId(HttpSession session) { Object id=session.getAttribute("userId"); if(id==null) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED,"Silakan masuk untuk melanjutkan."); return (long)id; }
    private String role(HttpSession session) { Object role=session.getAttribute("role"); if(role==null) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED,"Silakan masuk untuk melanjutkan."); return role.toString(); }
    private void require(HttpSession session, String... allowed) { String role=role(session); if(java.util.Arrays.stream(allowed).noneMatch(role::equals)) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN,"Kamu tidak memiliki akses untuk melakukan tindakan ini."); }
    private Map<String,Object> responseUser(long id) { return db.queryForMap("SELECT id,nama,email,no_hp AS \"noHp\",peran,aktif,data_tambahan AS \"dataTambahan\" FROM pengguna WHERE id=?", id); }

    @GetMapping("/health") Map<String,String> health() {
        db.queryForObject("SELECT 1", Integer.class);
        return Map.of("status", "ok", "service", "RoomFinds API", "database", "connected");
    }
    @PostMapping("/auth/register") @Transactional Map<String,Object> register(@RequestBody Map<String,Object> body, HttpServletRequest request, HttpSession session) {
        String role=String.valueOf(body.getOrDefault("peran","USER")); if(!List.of("USER","PEMILIK").contains(role)) throw new IllegalArgumentException("Peran pendaftaran tidak valid.");
        String phone=String.valueOf(body.getOrDefault("noHp","")); if(!phone.matches("08[0-9]{8,11}")) throw new IllegalArgumentException("Nomor HP harus diawali 08 dan terdiri dari 10 sampai 13 digit.");
        String pass=String.valueOf(body.getOrDefault("password","")); if(pass.length()<8) throw new IllegalArgumentException("Password minimal 8 karakter.");
        Map<String,Object> extraFields = new LinkedHashMap<>();
        if (role.equals("USER")) {
            extraFields.put("asalKampus", body.getOrDefault("asalKampus", ""));
            extraFields.put("kontakDarurat", body.getOrDefault("kontakDarurat", ""));
        } else {
            extraFields.put("namaBank", body.getOrDefault("namaBank", ""));
            extraFields.put("noRekening", body.getOrDefault("noRekening", ""));
        }
        String extras;
        try { extras = JSON.writeValueAsString(extraFields); }
        catch (com.fasterxml.jackson.core.JsonProcessingException e) { throw new IllegalArgumentException("Data pendaftaran tidak valid."); }
        Long id=db.queryForObject("INSERT INTO pengguna(nama,email,no_hp,password_hash,peran,data_tambahan) VALUES(?,?,?,?,?,?::jsonb) RETURNING id",Long.class,body.get("nama"),body.get("email"),phone,passwords.encode(pass),role,extras);
        request.changeSessionId();
        session.setAttribute("userId",id); session.setAttribute("role",role);
        return responseUser(id);
    }
    @PostMapping("/auth/login") Map<String,Object> login(@RequestBody Map<String,String> body, HttpServletRequest request, HttpSession session) {
        var rows=db.query("SELECT id,nama,email,no_hp AS \"noHp\",password_hash,peran,aktif FROM pengguna WHERE lower(email)=lower(?)",(rs,n)->Map.<String,Object>of("id",rs.getLong("id"),"nama",rs.getString("nama"),"email",rs.getString("email"),"noHp",rs.getString("noHp"),"password",rs.getString("password_hash"),"peran",rs.getString("peran"),"aktif",rs.getBoolean("aktif")),body.get("email"));
        if(rows.isEmpty() || !passwords.matches(body.getOrDefault("password",""),(String)rows.get(0).get("password"))) throw new IllegalArgumentException("Email atau password salah.");
        var user=rows.get(0); if(!Boolean.TRUE.equals(user.get("aktif"))) throw new IllegalArgumentException("Akun ini sedang dinonaktifkan. Hubungi tim RoomFinds.");
        request.changeSessionId();
        session.setAttribute("userId",user.get("id")); session.setAttribute("role",user.get("peran")); return Map.of("id",user.get("id"),"nama",user.get("nama"),"email",user.get("email"),"peran",user.get("peran"));
    }
    @PostMapping("/auth/logout") ResponseEntity<Void> logout(HttpSession session) { session.invalidate(); return ResponseEntity.noContent().build(); }
    @GetMapping("/profil") Map<String,Object> profile(HttpSession session) { return responseUser(userId(session)); }
    @PutMapping("/profil") Map<String,Object> updateProfile(HttpSession session,@RequestBody Map<String,Object> body) { long id=userId(session); db.update("UPDATE pengguna SET nama=?,no_hp=? WHERE id=?",body.get("nama"),body.get("noHp"),id); return responseUser(id); }

    @GetMapping("/kamar") List<Map<String,Object>> searchRooms(@RequestParam(required=false) String lokasi,@RequestParam(required=false) Long hargaMaks,@RequestParam(required=false) String tipe,@RequestParam(required=false) String fasilitas,@RequestParam(defaultValue="termurah") String urut) {
        String sql="SELECT km.id,km.kos_id AS \"kosId\",km.nomor,km.tipe,km.harga_bulanan AS \"hargaBulanan\",km.luas,km.fasilitas,km.status,k.nama AS \"kosNama\",k.alamat,k.kode_pos AS \"kodePos\" FROM kamar km JOIN kos k ON k.id=km.kos_id WHERE km.status='KOSONG' AND k.status_verifikasi='TERVERIFIKASI' AND k.kode_pos BETWEEN '12110' AND '12980' AND (CAST(? AS TEXT) IS NULL OR lower(k.alamat || ' ' || k.nama) LIKE lower('%'||?||'%')) AND (CAST(? AS BIGINT) IS NULL OR km.harga_bulanan<=?) AND (CAST(? AS TEXT) IS NULL OR km.tipe=?) AND (CAST(? AS TEXT) IS NULL OR km.fasilitas::text ILIKE '%'||?||'%') ORDER BY "+(urut.equals("terbaru")?"km.id DESC":"km.harga_bulanan ASC");
        return db.queryForList(sql,lokasi,lokasi,hargaMaks,hargaMaks,tipe,tipe,fasilitas,fasilitas).stream().map(row -> {
            Map<String,Object> result = new LinkedHashMap<>(row);
            result.put("fasilitas", facilityList(row.get("fasilitas")));
            return result;
        }).toList();
    }
    @GetMapping("/kamar/{id}") Map<String,Object> roomDetail(@PathVariable long id) { return db.queryForMap("SELECT km.id,km.kos_id AS \"kosId\",km.nomor,km.tipe,km.harga_bulanan AS \"hargaBulanan\",km.luas,km.fasilitas::text AS fasilitas,km.status,k.nama AS \"kosNama\",k.alamat,k.kode_pos AS \"kodePos\",k.aturan_kos AS \"aturanKos\",k.aturan_denda AS \"aturanDenda\" FROM kamar km JOIN kos k ON k.id=km.kos_id WHERE km.id=? AND km.status='KOSONG' AND k.status_verifikasi='TERVERIFIKASI'",id); }
    @GetMapping("/kos") List<Map<String,Object>> kos(HttpSession session) { require(session,"PEMILIK","SUPERADMIN"); return db.queryForList("SELECT k.id,k.pemilik_id,k.nama,k.alamat,k.kode_pos AS \"kodePos\",k.aturan_kos AS \"aturanKos\",k.tanggal_jatuh_tempo AS \"tanggalJatuhTempo\",k.status_verifikasi AS \"statusVerifikasi\",k.catatan_verifikasi AS \"catatanVerifikasi\",k.aturan_denda AS \"aturanDenda\",k.dibuat_pada AS \"dibuatPada\",COUNT(km.id) AS \"jumlahKamar\",COUNT(*) FILTER (WHERE km.status='KOSONG') AS \"kamarKosong\" FROM kos k LEFT JOIN kamar km ON km.kos_id=k.id WHERE k.pemilik_id=? GROUP BY k.id ORDER BY k.id",userId(session)); }
    @PostMapping("/kos") @Transactional Map<String,Object> createKos(HttpSession session,@RequestBody Map<String,Object> body) { require(session,"PEMILIK"); String zip=String.valueOf(body.get("kodePos")); boolean validZip=false; try { int code=Integer.parseInt(zip); validZip=code>=12110 && code<=12980; } catch(NumberFormatException ignored) { } if(!validZip) throw new IllegalArgumentException("RoomFinds saat ini hanya melayani Jakarta Selatan (kode pos 12110–12980)."); Long id=db.queryForObject("INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo) VALUES(?,?,?,?,?,?) RETURNING id",Long.class,userId(session),body.get("nama"),body.get("alamat"),zip,body.getOrDefault("aturanKos",""),body.getOrDefault("tanggalJatuhTempo",5)); for(Object[] p:List.of(new Object[]{"Bulanan",1,0},new Object[]{"Semesteran",6,5},new Object[]{"Tahunan",12,10})) db.update("INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) VALUES(?,?,?,?)",id,p[0],p[1],p[2]); return db.queryForMap("SELECT * FROM kos WHERE id=?",id); }

    @GetMapping("/tagihan/saya") List<Map<String,Object>> myBills(HttpSession session) {
        return db.queryForList("SELECT t.id,t.booking_id AS \"bookingId\",t.periode,t.jatuh_tempo AS \"jatuhTempo\",t.total,t.terbayar,t.total-t.terbayar AS sisa,t.denda,t.status,km.nomor AS \"kamarNomor\",k.nama AS \"kosNama\",COALESCE(jsonb_agg(jsonb_build_object('jenis',i.jenis,'keterangan',i.keterangan,'subtotal',i.subtotal,'meteranAwal',i.meteran_awal,'meteranAkhir',i.meteran_akhir,'tarifPerUnit',i.tarif_per_unit,'satuan',i.satuan) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL),'[]'::jsonb) AS items FROM tagihan t JOIN booking b ON b.id=t.booking_id JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id LEFT JOIN item_tagihan i ON i.tagihan_id=t.id WHERE b.penyewa_id=? GROUP BY t.id,km.id,k.id ORDER BY t.periode DESC",userId(session));
    }
    @GetMapping("/kos/{kosId}/tagihan") List<Map<String,Object>> ownerBills(HttpSession session,@PathVariable long kosId,@RequestParam(required=false) String periode) { require(session,"PEMILIK"); return db.queryForList("SELECT t.id,t.periode,t.jatuh_tempo AS \"jatuhTempo\",t.total,t.terbayar,t.total-t.terbayar AS sisa,t.denda,t.status,t.meteran_awal AS \"meteranAwal\",t.meteran_akhir AS \"meteranAkhir\",km.nomor AS \"kamarNomor\",p.nama AS \"penyewaNama\" FROM tagihan t JOIN booking b ON b.id=t.booking_id JOIN kamar km ON km.id=b.kamar_id JOIN pengguna p ON p.id=b.penyewa_id JOIN kos k ON k.id=km.kos_id WHERE k.id=? AND (? IS NULL OR to_char(t.periode,'YYYY-MM')=?) ORDER BY km.nomor",kosId,periode,periode); }
    @PostMapping("/tagihan/{id}/meteran") @Transactional Map<String,Object> meter(HttpSession session,@PathVariable long id,@RequestBody Map<String,BigDecimal> body) {
        require(session,"PEMILIK"); BigDecimal awal=body.get("meteranAwal"),akhir=body.get("meteranAkhir");
        if(awal==null||akhir==null||akhir.compareTo(awal)<0) throw new IllegalArgumentException("Meteran akhir tidak boleh lebih kecil dari meteran awal.");
        var info=db.queryForMap("SELECT t.id,t.subtotal_item,t.total,t.terbayar,t.status,k.id kos_id FROM tagihan t JOIN booking b ON b.id=t.booking_id JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE t.id=? AND k.pemilik_id=? FOR UPDATE OF t",id,userId(session));
        if (((Number) info.get("terbayar")).longValue() > 0 || "LUNAS".equals(info.get("status"))) throw new IllegalArgumentException("Meteran tidak dapat diubah setelah pembayaran diterima.");
        BigDecimal rate=body.getOrDefault("tarifPerUnit",BigDecimal.valueOf(1500)); long subtotal=akhir.subtract(awal).multiply(rate).longValue();
        Long previous=db.queryForObject("SELECT COALESCE(SUM(subtotal),0) FROM item_tagihan WHERE tagihan_id=? AND jenis='PEMAKAIAN'",Long.class,id);
        db.update("DELETE FROM item_tagihan WHERE tagihan_id=? AND jenis='PEMAKAIAN'",id);
        db.update("INSERT INTO item_tagihan(tagihan_id,jenis,keterangan,subtotal,meteran_awal,meteran_akhir,tarif_per_unit,satuan) VALUES(?,'PEMAKAIAN','Listrik',?,?,?,?,'kWh')",id,subtotal,awal,akhir,rate.longValue());
        db.update("UPDATE tagihan SET meteran_awal=?,meteran_akhir=?,subtotal_item=subtotal_item-?+?,total=total-?+? WHERE id=?",awal,akhir,previous,subtotal,previous,subtotal,id);
        return db.queryForMap("SELECT * FROM tagihan WHERE id=?",id);
    }
    @PostMapping("/tagihan/{id}/pembayaran") @Transactional Map<String,Object> payment(HttpSession session,@PathVariable long id,@RequestBody Map<String,Object> body) {
        String role=role(session); long amount=Long.parseLong(String.valueOf(body.get("jumlah"))); if(amount<=0) throw new IllegalArgumentException("Jumlah pembayaran harus lebih dari nol.");
        String method=String.valueOf(body.getOrDefault("metode","TRANSFER")); long uid=userId(session);
        Long owing;
        if("PEMILIK".equals(role)) {
            if(!"TUNAI".equals(method)) throw new IllegalArgumentException("Pemilik hanya dapat mencatat pembayaran tunai melalui menu ini.");
            owing=db.queryForObject("SELECT t.total-t.terbayar FROM tagihan t JOIN booking b ON b.id=t.booking_id JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE t.id=? AND k.pemilik_id=? FOR UPDATE OF t",Long.class,id,uid);
        } else {
            if(!"USER".equals(role)||!"TRANSFER".equals(method)) throw new IllegalArgumentException("Pilih transfer bank untuk mengirim bukti pembayaran.");
            owing=db.queryForObject("SELECT t.total-t.terbayar FROM tagihan t JOIN booking b ON b.id=t.booking_id WHERE t.id=? AND b.penyewa_id=? FOR UPDATE OF t",Long.class,id,uid);
        }
        if(owing==null||amount>owing) throw new IllegalArgumentException("Jumlah pembayaran melebihi sisa tagihan.");
        String state="PEMILIK".equals(role)?"DITERIMA":"MENUNGGU_VERIFIKASI";
        var created=db.queryForMap("INSERT INTO pembayaran(tagihan_id,metode,jumlah,bank_asal,nama_pengirim,bukti_url,status) VALUES(?,?,?,?,?,?,?) RETURNING id,tagihan_id AS \"tagihanId\",metode,jumlah,tanggal,status,bank_asal AS \"bankAsal\",nama_pengirim AS \"namaPengirim\"",id,method,amount,body.get("bankAsal"),body.getOrDefault("namaPengirim","Dicatat pemilik"),body.get("buktiUrl"),state);
        if("DITERIMA".equals(state)) db.update("UPDATE tagihan SET terbayar=terbayar+?,status=CASE WHEN terbayar+? >= total THEN 'LUNAS' ELSE 'BELUM_BAYAR' END WHERE id=?",amount,amount,id);
        return created;
    }
    @PatchMapping("/pembayaran/{id}/verifikasi") @Transactional Map<String,Object> verifyPayment(HttpSession session,@PathVariable long id,@RequestBody Map<String,Object> body) {
        require(session,"PEMILIK"); boolean accepted=Boolean.TRUE.equals(body.get("diterima"));
        var pay=db.queryForMap("SELECT p.*,t.total-t.terbayar AS sisa FROM pembayaran p JOIN tagihan t ON t.id=p.tagihan_id JOIN booking b ON b.id=t.booking_id JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE p.id=? AND k.pemilik_id=? FOR UPDATE OF t",id,userId(session));
        if("DITERIMA".equals(pay.get("status"))||"DITOLAK".equals(pay.get("status"))) throw new IllegalArgumentException("Pembayaran ini sudah diverifikasi.");
        if(!accepted && body.getOrDefault("catatan","").toString().isBlank()) throw new IllegalArgumentException("Catatan wajib diisi saat menolak pembayaran.");
        if(accepted && ((Number) pay.get("jumlah")).longValue()>((Number) pay.get("sisa")).longValue()) throw new IllegalArgumentException("Sisa tagihan sudah berubah. Periksa kembali nominal pembayaran.");
        int changed=db.update("UPDATE pembayaran SET status=?,catatan_verifikasi=? WHERE id=? AND status='MENUNGGU_VERIFIKASI'",accepted?"DITERIMA":"DITOLAK",body.get("catatan"),id);
        if(changed==0) throw new IllegalArgumentException("Pembayaran ini sudah diverifikasi.");
        if(accepted) db.update("UPDATE tagihan SET terbayar=terbayar+?,status=CASE WHEN terbayar+? >= total THEN 'LUNAS' ELSE 'BELUM_BAYAR' END WHERE id=?",pay.get("jumlah"),pay.get("jumlah"),pay.get("tagihan_id"));
        return db.queryForMap("SELECT * FROM pembayaran WHERE id=?",id);
    }
    @PostMapping("/tagihan/{id}/penundaan") @Transactional Map<String,Object> delay(HttpSession session,@PathVariable long id,@RequestBody Map<String,String> body) { long uid=userId(session); LocalDate ask=LocalDate.parse(body.get("tanggalDiminta")); LocalDate due=db.queryForObject("SELECT jatuh_tempo FROM tagihan t JOIN booking b ON b.id=t.booking_id WHERE t.id=? AND b.penyewa_id=?",LocalDate.class,id,uid); if(due==null || ask.isAfter(due.plusDays(14)) || ask.isBefore(due)) throw new IllegalArgumentException("Tanggal baru maksimal 14 hari setelah jatuh tempo asli."); if(body.getOrDefault("alasan","").trim().length()<20) throw new IllegalArgumentException("Alasan penundaan minimal 20 karakter."); return db.queryForMap("INSERT INTO pengajuan_penundaan(tagihan_id,tanggal_diminta,alasan) VALUES(?,?,?) RETURNING id,tagihan_id AS \"tagihanId\",tanggal_diminta AS \"tanggalDiminta\",alasan,status",id,ask,body.get("alasan")); }

    @PostMapping("/keluhan") @Transactional Map<String,Object> complaint(HttpSession session,@RequestBody Map<String,Object> body) { long uid=userId(session); Long booking=db.queryForObject("SELECT id FROM booking WHERE penyewa_id=? AND status='DISETUJUI' ORDER BY id DESC LIMIT 1",Long.class,uid); if(booking==null) throw new IllegalArgumentException("Keluhan hanya dapat dikirim jika kamu memiliki booking aktif."); return db.queryForMap("INSERT INTO keluhan(booking_id,kategori,deskripsi) VALUES(?,?,?) RETURNING id,booking_id AS \"bookingId\",kategori,deskripsi,status,dibuat_pada AS \"dibuatPada\"",booking,body.get("kategori"),body.get("deskripsi")); }
    @GetMapping("/keluhan") List<Map<String,Object>> complaints(HttpSession session) { long uid=userId(session); return db.queryForList("SELECT q.id,q.kategori,q.deskripsi,q.status,q.tanggapan_pemilik AS \"tanggapanPemilik\",q.dibuat_pada AS \"dibuatPada\",q.diperbarui_pada AS \"diperbaruiPada\",km.nomor AS \"kamarNomor\" FROM keluhan q JOIN booking b ON b.id=q.booking_id JOIN kamar km ON km.id=b.kamar_id WHERE b.penyewa_id=? ORDER BY q.dibuat_pada DESC",uid); }
    @PatchMapping("/keluhan/{id}/status") Map<String,Object> updateComplaint(HttpSession session,@PathVariable long id,@RequestBody Map<String,String> body) { require(session,"PEMILIK"); String state=body.get("status"); if(!List.of("DIPROSES","SELESAI").contains(state)) throw new IllegalArgumentException("Status keluhan hanya dapat bergerak maju."); int changed=db.update("UPDATE keluhan q SET status=?,tanggapan_pemilik=?,diperbarui_pada=NOW() WHERE q.id=? AND q.status IN ('DILAPORKAN','DIPROSES') AND EXISTS (SELECT 1 FROM booking b JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE b.id=q.booking_id AND k.pemilik_id=?)",state,body.get("tanggapanPemilik"),id,userId(session)); if(changed==0) throw new IllegalArgumentException("Keluhan tidak ditemukan, bukan milik kos kamu, atau sudah selesai."); return db.queryForMap("SELECT q.* FROM keluhan q JOIN booking b ON b.id=q.booking_id JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE q.id=? AND k.pemilik_id=?",id,userId(session)); }

    @PostMapping("/booking") @Transactional Map<String,Object> createBooking(HttpSession session,@RequestBody Map<String,Object> body) {
        long uid=userId(session); if(!Boolean.TRUE.equals(body.get("setujuAturan"))) throw new IllegalArgumentException("Persetujuan aturan kos harus dicatat sebelum booking.");
        db.queryForObject("SELECT id FROM pengguna WHERE id=? FOR UPDATE",Long.class,uid);
        Long active=db.queryForObject("SELECT COUNT(*) FROM booking WHERE penyewa_id=? AND status IN ('MENUNGGU','DISETUJUI')",Long.class,uid); if(active!=null&&active>0) throw new IllegalArgumentException("Kamu sudah memiliki booking aktif.");
        long room=Long.parseLong(String.valueOf(body.get("kamarId")));
        Map<String,Object> r=db.queryForMap("SELECT km.id,km.harga_bulanan,km.status,k.status_verifikasi,k.id kos_id FROM kamar km JOIN kos k ON k.id=km.kos_id WHERE km.id=?",room);
        if(!"KOSONG".equals(r.get("status"))||!"TERVERIFIKASI".equals(r.get("status_verifikasi"))) throw new IllegalArgumentException("Kamar ini tidak tersedia untuk dibooking.");
        Long pkg=Long.parseLong(String.valueOf(body.get("paketId")));
        var pack=db.queryForMap("SELECT nama,durasi_bulan,persen_diskon FROM paket_sewa WHERE id=? AND kos_id=? AND aktif=true",pkg,r.get("kos_id"));
        var p=new PaketSewa((String)pack.get("nama"),((Number)pack.get("durasi_bulan")).intValue(),(BigDecimal)pack.get("persen_diskon"));
        long total=p.hitungTotal(((Number)r.get("harga_bulanan")).longValue()); LocalDate start=LocalDate.parse(String.valueOf(body.get("tanggalMasuk")));
        int changed=db.update("UPDATE kamar SET status='DIPESAN' WHERE id=? AND status='KOSONG'",room); if(changed==0) throw new IllegalArgumentException("Kamar ini baru saja dipesan orang lain. Pilih kamar yang masih kosong.");
        return db.queryForMap("INSERT INTO booking(penyewa_id,kamar_id,paket_id,tanggal_masuk,tanggal_selesai,total_sewa) VALUES(?,?,?,?,?,?) RETURNING id,penyewa_id AS \"penyewaId\",kamar_id AS \"kamarId\",tanggal_masuk AS \"tanggalMasuk\",tanggal_selesai AS \"tanggalSelesai\",total_sewa AS \"totalSewa\",status,aturan_disetujui_pada AS \"waktuSetujuAturan\"",uid,room,pkg,start,start.plusMonths(p.durasiBulan()),total);
    }
    @GetMapping("/booking/saya") List<Map<String,Object>> myBookings(HttpSession session) { return db.queryForList("SELECT b.id,b.tanggal_masuk AS \"tanggalMasuk\",b.tanggal_selesai AS \"tanggalSelesai\",b.total_sewa AS \"totalSewa\",b.status,b.aturan_disetujui_pada AS \"waktuSetujuAturan\",b.alasan_tolak AS \"alasanTolak\",km.nomor AS \"kamarNomor\",km.tipe,k.nama AS \"kosNama\",p.nama AS \"paketNama\" FROM booking b JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id JOIN paket_sewa p ON p.id=b.paket_id WHERE b.penyewa_id=? ORDER BY b.id DESC",userId(session)); }
    @PatchMapping("/booking/{id}/konfirmasi") @Transactional Map<String,Object> confirmBooking(HttpSession session,@PathVariable long id) { require(session,"PEMILIK"); var booking=db.queryForMap("SELECT b.*,km.id kamar_id FROM booking b JOIN kamar km ON km.id=b.kamar_id JOIN kos k ON k.id=km.kos_id WHERE b.id=? AND k.pemilik_id=? AND b.status='MENUNGGU' AND km.status='DIPESAN'",id,userId(session)); int changed=db.update("UPDATE booking SET status='DISETUJUI' WHERE id=? AND status='MENUNGGU'",id); if(changed==0) throw new IllegalArgumentException("Booking sudah diproses atau tidak tersedia."); db.update("UPDATE kamar SET status='TERISI' WHERE id=? AND status='DIPESAN'",booking.get("kamar_id")); return db.queryForMap("SELECT * FROM booking WHERE id=?",id); }
    @PatchMapping("/booking/{id}/tolak") @Transactional Map<String,Object> rejectBooking(HttpSession session,@PathVariable long id,@RequestBody Map<String,String> body) { require(session,"PEMILIK"); if(body.getOrDefault("alasan","").isBlank()) throw new IllegalArgumentException("Alasan penolakan wajib diisi."); int changed=db.update("UPDATE booking b SET status='DITOLAK',alasan_tolak=? FROM kamar km,kos k WHERE b.id=? AND b.status='MENUNGGU' AND km.id=b.kamar_id AND km.status='DIPESAN' AND k.id=km.kos_id AND k.pemilik_id=?",body.get("alasan"),id,userId(session)); if(changed==0) throw new IllegalArgumentException("Booking sudah diproses atau bukan milik kos kamu."); db.update("UPDATE kamar SET status='KOSONG' WHERE id=(SELECT kamar_id FROM booking WHERE id=?) AND status='DIPESAN'",id); return db.queryForMap("SELECT * FROM booking WHERE id=?",id); }

    @GetMapping("/admin/statistik") Map<String,Object> adminStats(HttpSession session) { require(session,"SUPERADMIN"); Map<String,Object> stats=new LinkedHashMap<>(); stats.put("jumlahPenggunaPerPeran",db.queryForMap("SELECT COUNT(*) FILTER(WHERE peran='USER') AS \"USER\",COUNT(*) FILTER(WHERE peran='PEMILIK') AS \"PEMILIK\",COUNT(*) FILTER(WHERE peran='SUPERADMIN') AS \"SUPERADMIN\" FROM pengguna")); stats.put("jumlahKosMenunggu",db.queryForObject("SELECT COUNT(*) FROM kos WHERE status_verifikasi='MENUNGGU'",Long.class)); stats.put("kosPerStatus",db.queryForMap("SELECT COUNT(*) FILTER(WHERE status_verifikasi='TERVERIFIKASI') AS \"TERVERIFIKASI\",COUNT(*) FILTER(WHERE status_verifikasi='MENUNGGU') AS \"MENUNGGU\",COUNT(*) FILTER(WHERE status_verifikasi='DITOLAK') AS \"DITOLAK\",COUNT(*) FILTER(WHERE status_verifikasi='DINONAKTIFKAN') AS \"DINONAKTIFKAN\" FROM kos")); stats.put("kamarKosong",db.queryForObject("SELECT COUNT(*) FROM kamar WHERE status='KOSONG'",Long.class)); stats.put("hargaRataRata",db.queryForObject("SELECT COALESCE(ROUND(AVG(km.harga_bulanan)),0) FROM kamar km JOIN kos k ON k.id=km.kos_id WHERE k.status_verifikasi='TERVERIFIKASI'",Number.class)); stats.put("tingkatHunian",db.queryForObject("SELECT CASE WHEN COUNT(km)=0 THEN 0 ELSE ROUND(100.0*COUNT(*) FILTER(WHERE km.status='TERISI')/COUNT(km)) END FROM kamar km JOIN kos k ON k.id=km.kos_id WHERE k.status_verifikasi='TERVERIFIKASI'",Number.class)); return stats; }
    @GetMapping("/admin/kos") List<Map<String,Object>> adminKos(HttpSession session,@RequestParam(defaultValue="MENUNGGU") String status) { require(session,"SUPERADMIN"); return db.queryForList("SELECT k.id,k.nama,k.alamat,k.kode_pos AS \"kodePos\",k.aturan_kos AS \"aturanKos\",k.tanggal_jatuh_tempo AS \"tanggalJatuhTempo\",k.status_verifikasi AS \"statusVerifikasi\",k.catatan_verifikasi AS \"catatanVerifikasi\",k.dibuat_pada AS \"dibuatPada\",(SELECT COUNT(*) FROM kamar km WHERE km.kos_id=k.id) AS \"jumlahKamar\",p.nama AS \"pemilikNama\",p.email AS \"pemilikEmail\" FROM kos k JOIN pengguna p ON p.id=k.pemilik_id WHERE k.status_verifikasi=? ORDER BY k.dibuat_pada",status); }
    @PatchMapping("/admin/kos/{id}/verifikasi") Map<String,Object> verifyKos(HttpSession session,@PathVariable long id,@RequestBody Map<String,Object> body) { require(session,"SUPERADMIN"); boolean ok=Boolean.TRUE.equals(body.get("disetujui")); db.update("UPDATE kos SET status_verifikasi=?,catatan_verifikasi=? WHERE id=?",ok?"TERVERIFIKASI":"DITOLAK",body.get("catatan"),id); return db.queryForMap("SELECT * FROM kos WHERE id=?",id); }
    @GetMapping("/admin/pengguna") List<Map<String,Object>> users(HttpSession session,@RequestParam(required=false) String q,@RequestParam(required=false) String peran) { require(session,"SUPERADMIN"); return db.queryForList("SELECT id,nama,email,no_hp AS \"noHp\",peran,aktif,dibuat_pada AS \"dibuatPada\" FROM pengguna WHERE (CAST(? AS TEXT) IS NULL OR nama ILIKE '%'||?||'%' OR email ILIKE '%'||?||'%') AND (CAST(? AS TEXT) IS NULL OR peran=?) ORDER BY id DESC",q,q,q,peran,peran); }
    @PatchMapping("/admin/pengguna/{id}/status") Map<String,Object> userStatus(HttpSession session,@PathVariable long id,@RequestBody Map<String,Object> body) { require(session,"SUPERADMIN"); db.update("UPDATE pengguna SET aktif=? WHERE id=? AND peran<>'SUPERADMIN'",body.get("aktif"),id); return responseUser(id); }
}
