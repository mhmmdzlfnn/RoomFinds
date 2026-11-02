package id.roomfinds.api;

import jakarta.servlet.http.HttpSession;
import java.util.Base64;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class PaymentUploadController {
    private final JdbcTemplate db;
    public PaymentUploadController(JdbcTemplate db) { this.db=db; }
    @PostMapping(value="/tagihan/{id}/pembayaran", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional Map<String,Object> upload(HttpSession session,@PathVariable long id,@RequestParam long jumlah,@RequestParam String metode,@RequestParam(required=false) String bankAsal,@RequestParam(required=false) String namaPengirim,@RequestPart(name="bukti",required=false) MultipartFile bukti) throws java.io.IOException {
        Object rawUser=session.getAttribute("userId"); if(rawUser==null||!"USER".equals(session.getAttribute("role"))) throw new IllegalArgumentException("Silakan masuk sebagai penyewa untuk mengirim pembayaran.");
        if(!"TRANSFER".equals(metode)) throw new IllegalArgumentException("Bukti transfer hanya diperlukan untuk pembayaran transfer.");
        if(jumlah<=0) throw new IllegalArgumentException("Jumlah pembayaran harus lebih dari nol.");
        if(bukti==null||bukti.isEmpty()) throw new IllegalArgumentException("Unggah bukti transfer sebelum mengirim pembayaran.");
        if(bukti.getSize()>2L*1024*1024) throw new IllegalArgumentException("Ukuran bukti transfer maksimal 2 MB.");
        String type=bukti.getContentType(); if(!java.util.List.of("image/jpeg","image/png","application/pdf").contains(type)) throw new IllegalArgumentException("Bukti transfer hanya dapat berupa JPG, PNG, atau PDF.");
        long userId=(long)rawUser; Long owing=db.queryForObject("SELECT t.total-t.terbayar FROM tagihan t JOIN booking b ON b.id=t.booking_id WHERE t.id=? AND b.penyewa_id=?",Long.class,id,userId);
        if(owing==null||jumlah>owing) throw new IllegalArgumentException("Jumlah pembayaran melebihi sisa tagihan.");
        String dataUrl="data:"+type+";base64,"+Base64.getEncoder().encodeToString(bukti.getBytes());
        return db.queryForMap("INSERT INTO pembayaran(tagihan_id,metode,jumlah,bank_asal,nama_pengirim,bukti_url,status) VALUES(?,?,?,?,?,?,?) RETURNING id,tagihan_id AS \"tagihanId\",metode,jumlah,tanggal,status,bank_asal AS \"bankAsal\",nama_pengirim AS \"namaPengirim\"",id,metode,jumlah,bankAsal,namaPengirim,dataUrl,"MENUNGGU_VERIFIKASI");
    }
}
