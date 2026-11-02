INSERT INTO pengguna(nama,email,no_hp,password_hash,peran,data_tambahan) VALUES
('Bu Sri Wahyuni','sri.wahyuni@email.com','081234567890','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{"namaBank":"BCA","noRekening":"1234567890"}'),
('Rina Aulia','rina.aulia@email.com','081234567891','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','USER','{"asalKampus":"Universitas Indonesia"}'),
('Dimas Pratama','dimas.pratama@email.com','081234567892','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','USER','{}'),
('Nabila Putri','nabila.putri@email.com','081234567893','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','USER','{}'),
('Fajar Nugroho','fajar.nugroho@email.com','081234567894','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','USER','{"asalKampus":"Telkom University"}'),
('Pak Hendra Saputra','hendra.saputra@email.com','081234567895','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{"namaBank":"Mandiri"}'),
('Admin RoomFinds','admin@roomfinds.id','080000000000','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','SUPERADMIN','{}')
ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash
WHERE pengguna.password_hash='$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT id,'Kos Melati Putri','Jl. Melati No. 12, Tebet, Jakarta Selatan','12810','Jam bertamu sampai pukul 22.00. Jaga kebersihan area bersama. Dilarang merokok di dalam kamar.',5,'TERVERIFIKASI' FROM pengguna WHERE email='sri.wahyuni@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Melati Putri');
INSERT INTO kamar(kos_id,nomor,tipe,harga_bulanan,luas,fasilitas,status)
SELECT k.id,v.nomor,v.tipe,v.harga,v.luas,v.fasilitas::jsonb,v.status FROM kos k CROSS JOIN (VALUES ('03','STANDAR',850000,9.0,'["Wi-Fi","Lemari","Meja belajar"]','TERISI'),('07','EKSKLUSIF',1350000,12.0,'["AC","Kamar mandi dalam","Wi-Fi"]','TERISI'),('12','STANDAR',850000,9.0,'["Wi-Fi","Lemari"]','KOSONG'),('15','STANDAR',850000,9.0,'["Wi-Fi","Lemari","Meja belajar"]','KOSONG')) AS v(nomor,tipe,harga,luas,fasilitas,status) WHERE k.nama='Kos Melati Putri' AND NOT EXISTS (SELECT 1 FROM kamar WHERE kos_id=k.id AND nomor=v.nomor);
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Bulanan',1,0 FROM kos WHERE nama='Kos Melati Putri' ON CONFLICT DO NOTHING;
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Semesteran',6,5 FROM kos WHERE nama='Kos Melati Putri' ON CONFLICT DO NOTHING;
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Tahunan',12,10 FROM kos WHERE nama='Kos Melati Putri' ON CONFLICT DO NOTHING;
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT p.id,'Kos Anggrek Putra','Jl. Anggrek No. 45, Pasar Minggu, Jakarta Selatan','12520','Jaga kebersihan area bersama. Jam bertamu sampai pukul 22.00.',10,'TERVERIFIKASI' FROM pengguna p WHERE p.email='sri.wahyuni@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Anggrek Putra');
INSERT INTO kamar(kos_id,nomor,tipe,harga_bulanan,luas,fasilitas,status)
SELECT k.id,v.nomor,v.tipe,v.harga,v.luas,v.fasilitas::jsonb,'KOSONG' FROM kos k CROSS JOIN (VALUES ('03','STANDAR',850000,9.0,'["Wi-Fi","Lemari","Meja belajar"]'),('08','EKSKLUSIF',1350000,12.0,'["AC","Kamar mandi dalam","Wi-Fi"]')) AS v(nomor,tipe,harga,luas,fasilitas) WHERE k.nama='Kos Anggrek Putra' AND NOT EXISTS (SELECT 1 FROM kamar WHERE kos_id=k.id AND nomor=v.nomor);
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Bulanan',1,0 FROM kos WHERE nama='Kos Anggrek Putra' ON CONFLICT DO NOTHING;
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Semesteran',6,5 FROM kos WHERE nama='Kos Anggrek Putra' ON CONFLICT DO NOTHING;
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Tahunan',12,10 FROM kos WHERE nama='Kos Anggrek Putra' ON CONFLICT DO NOTHING;
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT p.id,'Kos Kenanga','Jl. Kenanga No. 18, Setiabudi, Jakarta Selatan','12910','Jam bertamu sampai pukul 22.00. Dilarang merokok di dalam kamar.',10,'MENUNGGU' FROM pengguna p WHERE p.email='hendra.saputra@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Kenanga');
INSERT INTO kamar(kos_id,nomor,tipe,harga_bulanan,luas,fasilitas,status)
SELECT k.id,v.nomor,v.tipe,v.harga,v.luas,v.fasilitas::jsonb,'KOSONG' FROM kos k CROSS JOIN (VALUES ('01','STANDAR',850000,9.0,'["Wi-Fi","Lemari"]'),('02','EKSKLUSIF',1350000,12.0,'["AC","Kamar mandi dalam"]')) AS v(nomor,tipe,harga,luas,fasilitas) WHERE k.nama='Kos Kenanga' AND NOT EXISTS (SELECT 1 FROM kamar WHERE kos_id=k.id AND nomor=v.nomor);
INSERT INTO booking(penyewa_id,kamar_id,paket_id,tanggal_masuk,tanggal_selesai,total_sewa,status)
SELECT p.id,km.id,ps.id,'2026-01-01','2027-01-01',8500000,'DISETUJUI' FROM pengguna p JOIN kamar km ON km.nomor='03' JOIN kos k ON k.id=km.kos_id JOIN paket_sewa ps ON ps.kos_id=k.id AND ps.nama='Bulanan' WHERE p.email='dimas.pratama@email.com' AND k.nama='Kos Melati Putri' AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.penyewa_id=p.id AND b.kamar_id=km.id AND b.status='DISETUJUI');
INSERT INTO booking(penyewa_id,kamar_id,paket_id,tanggal_masuk,tanggal_selesai,total_sewa,status)
SELECT p.id,km.id,ps.id,'2026-10-01','2027-04-01',7695000,'DISETUJUI' FROM pengguna p JOIN kamar km ON km.nomor='07' JOIN kos k ON k.id=km.kos_id JOIN paket_sewa ps ON ps.kos_id=k.id AND ps.nama='Semesteran' WHERE p.email='rina.aulia@email.com' AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.penyewa_id=p.id AND b.kamar_id=km.id);
INSERT INTO booking(penyewa_id,kamar_id,paket_id,tanggal_masuk,tanggal_selesai,total_sewa,status)
SELECT p.id,km.id,ps.id,'2026-11-01','2026-12-01',850000,'MENUNGGU' FROM pengguna p JOIN kamar km ON km.nomor='15' JOIN kos k ON k.id=km.kos_id JOIN paket_sewa ps ON ps.kos_id=k.id AND ps.nama='Bulanan' WHERE p.email='fajar.nugroho@email.com' AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.penyewa_id=p.id AND b.kamar_id=km.id);
INSERT INTO booking(penyewa_id,kamar_id,paket_id,tanggal_masuk,tanggal_selesai,total_sewa,status)
SELECT p.id,km.id,ps.id,'2026-10-01','2026-11-01',850000,'DISETUJUI' FROM pengguna p JOIN kamar km ON km.nomor='12' JOIN kos k ON k.id=km.kos_id JOIN paket_sewa ps ON ps.kos_id=k.id AND ps.nama='Bulanan' WHERE p.email='nabila.putri@email.com' AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.penyewa_id=p.id AND b.kamar_id=km.id);
UPDATE kamar km SET status=CASE WHEN EXISTS (SELECT 1 FROM booking b WHERE b.kamar_id=km.id AND b.status='DISETUJUI') THEN 'TERISI' WHEN EXISTS (SELECT 1 FROM booking b WHERE b.kamar_id=km.id AND b.status='MENUNGGU') THEN 'DIPESAN' ELSE 'KOSONG' END;
INSERT INTO tagihan(booking_id,periode,jatuh_tempo,subtotal_item,denda,total,status,meteran_awal,meteran_akhir)
SELECT b.id,'2026-10-01','2026-10-05',1018750,10000,1028750,'TERLAMBAT',1240.0,1302.5 FROM booking b JOIN pengguna p ON p.id=b.penyewa_id WHERE p.email='dimas.pratama@email.com' AND NOT EXISTS (SELECT 1 FROM tagihan t WHERE t.booking_id=b.id AND t.periode='2026-10-01');
INSERT INTO item_tagihan(tagihan_id,jenis,keterangan,subtotal,meteran_awal,meteran_akhir,tarif_per_unit,satuan)
SELECT t.id,v.jenis,v.keterangan,v.subtotal,v.awal,v.akhir,v.tarif,v.satuan FROM tagihan t JOIN booking b ON b.id=t.booking_id JOIN pengguna p ON p.id=b.penyewa_id CROSS JOIN (VALUES ('SEWA','Sewa kamar standar · Oktober',850000,NULL::numeric,NULL::numeric,NULL::bigint,NULL::varchar),('TETAP','Wifi',50000,NULL,NULL,NULL,NULL),('TETAP','Kebersihan',25000,NULL,NULL,NULL,NULL),('PEMAKAIAN','Listrik',93750,1240.0,1302.5,1500,'kWh')) AS v(jenis,keterangan,subtotal,awal,akhir,tarif,satuan) WHERE p.email='dimas.pratama@email.com' AND t.periode='2026-10-01' AND NOT EXISTS (SELECT 1 FROM item_tagihan i WHERE i.tagihan_id=t.id AND i.keterangan=v.keterangan);
INSERT INTO tagihan(booking_id,periode,jatuh_tempo,subtotal_item,total,status)
SELECT b.id,'2026-10-01','2026-10-05',950000,950000,'MENUNGGU_VERIFIKASI' FROM booking b JOIN pengguna p ON p.id=b.penyewa_id WHERE p.email='nabila.putri@email.com' AND NOT EXISTS (SELECT 1 FROM tagihan t WHERE t.booking_id=b.id AND t.periode='2026-10-01');
INSERT INTO item_tagihan(tagihan_id,jenis,keterangan,subtotal)
SELECT t.id,v.jenis,v.keterangan,v.subtotal FROM tagihan t JOIN booking b ON b.id=t.booking_id JOIN pengguna p ON p.id=b.penyewa_id CROSS JOIN (VALUES ('SEWA','Sewa kamar standar',850000),('TETAP','Wifi dan kebersihan',100000)) AS v(jenis,keterangan,subtotal) WHERE p.email='nabila.putri@email.com' AND t.periode='2026-10-01' AND NOT EXISTS (SELECT 1 FROM item_tagihan i WHERE i.tagihan_id=t.id AND i.keterangan=v.keterangan);
INSERT INTO pembayaran(tagihan_id,metode,jumlah,status,bank_asal,nama_pengirim)
SELECT t.id,'TRANSFER',950000,'MENUNGGU_VERIFIKASI','BCA','Nabila Putri' FROM tagihan t JOIN booking b ON b.id=t.booking_id JOIN pengguna p ON p.id=b.penyewa_id WHERE p.email='nabila.putri@email.com' AND t.periode='2026-10-01' AND NOT EXISTS (SELECT 1 FROM pembayaran py WHERE py.tagihan_id=t.id);
INSERT INTO keluhan(booking_id,kategori,deskripsi,status,tanggapan_pemilik)
SELECT b.id,'FASILITAS','AC Kamar 07 meneteskan air sejak kemarin malam','DIPROSES','Teknisi akan datang besok pagi, ya.' FROM booking b JOIN pengguna p ON p.id=b.penyewa_id WHERE p.email='rina.aulia@email.com' AND NOT EXISTS (SELECT 1 FROM keluhan q WHERE q.booking_id=b.id);
