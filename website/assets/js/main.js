// RoomFinds — interaksi ringan mockup
document.addEventListener('DOMContentLoaded', function () {

  // Chip fasilitas / filter: toggle aktif
  document.querySelectorAll('.chip-toggle').forEach(function (chip) {
    chip.addEventListener('click', function () { chip.classList.toggle('active'); });
  });

  // Gerbang checkbox: tombol target baru aktif jika dicentang (mis. Ajukan Booking)
  document.querySelectorAll('[data-enable-target]').forEach(function (box) {
    var target = document.querySelector(box.getAttribute('data-enable-target'));
    if (!target) return;
    var sync = function () { target.disabled = !box.checked; };
    box.addEventListener('change', sync);
    sync();
  });

  // Tombol salin (detail rekening)
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        var old = btn.textContent;
        btn.textContent = 'Tersalin ✓';
        setTimeout(function () { btn.textContent = old; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else { done(); }
    });
  });

  // Pratinjau perhitungan meteran listrik (Pemilik · Kelola Tagihan)
  var awal = document.getElementById('meter-awal'),
      akhir = document.getElementById('meter-akhir'),
      tarif = document.getElementById('meter-tarif'),
      preview = document.getElementById('meter-preview');
  if (awal && akhir && tarif && preview) {
    var rupiah = function (n) { return 'Rp' + Math.round(n).toLocaleString('id-ID'); };
    var update = function () {
      var a = parseFloat(String(awal.value).replace(',', '.')) || 0;
      var b = parseFloat(String(akhir.value).replace(',', '.')) || 0;
      var t = parseFloat(String(tarif.value).replace(/[^\d]/g, '')) || 0;
      var used = Math.max(0, b - a);
      preview.textContent = 'Pemakaian ' +
        used.toLocaleString('id-ID', { maximumFractionDigits: 1 }) +
        ' kWh × ' + rupiah(t) + ' = ' + rupiah(used * t);
    };
    [awal, akhir, tarif].forEach(function (el) { el.addEventListener('input', update); });
    update();
  }

  // Tab Masuk/Daftar memakai tautan antarhalaman, jadi tidak perlu JS di sini.
});
