import Link from 'next/link';
import { Inbox } from 'lucide-react';

// Komponen dasar. Gaya ada di app/components.css; jangan menambah style inline di sini.
const toneMap: Record<string, string> = { success: 'b-green', warning: 'b-amber', danger: 'b-red', info: 'b-blue', muted: 'b-gray', slate: 'b-slate', teal: 'b-teal', accent: 'b-teal' };
export function Badge({ children, tone = 'muted', dot = false }: { children: React.ReactNode; tone?: string; dot?: boolean }) { return <span className={`badge ${toneMap[tone] ?? toneMap.muted}`}>{dot && <i className="badge-dot" aria-hidden="true"/>}{children}</span>; }
export function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) { return <section className={`card card-pad ${className}`} style={style}>{children}</section>; }
export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) { return <div className="page-head"><div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>{action}</div>; }
export function StatCard({ label, value, sub, children }: { label: string; value: string; sub?: string; children?: React.ReactNode }) { return <div className="card stat-card"><div className="stat-label">{label}</div><div className="stat-value">{value}</div>{sub && <div className="stat-sub">{sub}</div>}{children}</div>; }
export function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) { return <div className="card empty-state"><span className="empty-state-icon" aria-hidden="true"><Inbox size={24}/></span><h3>{title}</h3><p>{body}</p>{action && <div className="mt-16">{action}</div>}</div>; }
export function B({ href, children, variant = 'btn-primary', sm = false }: { href: string; children: React.ReactNode; variant?: string; sm?: boolean }) { return <Link className={`btn ${variant}${sm ? ' btn-sm' : ''}`} href={href}>{children}</Link>; }
