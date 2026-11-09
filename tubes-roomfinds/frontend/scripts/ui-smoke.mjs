import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Uses the installed Chrome/Edge and Node's native CDP client, without test dependencies.
const root = fileURLToPath(new URL('../', import.meta.url));
const browserPath = process.env.ROOMFINDS_BROWSER || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].find(existsSync);
assert(browserPath, 'Set ROOMFINDS_BROWSER to an installed Chrome/Edge executable.');
const base = 'http://127.0.0.1:3107';
const profile = await mkdtemp(path.join(tmpdir(), 'roomfinds-ui-'));
const screenshots = path.join(root, '.next/ui-preview');
await mkdir(screenshots, { recursive: true });
let server, browser, socket;
const errors = [];
const pending = new Map();
let sequence = 0;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let serverLog = '';
const deadline = setTimeout(() => { console.error('UI smoke test exceeded 100 seconds.'); process.exit(1); }, 100000);
const cleanup = () => { socket?.close(); browser?.kill(); server?.kill(); };
process.on('exit', cleanup);

async function poll(test, label, timeout = 12000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    try { if (await test()) return; } catch { /* wait for navigation/startup */ }
    await sleep(100);
  }
  throw new Error(`Timed out: ${label}`);
}
function cdp(method, params = {}) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 12000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function click(expression) { return evaluate(`(${expression}).click()`); }
async function fill(selector, value) {
  await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e)throw Error('Missing input'); const setter=Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set; setter.call(e,${JSON.stringify(value)}); e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); })()`);
}
async function visit(route, heading, name, publicPage = false) {
  const response = await fetch(`${base}${route}`);
  assert.equal(response.status, 200, `${route} HTTP status`);
  await cdp('Page.navigate', { url: `${base}${route}` });
  await poll(() => evaluate(`location.pathname===${JSON.stringify(route.split('?')[0])} && document.readyState==='complete' && document.body.innerText.includes(${JSON.stringify(heading)})`), route);
  await sleep(250);
  const layout = await evaluate(`(() => ({
    title:document.querySelector('h1')?.textContent,
    active:document.querySelectorAll('.sidebar-menu a.active').length,
    sidebar:!!document.querySelector('.sidebar'), avatar:!!document.querySelector('.topbar-user'),
    name:document.querySelector('.user-name')?.textContent,
    overflow:document.documentElement.scrollWidth>innerWidth,
    font:getComputedStyle(document.body).fontFamily,
    badRole:Array.from(document.querySelectorAll('th,.stat-label,.rc-title,.user-sub')).some(e=>e.textContent.trim()==='Penyewa'),
  }))()`);
  assert.equal(layout.sidebar, !publicPage, `${route} sidebar`);
  assert.equal(layout.avatar, !publicPage, `${route} account header`);
  if (!publicPage) {
    assert.equal(layout.active, 1, `${route} exactly one active menu`);
    const expected = route.startsWith('/admin') ? 'Admin Utama' : route.startsWith('/pemilik') ? 'Fariz' : 'Budi Santoso';
    assert.equal(layout.name, expected, `${route} account name`);
  }
  assert(!layout.overflow, `${route} desktop horizontal overflow`);
  assert(!layout.badRole, `${route} role label`);
  assert(layout.font.includes('Inter'), `${route} Inter font`);
  if (name) {
    await evaluate(`document.fonts.ready.then(()=>true)`);
    const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(path.join(screenshots, `${name}.png`), Buffer.from(shot.data, 'base64'));
  }
  console.log(`PASS ${route}`);
}

try {
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3107'], { cwd: root, env: { ...process.env, NEXT_PUBLIC_USE_MOCK: 'true' }, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', data => { serverLog += data; });
  server.stderr.on('data', data => { serverLog += data; });
  await poll(async () => (await fetch(base)).ok, 'Next.js startup', 20000);
  let browserLog = '';
  browser = spawn(browserPath, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  browser.stderr.on('data', data => { browserLog += data; });
  await poll(() => /DevTools listening on (ws:\/\/\S+)/.test(browserLog), 'browser startup');
  const endpoint = browserLog.match(/DevTools listening on (ws:\/\/\S+)/)[1];
  const debugOrigin = endpoint.replace(/^ws:/, 'http:').split('/devtools/')[0];
  const target = await (await fetch(`${debugOrigin}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const item = pending.get(message.id); if (!item) return;
      pending.delete(message.id);
      if (message.error) item.reject(new Error(JSON.stringify(message.error))); else item.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    
  });
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: `${base}/user/booking/baru?kamar=2&paket=1` });
  await poll(() => evaluate(`location.pathname==='/login' && new URLSearchParams(location.search).get('next')==='/user/booking/baru?kamar=2&paket=1'`), 'Direct booking URL requires login and preserves selection');
  assert(await evaluate(`!document.querySelector('#setuju')`), 'Guest cannot access the booking form');
  await visit('/login', 'Masuk ke Akun Anda', '03-login-default', true);
  assert(await evaluate(`(() => {
    const panel = document.querySelector('.login-page .auth-panel').getBoundingClientRect();
    const split = document.querySelector('.login-page .auth-split').getBoundingClientRect();
    const card = document.querySelector('.login-form-card');
    return Math.abs(panel.width / split.width - 0.5) < 0.01 &&
      card.firstElementChild.classList.contains('login-tabs') &&
      card.querySelectorAll('.login-input > svg').length === 2 &&
      document.querySelectorAll('.login-benefit').length === 3 &&
      !!document.querySelector('.login-password-label button') &&
      !!document.querySelector('.login-footer') &&
      !card.querySelector('.login-demo');
  })()`), 'Figma login split, compact tabs, input icons, benefits and footer');
  await click(`document.querySelector('.login-password-label button')`);
  assert(await evaluate(`document.querySelector('#bantuan-password').innerText.includes('password')`), 'Forgot-password help remains available');
  await click(`document.querySelector('.login-password-label button')`);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await sleep(150);
  assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth && document.querySelector('.auth-panel').getBoundingClientRect().bottom <= document.querySelector('.auth-main').getBoundingClientRect().top + 1`), 'Login stacks cleanly without mobile horizontal overflow');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await visit('/', 'Temukan Kos', '01-pencarian', true);
  assert.equal(await evaluate(`document.querySelectorAll('.room-card').length`), 6, 'Show six rooms initially');
  assert(await evaluate(`document.body.innerText.includes('12 kamar kosong ditemukan')`));
  const addresses = await evaluate(`Array.from(document.querySelectorAll('.room-card')).map(e => e.innerText.split('\\n').find(line => line.includes('Jakarta Selatan')))`);
  assert(addresses.every(Boolean), 'Every search result has an address in Jakarta Selatan');
  assert.equal(new Set(addresses).size, 6, 'The first six results show distinct kos addresses');
  await click(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Muat Lebih Banyak Kos')`);
  assert.equal(await evaluate(`document.querySelectorAll('.room-card').length`), 12, 'Load the next six rooms');
  assert(await evaluate(`!Array.from(document.querySelectorAll('button')).some(b=>b.textContent==='Muat Lebih Banyak Kos')`), 'Hide load-more when exhausted');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await poll(() => evaluate(`document.querySelectorAll('.room-card').length===6`), 'Search resets visible rooms');
  await click(`document.querySelector('.chip-toggle')`);
  assert.equal(await evaluate(`document.querySelectorAll('.room-card').length`), 6, 'Facility filter starts at six rooms');
  await click(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Muat Lebih Banyak Kos')`);
  assert.equal(await evaluate(`document.querySelectorAll('.room-card').length`), 8, 'Show all eight AC matches without duplicates');
  await click(`document.querySelector('.chip-toggle')`);
  assert.equal(await evaluate(`document.querySelectorAll('.room-card').length`), 6, 'Changing facilities resets visible rooms');
  assert(await evaluate(`document.body.innerText.includes('12 kamar kosong ditemukan')`));
  await evaluate(`Promise.all(Array.from(document.images).map(i=>i.complete?true:new Promise(r=>{i.onload=r;i.onerror=r})))`);
  assert(await evaluate(`Array.from(document.images).every(i=>i.naturalWidth>0)`), 'Search images render');
  await visit('/kamar/2', 'Pilih Paket Sewa', null, true);
  assert.equal(await evaluate(`new URL(document.querySelector('.room-detail-map iframe').src).searchParams.get('q')`), 'Jl. Tebet Timur Dalam II No. 18, Tebet, Jakarta Selatan', 'Tebet detail map follows its own kos address');
  assert(await evaluate(`document.querySelector('.room-detail-access').innerText.includes('area Tebet') && !document.querySelector('.room-detail-access').innerText.includes('Setiabudi Astra')`), 'Transport information follows the kos area');
  await visit('/kamar/1', 'Pilih Paket Sewa', '02-detail', true);
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.radio-card .rc-price')).map(e=>e.firstChild.textContent)`), ['Rp1.500.000', 'Rp8.550.000', 'Rp16.200.000']);
  const detail = await evaluate(`(() => {
    const facilities = document.querySelector('.room-detail-facilities');
    const specs = document.querySelector('.room-detail-specs');
    const access = document.querySelector('.room-detail-access');
    const map = document.querySelector('.room-detail-map iframe');
    const link = document.querySelector('a[href^="https://www.google.com/maps/search/"]');
    return {
      facilities: facilities.children.length,
      facilityIcons: facilities.querySelectorAll('li svg').length,
      facilityColumns: getComputedStyle(facilities).gridTemplateColumns.split(' ').length,
      facilityRows: new Set(Array.from(facilities.children, e => e.offsetTop)).size,
      specs: specs.children.length,
      specColumns: getComputedStyle(specs).gridTemplateColumns.split(' ').length,
      access: access.children.length,
      accessColumns: getComputedStyle(access).gridTemplateColumns.split(' ').length,
      mapAddress: new URL(map.src).searchParams.get('q'),
      linkAddress: new URL(link.href).searchParams.get('query'),
      safeExternalLink: link.target === '_blank' && link.rel.includes('noopener'),
      facilityImages: facilities.closest('section').querySelectorAll('img').length,
    };
  })()`);
  assert.deepEqual(detail, {
    facilities: 8, facilityIcons: 8, facilityColumns: 4, facilityRows: 2,
    specs: 4, specColumns: 2, access: 4, accessColumns: 2,
    mapAddress: 'Jl. Setiabudi Timur No. 12, Setiabudi, Jakarta Selatan',
    linkAddress: 'Jl. Setiabudi Timur No. 12, Setiabudi, Jakarta Selatan',
    safeExternalLink: true, facilityImages: 0,
  }, 'Detail facility/specification grids and Jakarta Selatan map');
  await evaluate(`document.querySelector('.room-detail-facilities').closest('section').scrollIntoView({block:'start'})`);
  await sleep(250);
  const detailShot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(path.join(screenshots, '02b-detail-fasilitas-lokasi.png'), Buffer.from(detailShot.data, 'base64'));
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
  await sleep(150);
  const mobileDetail = await evaluate(`({
    facilityColumns: getComputedStyle(document.querySelector('.room-detail-facilities')).gridTemplateColumns.split(' ').length,
    sectionsFit: Array.from(document.querySelectorAll('.room-detail-facilities, .room-detail-specs, .room-detail-map, .room-detail-access')).every(e => e.getBoundingClientRect().right <= innerWidth && e.scrollWidth <= e.clientWidth),
  })`);
  assert.equal(mobileDetail.facilityColumns, 2, 'Mobile detail uses two facility columns');
  assert(mobileDetail.sectionsFit, 'Updated detail sections fit the mobile viewport');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await evaluate(`window.scrollTo(0,0)`);
  assert(await evaluate(`Array.from(document.querySelectorAll('.ph-lg .badge')).every(e=>parseFloat(getComputedStyle(e).fontSize)<=14)`), 'Gallery badge size');
  assert(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ajukan Booking').disabled`));
  await click(`document.querySelectorAll('input[type=radio]')[1]`);
  await click(`document.querySelector('input[type=checkbox]')`);
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ajukan Booking').disabled`), false);
  await click(`document.querySelectorAll('.thumb-row button')[1]`);
  await sleep(150);
  assert(await evaluate(`document.querySelector('.ph-lg img').src.includes('204-tempat-tidur') && document.querySelector('.ph-lg img').naturalWidth>0`));
  await click(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ajukan Booking')`);
  await poll(() => evaluate(`location.pathname==='/login' && location.search.includes('next=')`), 'logged out booking -> login');
  assert.equal(await evaluate(`new URLSearchParams(location.search).get('next')`), '/user/booking/baru?kamar=1&paket=1', 'Logged-out booking preserves room and Semesteran package');
  await visit(`/login${await evaluate('location.search')}`, 'Selamat datang', '03-login', true);
  assert.equal(await evaluate(`document.querySelectorAll('input[type=radio]').length`), 0);
  await fill('#email', 'budi.santoso@email.com'); await fill('#password', 'password');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await poll(() => evaluate(`location.pathname==='/user/booking/baru' && document.body.innerText.includes('Rp8.550.000')`), 'Login resumes the selected booking');
  assert.equal(await evaluate(`document.querySelectorAll('input[type=radio]')[1].checked`), true, 'Semesteran package remains selected after login');
  await visit('/daftar', 'Nama Lengkap', '03b-daftar', true);
  assert.equal(await evaluate(`document.querySelectorAll('input[type=radio]').length`), 2);
  await visit('/user/profil', 'Profil Saya', '04-profil');
  await visit('/user/booking', 'Booking Saya', '05-booking');
  assert(await evaluate(`document.body.innerText.includes('Rp8.550.000') && document.body.innerText.includes('20 Okt 2026, 14.32')`));
  await visit('/user/tagihan', 'Rincian Tagihan', '06-tagihan');
  assert(await evaluate(`document.body.innerText.includes('Rp1.668.750') && document.body.innerText.includes('5 November 2026') && document.body.innerText.includes('1.240,0')`));
  await visit('/user/tagihan/1/bayar', 'Riwayat Pembayaran', '07-bayar');
  assert.equal(await evaluate(`document.querySelector('#jumlah-bayar').value`), '1668750');
  const doc = await cdp('DOM.getDocument');
  const upload = await cdp('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#bukti-transfer' });
  await cdp('DOM.setFileInputFiles', { nodeId: upload.nodeId, files: [path.join(screenshots, '01-pencarian.png')] });
  await fill('#jumlah-bayar', '833375');
  await sleep(100);
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await poll(() => evaluate(`document.querySelector('.success-inline') && document.querySelector('.timeline').textContent.includes('Rp833.375')`), 'partial payment and upload');
  await visit('/user/tagihan/1/penundaan', 'Alasan Penundaan', '08-penundaan');
  assert(await evaluate(`document.body.innerText.includes('19 November 2026')`));
  assert.equal(await evaluate(`document.querySelector('#tanggal-penundaan').max`), '2026-11-19');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await poll(() => evaluate(`document.querySelector('.success-inline') && document.body.innerText.includes('Menunggu')`), 'postponement submit');
  await visit('/user/tagihan/1/penundaan', 'Status & Riwayat Pengajuan', '08-penundaan');
  assert(await evaluate(`document.querySelector('#tanggal-penundaan').disabled`), 'once per bill persists');
  await visit('/user/keluhan', 'Lampu kamar mati sejak semalam', '09-keluhan');
  await fill('#keluhan-deskripsi', 'Stopkontak kamar tidak berfungsi sejak pagi.');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await poll(() => evaluate(`document.querySelector('.success-inline') && document.body.innerText.includes('Stopkontak kamar tidak berfungsi sejak pagi.')`), 'complaint submit');
  await visit('/user/booking', 'Booking Saya');
  await evaluate(`window.confirm=()=>true`);
  await click(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Batalkan Booking')`);
  await poll(() => evaluate(`document.body.innerText.includes('Dibatalkan')`), 'booking cancellation');
  await visit('/kamar/1', 'Pilih Paket Sewa', null, true);
  await click(`document.querySelectorAll('input[type=radio]')[1]`);
  await click(`document.querySelector('input[type=checkbox]')`);
  await click(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ajukan Booking')`);
  await poll(() => evaluate(`location.pathname==='/user/booking/baru' && document.body.innerText.includes('Rp8.550.000')`), 'booking intent retains Semesteran');
  await sleep(200);
  await click(`document.querySelector('#setuju')`);
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ajukan Booking').disabled`), false, 'cancellation permits new booking');
  await click(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Ajukan Booking')`);
  await poll(() => evaluate(`document.body.innerText.includes('Booking berhasil diajukan')`), 'new booking');
  await visit('/user/booking', 'Booking Saya');
  assert.equal(await evaluate(`Array.from(document.querySelectorAll('.booking-card .badge')).filter(b=>b.textContent==='Menunggu').length`), 1, 'only one active booking');
  await cdp('Page.navigate', { url: `${base}/pemilik` });
  await poll(() => evaluate(`location.pathname==='/user/booking'`), 'User cannot open owner dashboard');
  await visit('/login', 'Selamat datang', null, true);
  await fill('#email', 'fariz@email.com'); await fill('#password', 'password');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await poll(() => evaluate(`location.pathname==='/pemilik'`), 'owner login before protected screens');
  await visit('/pemilik', 'Pendapatan', '10-owner');
  assert.equal(await evaluate(`document.querySelectorAll('.stat-card').length`), 4);
  await visit('/pemilik/kos', 'Daftar Kamar', '11-kos');
  assert(await evaluate(`document.querySelector('input[aria-label="Nama Kos"]').value==='Kos Melati Putri'`));
  await visit('/pemilik/booking', 'User Aktif', '12-booking-masuk');
  await click(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Tolak')`);
  assert(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Kirim Penolakan').disabled`));
  await fill('textarea[aria-label="Alasan penolakan booking"]', 'Tanggal masuk yang dipilih belum tersedia.');
  await click(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Kirim Penolakan')`);
  await poll(() => evaluate(`document.querySelector('.success-inline')?.textContent.includes('ditolak')`), 'owner rejects with reason');
  await visit('/pemilik/pembayaran', 'Pengajuan Penundaan Masuk', '13-verifikasi-bayar');
  await visit('/pemilik/tagihan', 'Input Meteran', '14-meteran');
  assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.data-table thead th')).map(e=>e.textContent)`), ['User', 'Kamar', 'Periode', 'Total', 'Denda', 'Sisa', 'Status']);
  assert(await evaluate(`document.querySelector('.meter-preview').textContent.includes('Pemakaian 62,5 kWh x Rp1.500 = Rp93.750')`));
  await visit('/pemilik/denda', 'Pengaturan Aturan Denda', '15-denda');
  assert.equal(await evaluate(`document.querySelectorAll('input[type=radio]').length`), 3);
  await visit('/pemilik/keluhan', 'Tanggapan Pemilik', '16-owner-keluhan');
  await visit('/login', 'Selamat datang', null, true);
  await fill('#email', 'dynoadmin@roomfinds.id'); await fill('#password', 'password');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await poll(() => evaluate(`location.pathname==='/admin'`), 'admin login before protected screens');
  await visit('/admin', 'Antrean Verifikasi Terbaru', '17-admin');
  assert.equal(await evaluate(`document.querySelectorAll('.stat-card').length`), 5);
  assert.equal(await evaluate(`document.querySelectorAll('.stat-card:nth-child(2) .stat-rows .dot').length`), 3);
  await visit('/admin/verifikasi', 'Belum ada kamar, tidak dapat disetujui', '18-verifikasi-kos');
  assert(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Setujui').disabled`), 'zero-room approval disabled');
  await click(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Setujui' && !b.disabled)`);
  await poll(() => evaluate(`document.querySelector('.success-inline')?.textContent.includes('Terverifikasi')`), 'admin approval');
  await visit('/admin/akun', 'Cari akun', '19-akun');
  await fill('#cari-akun', 'Fariz'); await sleep(100);
  assert.equal(await evaluate(`document.querySelectorAll('tbody tr').length`), 1);
  assert(await evaluate(`document.querySelector('tbody').textContent.includes('Fariz')`));
  await click(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Blokir')`);
  assert(await evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Blokir Akun').disabled`));
  await fill('textarea', 'Melanggar aturan verifikasi kos.');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await poll(() => evaluate(`document.querySelector('.success-inline')?.textContent.includes('diblokir')`), 'admin block requires reason');
  await visit('/login', 'Selamat datang', null, true);
  await fill('#email', 'fariz@email.com'); await fill('#password', 'password');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await poll(() => evaluate(`location.pathname==='/pemilik'`), 'owner login');
  await visit('/login', 'Selamat datang', null, true);
  await fill('#email', 'dynoadmin@roomfinds.id'); await fill('#password', 'password');
  await evaluate(`document.querySelector('form').requestSubmit()`);
  await poll(() => evaluate(`location.pathname==='/admin'`), 'admin login');
  await click(`document.querySelector('.sidebar-footer button')`);
  await poll(() => evaluate(`location.pathname==='/login' && !localStorage.getItem('roomfinds-demo-profil')`), 'logout');
  await cdp('Page.navigate', { url: `${base}/user/booking/baru?kamar=2&paket=1` });
  await poll(() => evaluate(`location.pathname==='/login' && location.search.includes('next=')`), 'Booking remains protected after logout');
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  console.log('PASS: all 20 screens; gallery/consent; three role logins; cancellation/new booking; partial payment/upload; postponement; complaints; owner rejection; admin approval/block; exact table/stats; logout.');
  console.log(`Screenshots: ${screenshots}`);
} catch (error) {
  console.error(error);
  console.error('Next.js log:', serverLog);
  process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  cleanup();
  await sleep(500);
  await rm(profile, { recursive: true, force: true, maxRetries: 5 }).catch(() => {});
}
