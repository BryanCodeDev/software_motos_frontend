import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { routes } from '../utils/routes';

/**
 * Layout compartido de las pantallas de acceso (login, registro, recuperación).
 * aside: { badge, line1, accent, text, items: [{ icon, title, desc }] }
 */
export const AuthShell = ({ aside, children }) => (
  <main className="grid min-h-screen bg-brand-50 lg:grid-cols-[1.05fr_1fr]">
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 p-12 text-white lg:flex xl:p-16">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-black/25 blur-3xl" />
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-20" />

      <Link to={routes.home} className="relative flex w-fit items-center gap-3" aria-label="Tu QR te Cuida, ir al inicio">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
          <ShieldCheck size={20} strokeWidth={2.4} />
        </span>
        <span className="text-lg font-bold tracking-tight">Tu QR te Cuida</span>
      </Link>

      <div className="relative max-w-md">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ring-white/20">
          <ShieldCheck size={14} /> {aside.badge}
        </span>
        <p className="mt-6 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
          {aside.line1} <span className="text-brand-300">{aside.accent}</span>
        </p>
        <p className="mt-5 text-base leading-relaxed text-white/80">{aside.text}</p>
        <ul className="mt-10 grid gap-3">
          {aside.items.map(({ icon: Icon, title, desc }) => (
            <li key={title} className="flex items-center gap-4 rounded-xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-sm">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white/15">
                <Icon size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-white/75">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative text-xs text-white/60">
        © {new Date().getFullYear()} Tu QR te Cuida. Herramienta de apoyo: no sustituye a los servicios
        oficiales de emergencia.
      </p>
    </aside>

    <section className="flex items-center justify-center px-4 py-10 sm:px-8">
      <div className="w-full max-w-md animate-slide-up">
        <Link
          to={routes.home}
          className="mb-6 flex items-center justify-center gap-2 lg:hidden"
          aria-label="Tu QR te Cuida, ir al inicio"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <ShieldCheck size={18} strokeWidth={2.4} />
          </span>
          <span className="text-base font-bold tracking-tight text-neutral-900">Tu QR te Cuida</span>
        </Link>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-glow sm:p-10">{children}</div>

        <Link
          to={routes.home}
          className="mt-6 hidden items-center justify-center gap-2 text-sm text-text-secondary transition-colors hover:text-brand-500 lg:flex"
        >
          <ArrowLeft size={14} /> Volver al sitio
        </Link>
      </div>
    </section>
  </main>
);

export default AuthShell;