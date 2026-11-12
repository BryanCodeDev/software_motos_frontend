import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Building2, Clock, FileText, Hash, Mail, Info, MapPin, Phone, ShieldAlert, ShieldCheck, Tag } from 'lucide-react';
import { routes } from '../utils/routes';
import Seo from './Seo';
import { Reveal, PageHeader } from './Section';
import { PENDING, COMPANY, isPending, panel } from './legalConstants';

const EASE = [0.22, 1, 0.36, 1];

/** Muestra el valor real o una etiqueta clara cuando aún no está configurado. */
export const Value = ({ value, label, onDark = false }) => {
  if (!isPending(value)) return <>{value}</>;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
        onDark
          ? 'border-amber-300/40 bg-amber-300/15 text-amber-100'
          : 'border-amber-200 bg-amber-50 text-amber-800'
      }`}
    >
      {label} · por configurar
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Bloques de contenido                                                */
/* ------------------------------------------------------------------ */

/** Sección numerada. El `id` debe coincidir con el de la lista `sections`. */
export const LegalSection = ({ id, number, title, children }) => (
  <section
    id={`sec-${id}`}
    className="scroll-mt-28 border-t border-border/70 py-8 first:border-t-0 first:pt-0 last:pb-0 lg:py-10 lg:first:pt-0 lg:last:pb-0"
  >
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-sm font-bold tabular-nums text-brand-500 ring-1 ring-brand-500/15">
        {number}
      </span>
      <h2 className="pt-0.5 text-lg font-bold leading-tight tracking-tight text-neutral-900">{title}</h2>
    </div>
    <div className="space-y-4 text-sm leading-relaxed text-text-secondary sm:pl-11">{children}</div>
  </section>
);

export const LegalP = ({ children }) => <p>{children}</p>;

/** Título corto dentro de una sección (p. ej. "Medios de pago:"). */
export const Lead = ({ children }) => <p className="font-semibold text-neutral-900">{children}</p>;

/** Texto pequeño de aclaración. */
export const Note = ({ children }) => <p className="text-xs leading-relaxed text-text-secondary/90">{children}</p>;

export const LegalList = ({ items, compact = false }) => (
  <ul className={compact ? 'space-y-1.5 text-[13px]' : 'space-y-2'}>
    {items.map((t) => (
      <li key={t} className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 flex-none rounded-full bg-brand-500 ${compact ? 'mt-[0.4rem]' : 'mt-[0.45rem]'}`}
        />
        <span>{t}</span>
      </li>
    ))}
  </ul>
);

/** Lista de pares etiqueta / valor en cuadrícula. */
export const DefList = ({ items }) => (
  <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
    {items.map(({ label, value }) => (
      <div key={label} className="bg-white p-4 sm:[&:last-child:nth-child(odd)]:col-span-2">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{label}</dt>
        <dd className="mt-1 break-words text-sm font-medium text-neutral-900">{value}</dd>
      </div>
    ))}
  </dl>
);

const TONES = {
  info: 'border-sky-200 bg-sky-50/70 text-sky-900',
  warning: 'border-amber-200 bg-amber-50/70 text-amber-900',
  danger: 'border-rose-200 bg-rose-50/80 text-rose-900',
};
const ICONS = { info: Info, warning: AlertTriangle, danger: ShieldAlert };

export const Callout = ({ tone = 'info', title, children }) => {
  const Icon = ICONS[tone] || Info;
  return (
    <div role="note" className={`flex gap-3 rounded-xl border p-4 text-sm leading-relaxed ${TONES[tone] || TONES.info}`}>
      <Icon size={18} className="mt-0.5 flex-none" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-1' : ''}>{children}</div>
      </div>
    </div>
  );
};

export const CardGrid = ({ children, cols = 3 }) => (
  <div className={`grid gap-3 sm:grid-cols-2 ${cols === 3 ? 'xl:grid-cols-3' : ''}`}>{children}</div>
);

