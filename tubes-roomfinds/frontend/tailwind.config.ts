import type { Config } from 'tailwindcss';
// Catatan: globals.css tidak memuat @tailwind, jadi utilitas Tailwind tidak dihasilkan.
// Tema di bawah hanya menyelaraskan nama dengan token di app/tokens.css bila kelak diaktifkan.
const config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { bg: 'var(--bg)', surface: 'var(--surface)', muted: 'var(--surface-muted)', ink: 'var(--ink)', 'ink-muted': 'var(--muted)', line: 'var(--line)', accent: 'var(--accent)', primary: 'var(--ink)', 'primary-soft': 'var(--accent-soft)', success: 'var(--green)', warning: 'var(--amber)', danger: 'var(--red)', info: 'var(--blue)' }, borderRadius: { card: 'var(--r-card)', ctl: 'var(--r-ctl)', tag: 'var(--r-tag)' }, fontFamily: { sans: ['Instrument Sans', 'Inter', 'sans-serif'], display: ['Archivo', 'Arial Narrow', 'sans-serif'] } } }, plugins: [] };
export default config;
