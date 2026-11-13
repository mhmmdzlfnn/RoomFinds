INSERT INTO pengguna(nama,email,no_hp,password_hash,peran,data_tambahan) VALUES
('Fariz','fariz@email.com','081234567890','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{"namaBank":"BCA","noRekening":"1234567890"}'),
('Zulfan','zulfan@email.com','081234567891','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','USER','{"asalKampus":"Universitas Indonesia"}'),
('Siti Aminah','siti.aminah@email.com','081234567896','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','USER','{}'),
('Rian Hidayat','rian.hidayat@email.com','081234567897','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','USER','{}'),
('Rina Aulia','rina.aulia@email.com','081234567894','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','USER','{"asalKampus":"Telkom University"}'),
('Dimas Pratama','dimas.pratama@email.com','081234567895','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','USER','{}'),
('Nabila Putri','nabila.putri@email.com','081234567898','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','USER','{}'),
('Rino','rino@email.com','081234567901','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{"namaBank":"Mandiri"}'),
('Sulthan','sulthan@email.com','081234567900','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{"namaBank":"BCA"}'),
('Aulia','aulia@email.com','081234567902','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{"namaBank":"BNI"}'),
('Hafizh','hafizh@email.com','081234567903','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{"namaBank":"BRI"}'),
('Vada','vada@email.com','081234567904','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{"namaBank":"Mandiri"}'),
('Naya','naya@email.com','081234567905','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{}'),
('Ahmad Fauzi','ahmad.fauzi@email.com','081234567892','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{"namaBank":"BCA"}'),
('Dewi Lestari','dewi.lestari@email.com','081234567906','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','PEMILIK','{}'),
('Dynoadmin','dynoadmin@roomfinds.id','080000000000','$2a$10$dipYpK2X9dwKdKN5TbE/c.9sdE.es14iGy6fcePFoq4ZmmI.3bvSm','SUPERADMIN','{}')
ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash
WHERE pengguna.password_hash='$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT id,'Kos Melati Putri','Jl. Setiabudi Timur No. 12, Setiabudi, Jakarta Selatan','12910','Jam bertamu sampai pukul 22.00. Jaga kebersihan area bersama. Dilarang merokok di dalam kamar.',5,'TERVERIFIKASI' FROM pengguna WHERE email='fariz@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Melati Putri');
INSERT INTO kamar(kos_id,nomor,tipe,harga_bulanan,luas,fasilitas,status)
SELECT k.id,v.nomor,v.tipe,v.harga,v.luas,v.fasilitas::jsonb,v.status FROM kos k CROSS JOIN (VALUES ('204','EKSKLUSIF',1500000,14.0,'["AC","Kamar mandi dalam","Wi-Fi","Kasur Queen"]','TERISI'),('102','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('305','EKSKLUSIF',2100000,14.0,'["AC","Kamar mandi dalam","Water Heater","Balkon"]','TERISI'),('207','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('103','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('105','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','DIPESAN'),('106','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','KOSONG'),('101','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('104','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('107','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('108','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('109','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('110','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('201','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('202','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('203','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('205','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('206','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('208','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('301','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('302','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','TERISI'),('303','STANDAR',1250000,9.0,'["Kipas Angin","Kamar mandi luar","Wi-Fi"]','KOSONG')) AS v(nomor,tipe,harga,luas,fasilitas,status) WHERE k.nama='Kos Melati Putri' AND NOT EXISTS (SELECT 1 FROM kamar WHERE kos_id=k.id AND nomor=v.nomor);
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Bulanan',1,0 FROM kos WHERE nama='Kos Melati Putri' ON CONFLICT DO NOTHING;
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Semesteran',6,5 FROM kos WHERE nama='Kos Melati Putri' ON CONFLICT DO NOTHING;
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Tahunan',12,10 FROM kos WHERE nama='Kos Melati Putri' ON CONFLICT DO NOTHING;
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT p.id,'Kos Anggrek Tebet','Jl. Tebet Timur Dalam II No. 18, Tebet, Jakarta Selatan','12820','Jaga kebersihan area bersama. Jam bertamu sampai pukul 22.00.',10,'TERVERIFIKASI' FROM pengguna p WHERE p.email='sulthan@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Anggrek Tebet');
INSERT INTO kamar(kos_id,nomor,tipe,harga_bulanan,luas,fasilitas,status)
SELECT k.id,v.nomor,v.tipe,v.harga,v.luas,v.fasilitas::jsonb,'KOSONG' FROM kos k CROSS JOIN (VALUES ('03','STANDAR',850000,9.0,'["Wi-Fi","Lemari","Meja belajar"]'),('08','EKSKLUSIF',1350000,12.0,'["AC","Kamar mandi dalam","Wi-Fi"]'),('304','EKSKLUSIF',1500000,14.0,'["AC","Kamar mandi dalam","Wi-Fi"]')) AS v(nomor,tipe,harga,luas,fasilitas) WHERE k.nama='Kos Anggrek Tebet' AND NOT EXISTS (SELECT 1 FROM kamar WHERE kos_id=k.id AND nomor=v.nomor);
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Bulanan',1,0 FROM kos WHERE nama='Kos Anggrek Tebet' ON CONFLICT DO NOTHING;
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Semesteran',6,5 FROM kos WHERE nama='Kos Anggrek Tebet' ON CONFLICT DO NOTHING;
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon) SELECT id,'Tahunan',12,10 FROM kos WHERE nama='Kos Anggrek Tebet' ON CONFLICT DO NOTHING;
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT p.id,'Kos Kenanga Mampang','Jl. Mampang Prapatan IV No. 7, Mampang Prapatan, Jakarta Selatan','12790','Jam bertamu sampai pukul 22.00. Dilarang merokok di dalam kamar.',10,'TERVERIFIKASI' FROM pengguna p WHERE p.email='rino@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Kenanga Mampang');
INSERT INTO kamar(kos_id,nomor,tipe,harga_bulanan,luas,fasilitas,status)
SELECT k.id,v.nomor,v.tipe,v.harga,v.luas,v.fasilitas::jsonb,'KOSONG' FROM kos k CROSS JOIN (VALUES ('01','STANDAR',850000,9.0,'["Wi-Fi","Lemari"]'),('02','EKSKLUSIF',1350000,12.0,'["AC","Kamar mandi dalam"]'),('104','STANDAR',1100000,9.0,'["Wi-Fi","Lemari"]')) AS v(nomor,tipe,harga,luas,fasilitas) WHERE k.nama='Kos Kenanga Mampang' AND NOT EXISTS (SELECT 1 FROM kamar WHERE kos_id=k.id AND nomor=v.nomor);
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT p.id,'Kos Cempaka Cilandak','Jl. Cilandak Tengah No. 24, Cilandak, Jakarta Selatan','12430','Jam bertamu sampai pukul 22.00. Jaga kebersihan area bersama.',5,'TERVERIFIKASI' FROM pengguna p WHERE p.email='aulia@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Cempaka Cilandak');
INSERT INTO kamar(kos_id,nomor,tipe,harga_bulanan,luas,fasilitas,status)
SELECT k.id,v.nomor,v.tipe,v.harga,v.luas,v.fasilitas::jsonb,'KOSONG' FROM kos k CROSS JOIN (VALUES ('01','STANDAR',950000,9.0,'["Wi-Fi","Lemari"]'),('02','EKSKLUSIF',1500000,12.0,'["AC","Kamar mandi dalam","Wi-Fi"]')) AS v(nomor,tipe,harga,luas,fasilitas) WHERE k.nama='Kos Cempaka Cilandak' AND NOT EXISTS (SELECT 1 FROM kamar WHERE kos_id=k.id AND nomor=v.nomor);
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT p.id,'Kos Dahlia Pejaten','Jl. Pejaten Barat II No. 15, Pasar Minggu, Jakarta Selatan','12510','Jam bertamu sampai pukul 22.00. Jaga kebersihan area bersama.',5,'TERVERIFIKASI' FROM pengguna p WHERE p.email='hafizh@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Dahlia Pejaten');
INSERT INTO kamar(kos_id,nomor,tipe,harga_bulanan,luas,fasilitas,status)
SELECT k.id,v.nomor,v.tipe,v.harga,v.luas,v.fasilitas::jsonb,'KOSONG' FROM kos k CROSS JOIN (VALUES ('01','STANDAR',1250000,9.0,'["Wi-Fi","Lemari","Meja belajar"]'),('02','EKSKLUSIF',1800000,12.0,'["AC","Kamar mandi dalam","Wi-Fi","Dapur"]'),('306','EKSKLUSIF',1400000,14.0,'["AC","Kamar mandi dalam","Wi-Fi"]')) AS v(nomor,tipe,harga,luas,fasilitas) WHERE k.nama='Kos Dahlia Pejaten' AND NOT EXISTS (SELECT 1 FROM kamar WHERE kos_id=k.id AND nomor=v.nomor);
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT p.id,'Kos Flamboyan Kebayoran','Jl. Gandaria I No. 9, Kebayoran Baru, Jakarta Selatan','12130','Jam bertamu sampai pukul 22.00. Jaga kebersihan area bersama.',5,'TERVERIFIKASI' FROM pengguna p WHERE p.email='vada@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Flamboyan Kebayoran');
INSERT INTO kamar(kos_id,nomor,tipe,harga_bulanan,luas,fasilitas,status)
SELECT k.id,v.nomor,v.tipe,v.harga,v.luas,v.fasilitas::jsonb,'KOSONG' FROM kos k CROSS JOIN (VALUES ('01','STANDAR',1400000,9.0,'["Wi-Fi","Lemari","Parkir"]'),('02','EKSKLUSIF',2100000,12.0,'["AC","Kamar mandi dalam","Wi-Fi","Parkir"]')) AS v(nomor,tipe,harga,luas,fasilitas) WHERE k.nama='Kos Flamboyan Kebayoran' AND NOT EXISTS (SELECT 1 FROM kamar WHERE kos_id=k.id AND nomor=v.nomor);
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT p.id,'Kos Dahlia','Jl. Kebayoran Baru No. 8, Jakarta Selatan','12120','Jam bertamu sampai pukul 22.00. Jaga kebersihan area bersama.',5,'MENUNGGU' FROM pengguna p WHERE p.email='ahmad.fauzi@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Dahlia');
INSERT INTO kamar(kos_id,nomor,tipe,harga_bulanan,luas,fasilitas,status)
SELECT k.id,v.nomor,v.tipe,v.harga,v.luas,v.fasilitas::jsonb,'KOSONG' FROM kos k CROSS JOIN (VALUES ('01','STANDAR',1100000,9.0,'["Wi-Fi","Lemari"]'),('02','EKSKLUSIF',1600000,12.0,'["AC","Kamar mandi dalam","Wi-Fi"]')) AS v(nomor,tipe,harga,luas,fasilitas) WHERE k.nama='Kos Dahlia' AND NOT EXISTS (SELECT 1 FROM kamar WHERE kos_id=k.id AND nomor=v.nomor);
INSERT INTO kos(pemilik_id,nama,alamat,kode_pos,aturan_kos,tanggal_jatuh_tempo,status_verifikasi)
SELECT p.id,'Kos Kenanga Indah','Jl. Tebet Raya No. 45, Jakarta Selatan','12810','Jam bertamu sampai pukul 22.00. Jaga kebersihan area bersama.',5,'MENUNGGU' FROM pengguna p WHERE p.email='dewi.lestari@email.com' AND NOT EXISTS (SELECT 1 FROM kos WHERE nama='Kos Kenanga Indah');
INSERT INTO paket_sewa(kos_id,nama,durasi_bulan,persen_diskon)
SELECT k.id,v.nama,v.durasi,v.diskon FROM kos k CROSS JOIN (VALUES ('Bulanan',1,0),('Semesteran',6,5),('Tahunan',12,10)) AS v(nama,durasi,diskon) WHERE k.nama IN ('Kos Kenanga Mampang','Kos Cempaka Cilandak','Kos Dahlia Pejaten','Kos Flamboyan Kebayoran','Kos Dahlia','Kos Kenanga Indah') ON CONFLICT DO NOTHING;
UPDATE pengguna SET aktif=false,alasan_nonaktif='Melanggar aturan verifikasi kos (foto fasilitas tidak sesuai kenyataan).',diblokir_pada='2026-10-24 09:00:00+07'
WHERE email='ahmad.fauzi@email.com' AND alasan_nonaktif IS NULL AND aktif=true;
-- ---------------------------------------------------------------------------
-- Cerita demo, sama dengan data demo frontend (Oktober 2026)
-- ---------------------------------------------------------------------------
UPDATE pengguna p SET dibuat_pada=v.t::timestamptz FROM (VALUES
('fariz@email.com','2026-05-10 09:00:00+07'),('zulfan@email.com','2026-05-12 09:00:00+07'),('dynoadmin@roomfinds.id','2026-05-01 09:00:00+07'),
('sulthan@email.com','2026-06-01 09:00:00+07'),('rino@email.com','2026-06-02 09:00:00+07'),('aulia@email.com','2026-06-03 09:00:00+07'),
('hafizh@email.com','2026-06-04 09:00:00+07'),('vada@email.com','2026-06-05 09:00:00+07'),('naya@email.com','2026-06-06 09:00:00+07'),
('rina.aulia@email.com','2026-06-10 09:00:00+07'),('dimas.pratama@email.com','2026-06-18 09:00:00+07'),('siti.aminah@email.com','2026-07-02 09:00:00+07'),
('rian.hidayat@email.com','2026-07-15 09:00:00+07'),('nabila.putri@email.com','2026-08-04 09:00:00+07'),('ahmad.fauzi@email.com','2026-10-12 09:00:00+07')
) AS v(email,t) WHERE p.email=v.email;
INSERT INTO booking(penyewa_id,kamar_id,paket_id,tanggal_masuk,tanggal_selesai,total_sewa,status,aturan_disetujui_pada,alasan_tolak)
SELECT p.id,km.id,ps.id,v.masuk::date,v.selesai::date,v.total,v.status,v.setuju::timestamptz,v.alasan
FROM (VALUES
('zulfan@email.com','Kos Melati Putri','204','Semesteran','2026-09-01','2027-03-01',8550000,'DISETUJUI','2026-08-20 14:32:00+07',NULL::text),
('rina.aulia@email.com','Kos Melati Putri','102','Semesteran','2026-05-01','2026-11-01',7125000,'DISETUJUI','2026-04-28 11:00:00+07',NULL),
('dimas.pratama@email.com','Kos Melati Putri','305','Bulanan','2026-10-01','2026-11-01',2100000,'DISETUJUI','2026-09-25 10:00:00+07',NULL),
('siti.aminah@email.com','Kos Melati Putri','207','Bulanan','2026-10-01','2026-11-01',1250000,'DISETUJUI','2026-09-26 13:20:00+07',NULL),
('rian.hidayat@email.com','Kos Melati Putri','103','Bulanan','2026-10-01','2026-11-01',1250000,'DISETUJUI','2026-09-27 15:40:00+07',NULL),
('nabila.putri@email.com','Kos Melati Putri','105','Bulanan','2026-11-01','2026-12-01',1250000,'MENUNGGU','2026-10-21 09:15:00+07',NULL),
('zulfan@email.com','Kos Dahlia Pejaten','306','Bulanan','2026-11-15','2026-12-15',1400000,'MENUNGGU','2026-11-02 10:05:00+07',NULL),
('zulfan@email.com','Kos Anggrek Tebet','304','Tahunan','2026-08-01','2027-08-01',16200000,'DITOLAK','2026-07-25 09:20:00+07','Maaf, kamar tersebut sudah dipesan oleh calon penyewa lain pada tanggal yang sama.'),
('zulfan@email.com','Kos Kenanga Mampang','104','Bulanan','2026-05-15','2026-08-15',3300000,'SELESAI','2026-05-13 16:45:00+07',NULL)
) AS v(email,kos,nomor,paket,masuk,selesai,total,status,setuju,alasan)
JOIN pengguna p ON p.email=v.email JOIN kos k ON k.nama=v.kos JOIN kamar km ON km.kos_id=k.id AND km.nomor=v.nomor JOIN paket_sewa ps ON ps.kos_id=k.id AND ps.nama=v.paket
WHERE NOT EXISTS (SELECT 1 FROM booking b WHERE b.penyewa_id=p.id AND b.kamar_id=km.id AND b.tanggal_masuk=v.masuk::date);
UPDATE kamar km SET status=CASE WHEN EXISTS (SELECT 1 FROM booking b WHERE b.kamar_id=km.id AND b.status='DISETUJUI') THEN 'TERISI' WHEN EXISTS (SELECT 1 FROM booking b WHERE b.kamar_id=km.id AND b.status='MENUNGGU') THEN 'DIPESAN' ELSE 'KOSONG' END
WHERE EXISTS (SELECT 1 FROM booking b WHERE b.kamar_id=km.id);
INSERT INTO tagihan(booking_id,periode,jatuh_tempo,subtotal_item,denda,total,terbayar,status,meteran_awal,meteran_akhir)
SELECT b.id,v.periode::date,v.tempo::date,v.subtotal,v.denda,v.total,v.terbayar,v.status,v.awal,v.akhir
FROM (VALUES
('zulfan@email.com','2026-09-01','2026-10-05',1668750,0,1668750,1668750,'LUNAS',1177.5::numeric,1240.0::numeric),
('zulfan@email.com','2026-10-01','2026-11-05',1668750,0,1668750,0,'BELUM_BAYAR',1240.0,1302.5),
('rina.aulia@email.com','2026-10-01','2026-11-05',1250000,0,1250000,1250000,'LUNAS',1120.0,1170.0),
('dimas.pratama@email.com','2026-10-01','2026-10-05',2100000,10000,2110000,0,'TERLAMBAT',1240.0,NULL),
('siti.aminah@email.com','2026-10-01','2026-11-05',1250000,0,1250000,0,'BELUM_BAYAR',980.0,NULL),
('rian.hidayat@email.com','2026-10-01','2026-11-05',1250000,0,1250000,0,'BELUM_BAYAR',1010.0,1040.0)
) AS v(email,periode,tempo,subtotal,denda,total,terbayar,status,awal,akhir)
JOIN pengguna p ON p.email=v.email JOIN booking b ON b.penyewa_id=p.id AND b.status='DISETUJUI'
WHERE NOT EXISTS (SELECT 1 FROM tagihan t WHERE t.booking_id=b.id AND t.periode=v.periode::date);
INSERT INTO item_tagihan(tagihan_id,jenis,keterangan,subtotal,meteran_awal,meteran_akhir,tarif_per_unit,satuan)
SELECT t.id,v.jenis,v.keterangan,v.subtotal,v.awal,v.akhir,v.tarif,v.satuan
FROM (VALUES
('zulfan@email.com','2026-09-01','SEWA','Sewa kamar eksklusif',1500000,NULL::numeric,NULL::numeric,NULL::bigint,NULL::varchar),
('zulfan@email.com','2026-09-01','TETAP','WiFi',50000,NULL,NULL,NULL,NULL),
('zulfan@email.com','2026-09-01','TETAP','Kebersihan',25000,NULL,NULL,NULL,NULL),
('zulfan@email.com','2026-09-01','PEMAKAIAN','Listrik',93750,1177.5,1240.0,1500,'kWh'),
('zulfan@email.com','2026-10-01','SEWA','Sewa kamar eksklusif',1500000,NULL,NULL,NULL,NULL),
('zulfan@email.com','2026-10-01','TETAP','WiFi',50000,NULL,NULL,NULL,NULL),
('zulfan@email.com','2026-10-01','TETAP','Kebersihan',25000,NULL,NULL,NULL,NULL),
('zulfan@email.com','2026-10-01','PEMAKAIAN','Listrik',93750,1240.0,1302.5,1500,'kWh'),
('rina.aulia@email.com','2026-10-01','SEWA','Sewa kamar standar',1250000,NULL,NULL,NULL,NULL),
('dimas.pratama@email.com','2026-10-01','SEWA','Sewa kamar eksklusif',2100000,NULL,NULL,NULL,NULL),
('siti.aminah@email.com','2026-10-01','SEWA','Sewa kamar standar',1250000,NULL,NULL,NULL,NULL),
('rian.hidayat@email.com','2026-10-01','SEWA','Sewa kamar standar',1250000,NULL,NULL,NULL,NULL)
) AS v(email,periode,jenis,keterangan,subtotal,awal,akhir,tarif,satuan)
JOIN pengguna p ON p.email=v.email JOIN booking b ON b.penyewa_id=p.id AND b.status='DISETUJUI' JOIN tagihan t ON t.booking_id=b.id AND t.periode=v.periode::date
WHERE NOT EXISTS (SELECT 1 FROM item_tagihan i WHERE i.tagihan_id=t.id AND i.keterangan=v.keterangan);
INSERT INTO pembayaran(tagihan_id,metode,jumlah,tanggal,status,bank_asal,nama_pengirim,catatan_verifikasi)
SELECT t.id,'TRANSFER',v.jumlah,v.tanggal::timestamptz,v.status,v.bank,v.pengirim,v.catatan
FROM (VALUES
('zulfan@email.com','2026-09-01',1668750,'2026-10-04 10:00:00+07','DITERIMA','BCA','Zulfan',NULL::text),
('zulfan@email.com','2026-10-01',1668750,'2026-10-24 19:30:00+07','DITOLAK','BCA','Zulfan','Bukti transfer kurang jelas. Mohon unggah ulang bukti yang memperlihatkan tanggal dan nominal.'),
('zulfan@email.com','2026-10-01',1668750,'2026-10-26 14:25:00+07','MENUNGGU_VERIFIKASI','BCA','Zulfan',NULL),
('rina.aulia@email.com','2026-10-01',1250000,'2026-10-03 09:00:00+07','DITERIMA','BCA','Rina Aulia',NULL),
('rian.hidayat@email.com','2026-10-01',1250000,'2026-10-12 09:10:00+07','MENUNGGU_VERIFIKASI','Mandiri','Rian Hidayat',NULL)
) AS v(email,periode,jumlah,tanggal,status,bank,pengirim,catatan)
JOIN pengguna p ON p.email=v.email JOIN booking b ON b.penyewa_id=p.id AND b.status='DISETUJUI' JOIN tagihan t ON t.booking_id=b.id AND t.periode=v.periode::date
WHERE NOT EXISTS (SELECT 1 FROM pembayaran py WHERE py.tagihan_id=t.id AND py.tanggal=v.tanggal::timestamptz);
INSERT INTO pengajuan_penundaan(tagihan_id,tanggal_diminta,alasan,status,dibuat_pada)
SELECT t.id,'2026-11-12','Kiriman dana bulanan dari orang tua baru masuk tanggal 12','MENUNGGU','2026-10-26 10:00:00+07'
FROM tagihan t JOIN booking b ON b.id=t.booking_id JOIN pengguna p ON p.id=b.penyewa_id
WHERE p.email='siti.aminah@email.com' AND t.periode='2026-10-01' AND NOT EXISTS (SELECT 1 FROM pengajuan_penundaan x WHERE x.tagihan_id=t.id);
INSERT INTO keluhan(booking_id,kategori,deskripsi,status,tanggapan_pemilik,dibuat_pada,diperbarui_pada)
SELECT b.id,v.kategori,v.deskripsi,v.status,v.tanggapan,v.dibuat::timestamptz,v.diperbarui::timestamptz
FROM (VALUES
('zulfan@email.com','LISTRIK','Lampu kamar mati sejak kemarin malam, sudah coba ganti bohlam tapi tetap tidak menyala','DILAPORKAN',NULL::text,'2026-10-21 08:00:00+07','2026-10-21 08:00:00+07'),
('rina.aulia@email.com','AIR','Air keran kamar kecil dan sering mati di pagi hari','DIPROSES','Teknisi sudah dijadwalkan datang besok pagi','2026-10-19 07:30:00+07','2026-10-19 12:00:00+07'),
('dimas.pratama@email.com','INTERNET','WiFi sering putus saat malam hari, sangat mengganggu pekerjaan kantor yang harus lembur.','SELESAI','Router sudah diganti, silakan coba kembali','2026-10-15 21:00:00+07','2026-10-16 10:00:00+07'),
('zulfan@email.com','FASILITAS','AC kamar meneteskan air sejak kemarin malam','DIPROSES','Teknisi akan datang besok pukul 10.00, mohon kamarnya bisa diakses','2026-10-12 22:00:00+07','2026-10-12 22:00:00+07'),
('zulfan@email.com','LISTRIK','Lampu kamar mandi luar mati','SELESAI','Bola lampu telah diganti baru.','2026-10-08 19:00:00+07','2026-10-09 10:00:00+07')
) AS v(email,kategori,deskripsi,status,tanggapan,dibuat,diperbarui)
JOIN pengguna p ON p.email=v.email JOIN booking b ON b.penyewa_id=p.id AND b.status='DISETUJUI'
WHERE NOT EXISTS (SELECT 1 FROM keluhan q WHERE q.booking_id=b.id AND q.deskripsi=v.deskripsi);