export const InfoCard = ({ icon: Icon, title, tone = 'default', children }) => {
  const danger = tone === 'danger';
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        danger ? 'border-rose-200 bg-rose-50/70' : 'border-border bg-brand-50/50 hover:border-brand-500/30'
      }`}
    >
      <div className="mb-3 flex items-center gap-2.5">
        {Icon && (
          <span
            className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${
              danger ? 'bg-rose-100 text-rose-600' : 'bg-brand-500/10 text-brand-500'
            }`}
          >
            <Icon size={16} aria-hidden="true" />
          </span>
        )}
        <h3 className={`text-sm font-semibold ${danger ? 'text-rose-900' : 'text-neutral-900'}`}>{title}</h3>
      </div>
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Piezas                                                              */
/* ------------------------------------------------------------------ */

const Meta = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
      <Icon size={16} aria-hidden="true" />
    </span>
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-neutral-900">{children}</dd>
    </div>
  </div>
);

/** Resalta en el índice la sección que se está leyendo. */
const useActiveSection = (ids) => {
  const key = ids.join('|');
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined;
    const els = key
      .split('|')
      .map((id) => document.getElementById(`sec-${id}`))
      .filter(Boolean);
    if (!els.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id.replace('sec-', ''));
      },
      { rootMargin: '-110px 0px -65% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [key]);

  return [active, setActive];
};

/* ------------------------------------------------------------------ */
/* Página legal                                                        */
/* ------------------------------------------------------------------ */

