import { notFound } from 'next/navigation';
import { AccountsSection } from '@/app/admin/[section]/AccountsSection';
import { VerificationSection } from '@/app/admin/[section]/VerificationSection';

export default function AdminSection({ params }: { params: { section: string } }) {
  if (params.section === 'verifikasi') return <VerificationSection/>;
  if (params.section === 'akun') return <AccountsSection/>;
  notFound();
}
