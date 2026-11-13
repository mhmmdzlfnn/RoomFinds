'use client';
import { useEffect } from 'react';
import { animate, inView } from 'motion';

/*
  Animasi halaman memakai Motion (motion.dev). Satu komponen mengamati DOM, jadi
  halaman tidak perlu diubah satu per satu.

  Tujuan tiap gerakan (R-19), semuanya sekali jalan dan tanpa loop:
  - Kartu naik dan muncul bergantian saat masuk layar: mengarahkan mata ke bawah
    mengikuti urutan baca, bukan semua muncul sekaligus.
  - Angka statistik menghitung naik: menandai angka utama sebagai fokus halaman.
  Dimatikan penuh bila pengguna memilih "kurangi gerakan".
*/

const REVEAL = [
  '.card', '.owner-card', '.owner-stat-card', '.owner-welcome-card', '.owner-kelola-card', '.owner-tips-card',
  '.kt-card', '.kt-stat-card', '.admin-stat-card', '.admin-antrean-card', '.admin-vk-card',
  '.tagihan-card', '.tagihan-history-card', '.tagihan-support-card', '.figma-booking-card',
  '.bayar-method-card', '.bayar-riwayat-card', '.penundaan-card', '.keluhan-card',
  '.profil-card', '.vp-pay-card', '.vp-delay-card', '.fx-card', '.fx-kamar-card', '.room-card',
  '.fx-ak-panel', '.fx-ak-table-card', '.fx-bk-card', '.fx-bk-table-card', '.fx-kl-card', '.fx-pd-card',
].join(',');

const COUNT = '.owner-stat-value,.kt-stat-val,.admin-stat-main-val,.admin-stat-price-val,.stat-value,.owner-kelola-stat-val';
const EASE = [0.2, 0.7, 0.2, 1] as const;
const ribuan = new Intl.NumberFormat('id-ID');

function selesai(kontrol: unknown): Promise<unknown> {
  const dengan = kontrol as { finished?: Promise<unknown> };
  return Promise.resolve(dengan.finished ?? kontrol);
}

export function MotionEffects() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const sudahMuncul = new WeakSet<Element>();
    const sudahHitung = new WeakSet<Element>();

    const munculkan = (el: HTMLElement) => {
      if (sudahMuncul.has(el)) return;
      sudahMuncul.add(el);
      const saudara = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.matches(REVEAL)) : [];
      const delay = Math.min(Math.max(saudara.indexOf(el), 0), 7) * 0.07;
      el.style.opacity = '0';
      inView(
        el,
        () => {
          const gerak = animate(
            el,
            { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0px)'] },
            { duration: 0.5, delay, ease: EASE },
          );
          // Motion menulis nilai akhir ke style setelah promise selesai. Dibersihkan satu tick
          // sesudahnya supaya transform tidak tertinggal (transform membuat containing block
          // baru dan bisa merusak elemen fixed/sticky di dalam kartu).
          void selesai(gerak).then(() =>
            setTimeout(() => {
              el.style.removeProperty('opacity');
              el.style.removeProperty('transform');
            }, 0),
          );
        },
        { amount: 0.1 },
      );
    };

    const hitungNaik = (el: HTMLElement) => {
      if (sudahHitung.has(el)) return;
      const node = Array.from(el.childNodes).find((n) => n.nodeType === 3 && n.textContent?.trim());
      const cocok = node?.textContent?.match(/^(\s*(?:Rp\s?)?)(\d{1,3}(?:\.\d{3})+|\d+)([\s\S]*)$/);
      if (!node || !cocok) return;
      const target = parseInt(cocok[2].replace(/\./g, ''), 10);
      if (!Number.isFinite(target) || target < 10) return;
      sudahHitung.add(el);
      const [, awalan, , akhiran] = cocok;
      const tulis = (v: number) => {
        node.textContent = `${awalan}${target >= 1000 ? ribuan.format(v) : String(v)}${akhiran}`;
      };
      tulis(0);
      inView(
        el,
        () => {
          const gerak = animate(0, target, { duration: 1.1, ease: 'easeOut', onUpdate: (v: number) => tulis(Math.round(v)) });
          void selesai(gerak).then(() => tulis(target));
        },
        { amount: 0.3 },
      );
    };

    const proses = (akar: Element) => {
      if (akar.matches(REVEAL)) munculkan(akar as HTMLElement);
      akar.querySelectorAll<HTMLElement>(REVEAL).forEach(munculkan);
      if (akar.matches(COUNT)) hitungNaik(akar as HTMLElement);
      akar.querySelectorAll<HTMLElement>(COUNT).forEach(hitungNaik);
    };

    const pengamat = new MutationObserver((daftar) => {
      daftar.forEach((m) =>
        m.addedNodes.forEach((n) => {
          if (n instanceof Element) proses(n);
        }),
      );
    });
    pengamat.observe(document.body, { childList: true, subtree: true });
    proses(document.body);
    return () => pengamat.disconnect();
  }, []);

  return null;
}
