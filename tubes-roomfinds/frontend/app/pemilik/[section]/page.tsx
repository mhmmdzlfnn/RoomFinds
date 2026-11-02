import { notFound } from 'next/navigation';
import { BookingSection } from '@/components/owner/BookingSection';
import { DendaSection } from '@/components/owner/DendaSection';
import { KeluhanSection } from '@/components/owner/KeluhanSection';
import { KosSection } from '@/components/owner/KosSection';
import { PembayaranSection } from '@/components/owner/PembayaranSection';
import { TagihanSection } from '@/components/owner/TagihanSection';

export default function OwnerSection({ params }: { params: { section: string } }) {
  switch (params.section) {
    case 'kos': return <KosSection/>;
    case 'booking': return <BookingSection/>;
    case 'pembayaran': return <PembayaranSection/>;
    case 'tagihan': return <TagihanSection/>;
    case 'denda': return <DendaSection/>;
    case 'keluhan': return <KeluhanSection/>;
    default: notFound();
  }
}