export const LegalPage = ({ title, description, docType, version, effectiveDate, sections, children }) => {
  const reduce = useReducedMotion();
  const [active, setActive] = useActiveSection(sections.map((s) => s.id));

  const pendingFields = Object.values(COMPANY).filter(isPending).length;

  const goTo = (e, id) => {
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setActive(id);
  };

  return (
    <main id="contenido" className="min-h-screen bg-brand-50">
      <Seo title={title} description={description} noindex />

      <div className="container-page pb-20 sm:pb-28">
        <PageHeader eyebrow={docType} title={title} subtitle={description} align="left" />

        {/* Documento + responsable */}
        <Reveal className="mb-6 lg:mb-8">
          <div className={`${panel} overflow-hidden`}>
            <div className="grid divide-y divide-border/70 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] lg:divide-x lg:divide-y-0">
              <div className="p-5 sm:p-6">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">Documento</h2>
                <dl className="space-y-4">
                  <Meta icon={Tag} label="Versión">
                    <span className="font-mono">{version}</span>
                  </Meta>
                  <Meta icon={Clock} label="Fecha de vigencia">
                    {effectiveDate || 'Por definir'}
                  </Meta>
                  <Meta icon={FileText} label="Tipo de documento">
                    {docType}
                  </Meta>
                </dl>
              </div>

              <div className="p-5 sm:p-6">
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
                  Identificación del responsable
                </h2>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Meta icon={Building2} label="Nombre legal del operador">
                    <Value value={COMPANY.name} label="Nombre legal" />
                  </Meta>
                  <Meta icon={Hash} label="Identificación (NIT)">
                    <Value value={COMPANY.nit} label="NIT" />
                  </Meta>
                  <Meta icon={MapPin} label="Domicilio / dirección">
                    <Value value={COMPANY.address} label="Domicilio" />
                  </Meta>
                  <Meta icon={Mail} label="Correo electrónico oficial">
                    <Value value={COMPANY.email} label="Correo oficial" />
                  </Meta>
                  <Meta icon={Phone} label="Canal de atención al cliente">
                    <Value value={COMPANY.phone} label="Canal de atención" />
                  </Meta>
                </dl>
              </div>
            </div>
          </div>

          {import.meta.env.DEV && pendingFields > 0 && (
            <div className="mt-3">
              <Callout tone="warning" title="Faltan datos del operador">
                Completa las variables <code className="font-mono text-xs">VITE_COMPANY_*</code> y{' '}
                <code className="font-mono text-xs">VITE_PRIVACY_EMAIL</code> antes de publicar en producción. Este
                aviso solo se ve en desarrollo.
              </Callout>
            </div>
          )}
        </Reveal>

        {/* Índice móvil */}
        <nav
          aria-label="Contenido del documento"
          className="custom-scrollbar sticky top-16 z-30 -mx-4 mb-6 overflow-x-auto border-y border-border/60 bg-brand-50/90 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden"
        >
          <ul className="flex gap-2">
            {sections.map((s, i) => (
              <li key={s.id} className="flex-none">
                <a
                  href={`#sec-${s.id}`}
                  onClick={(e) => goTo(e, s.id)}
                  aria-current={active === s.id ? 'true' : undefined}
                  className={`focus-ring block max-w-[15rem] truncate whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active === s.id
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-border bg-white text-text-secondary hover:text-neutral-900'
                  }`}
                >
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          {/* Índice lateral */}
          <aside className="hidden lg:block">
            <nav
              aria-label="Contenido del documento"
              className={`${panel} custom-scrollbar sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto p-3`}
            >
              <p className="mb-2 px-3 pt-1 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
                Contenido
              </p>
              <ul className="space-y-0.5">
                {sections.map((s, i) => {
                  const isActive = active === s.id;
                  return (
                    <li key={s.id}>
                      <a
                        href={`#sec-${s.id}`}
                        onClick={(e) => goTo(e, s.id)}
                        aria-current={isActive ? 'true' : undefined}
                        className={`focus-ring relative flex items-start gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium leading-snug transition-colors ${
                          isActive ? 'text-brand-500' : 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900'
                        }`}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="legal-toc-active"
                            className="absolute inset-0 rounded-lg border border-brand-500/25 bg-brand-500/10"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          />
                        )}
                        <span className="relative w-5 flex-none tabular-nums opacity-70">{i + 1}.</span>
                        <span className="relative">{s.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0 space-y-8">
            {/* Contenido del documento */}
            <article className={`${panel} p-5 sm:p-8 lg:p-10`}>{children}</article>

            {/* Contacto */}
            <Reveal>
              <section
                aria-labelledby="legal-contacto"
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-6 text-white shadow-glow sm:p-8"
              >
                <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"
                />
                <div className="relative">
                  <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                    <ShieldCheck size={13} aria-hidden="true" /> Contacto
                  </span>
                  <h2 id="legal-contacto" className="text-xl font-bold tracking-tight [text-wrap:balance] sm:text-2xl">
                    Atención de reclamaciones y contacto
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">
                    Para consultas, solicitudes o reclamaciones relacionadas con este documento, escríbenos al canal
                    oficial de atención al cliente o al correo de privacidad habilitado.
                  </p>

                  <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                      <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                        <Mail size={14} aria-hidden="true" /> Correo de privacidad
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium">
                        {isPending(COMPANY.privacyEmail) ? (
                          <Value value={COMPANY.privacyEmail} label="Correo de privacidad" onDark />
                        ) : (
                          <a
                            href={`mailto:${COMPANY.privacyEmail}`}
                            className="underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white"
                          >
                            {COMPANY.privacyEmail}
                          </a>
                        )}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                      <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/70">
                        <Phone size={14} aria-hidden="true" /> Canal de atención al cliente
                      </dt>
                      <dd className="mt-1.5 break-words text-sm font-medium">
                        <Value value={COMPANY.phone} label="Canal de atención" onDark />
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>
            </Reveal>

            {/* Volver */}
            <Reveal>
              <div className={`${panel} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                    <ArrowRight size={18} className="-rotate-180" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-900">Volver al sitio</h3>
                    <p className="mt-0.5 text-xs text-text-secondary">Regresa al inicio de Tu QR Te Cuida.</p>
                  </div>
                </div>
                <Link to={routes.home} className="btn-outline group px-4 py-2 text-sm">
                  Ir al inicio
                  <ArrowRight
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LegalPage;