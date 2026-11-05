import { useId, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];

/** Aparición suave al entrar al viewport. Respeta prefers-reduced-motion. */
export const Reveal = ({ children, delay = 0, y = 24, className = '' }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

/** Encabezado de sección con etiqueta, título y subtítulo. */
export const SectionHeading = ({ eyebrow, title, subtitle, align = 'center', className = '' }) => (
  <Reveal className={`mb-10 max-w-3xl sm:mb-12 lg:mb-14 ${align === 'center' ? 'mx-auto text-center' : ''} ${className}`}>
    {eyebrow && <span className="eyebrow mb-4">{eyebrow}</span>}
    <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">{title}</h2>
    {subtitle && (
      <p className="mt-4 text-base leading-relaxed text-text-secondary lg:text-lg">{subtitle}</p>
    )}
  </Reveal>
);

/** Cabecera de páginas internas. */
export const PageHeader = ({ eyebrow, title, subtitle, align = 'left' }) => (
  <header className="relative overflow-hidden pb-10 pt-12 sm:pt-16 lg:pb-16 lg:pt-24">
    <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
    <div
      className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl"
      aria-hidden="true"
    />
    <div className="container-page relative">
      <Reveal className={align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
        {eyebrow && <span className="eyebrow mb-4">{eyebrow}</span>}
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-4xl lg:text-5xl">{title}</h1>
        {subtitle && (
          <p className="mt-5 text-base leading-relaxed text-text-secondary sm:text-lg">{subtitle}</p>
        )}
      </Reveal>
    </div>
  </header>
);

/** Acordeón accesible para preguntas frecuentes. */
export const Accordion = ({ items }) => {
  const [open, setOpen] = useState(0);
  const reduce = useReducedMotion();
  const baseId = useId();

  return (
    <div className="space-y-3">
      {items.map(({ q, a }, i) => {
        const isOpen = open === i;
        const btnId = `${baseId}-btn-${i}`;
        const panelId = `${baseId}-panel-${i}`;
        return (
          <Reveal key={q} delay={Math.min(i * 0.04, 0.3)}>
            <div
              className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                isOpen
                  ? 'border-brand-500/40 shadow-[0_12px_40px_-20px_rgba(159,18,57,0.3)]'
                  : 'border-border hover:border-brand-500/30'
              }`}
            >
              <h3>
                <button
                  id={btnId}
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <span className={`font-semibold transition-colors ${isOpen ? 'text-brand-500' : 'text-neutral-900'}`}>{q}</span>
                  <span
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-full transition-colors ${
                      isOpen ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-500'
                    }`}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    id={panelId}
                    role="region"
                    aria-labelledby={btnId}
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-text-secondary">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
};
