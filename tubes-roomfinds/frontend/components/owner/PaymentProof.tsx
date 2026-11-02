'use client';
import { useId, useRef } from 'react';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';
import buktiDemo from './bukti-transfer-demo.svg';

export function PaymentProof() {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <div className="mt-16">
    <button type="button" className="btn btn-outline owner-proof-thumb" style={{ padding: 8, flexDirection: 'column', alignItems: 'flex-start' }} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
      <Image src={buktiDemo} alt="Bukti transfer demo Zulfan sebesar Rp1.668.750" width={98} height={140} unoptimized/>
      <span className="small" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ZoomIn size={15} aria-hidden="true"/>Perbesar bukti transfer</span>
    </button>
    <dialog ref={dialog} className="card card-pad owner-proof-dialog" aria-labelledby={titleId} style={{ margin: 'auto', width: 'min(480px, 92vw)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
      <div className="card-head"><h3 className="card-title" id={titleId}>Bukti Transfer · Demo</h3><button type="button" className="btn btn-outline btn-sm" onClick={() => dialog.current?.close()}>Tutup</button></div>
      <Image src={buktiDemo} alt="Bukti transfer demo BCA dari Zulfan untuk Kamar 204, Oktober 2026, Rp1.668.750" width={420} height={600} style={{ width: '100%', height: 'auto' }} unoptimized/>
    </dialog>
  </div>;
}
