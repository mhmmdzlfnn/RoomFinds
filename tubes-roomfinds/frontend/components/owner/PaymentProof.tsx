'use client';
import { useId, useRef } from 'react';
import Image from 'next/image';
import { Eye } from 'lucide-react';
import buktiZulfan from './bukti-transfer-demo.svg';
import buktiRian from './bukti-transfer-rian.svg';

// Ilustrasi bukti transfer untuk mode demo, per id pembayaran (mockPay di PembayaranSection).
// Bukti Rian sengaja Rp1.125.000 (tagihan Rp1.250.000) supaya bisa dipakai mendemokan penolakan.
export const buktiDemo: Record<number, { src: typeof buktiZulfan; alt: string }> = {
  8: { src: buktiZulfan, alt: 'Bukti transfer demo BCA dari Zulfan untuk Kamar 204, Oktober 2026, Rp1.668.750' },
  9: { src: buktiRian, alt: 'Bukti transfer demo Mandiri dari Rian Hidayat untuk Kamar 103, Oktober 2026, Rp1.125.000' },
};

export function PaymentProof({ pembayaranId }: { pembayaranId: number }) {
  const bukti = buktiDemo[pembayaranId];
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        className="vp-lihat-btn"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <Eye size={13} aria-hidden="true" />
        <span>Lihat Detail</span>
      </button>

      <dialog
        ref={dialog}
        className="card card-pad owner-proof-dialog"
        aria-labelledby={titleId}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <div className="card-head">
          <h3 className="card-title" id={titleId}>
            Bukti Transfer · Demo
          </h3>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => dialog.current?.close()}
          >
            Tutup
          </button>
        </div>
        <Image className="u-w-full u-h-auto" src={bukti.src} alt={bukti.alt} width={420} height={600} unoptimized />
      </dialog>
    </>
  );
}
