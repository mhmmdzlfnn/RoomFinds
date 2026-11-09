import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/Shell';
export const metadata: Metadata = { title: 'RoomFinds', description: 'Platform pencarian dan pengelolaan kos di Jakarta Selatan dengan biaya transparan.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><head><link rel="preload" href="/fonts/InterVariable.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head><body><Shell>{children}</Shell></body></html>; }
