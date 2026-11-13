import type { Metadata } from 'next';
import './globals.css';
import './shell.css';
import './responsive.css';
import { Shell } from '@/components/Shell';
import { MotionEffects } from '@/components/MotionEffects';
export const metadata: Metadata = { title: 'RoomFinds', description: 'Platform pencarian dan pengelolaan kos di Jakarta Selatan dengan biaya transparan.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="id"><head><link rel="preload" href="/fonts/ArchivoVariable.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/><link rel="preload" href="/fonts/InstrumentSansVariable.woff2" as="font" type="font/woff2" crossOrigin="anonymous"/></head><body><Shell>{children}</Shell><MotionEffects /></body></html>; }
