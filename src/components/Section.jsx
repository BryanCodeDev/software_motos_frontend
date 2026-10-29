import React, { useState } from 'react';
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
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
};

/** Encabezado de sección con etiqueta, título y subtítulo. */
export const SectionHeading = ({ eyebrow, title, subtitle, align = 'center', className = '' }) => (
  <Reveal className={`mb-12 lg:mb-14 ${align === 'center' ? 'text-center mx-auto' : ''} max-w-3xl ${className}`}>
    {eyebrow && <span className="eyebrow mb-4">{eyebrow}</span>}
    <h2 className="text-3xl lg:text-4xl font-bold text-brand-text leading-tight">{title}</h2>
    {subtitle && (
      <p className="mt-4 text-brand-textMuted text-base lg:text-lg leading-relaxed">{subtitle}</p>
    )}
  </Reveal>
);

/** Cabecera de páginas internas. */
export const PageHeader = ({ eyebrow, title, subtitle, align = 'left' }) => (
  <header className="relative pt-16 pb-12 lg:pt-24 lg:pb-16 overflow-hidden">
    <div className="bg-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
    <div className="container-page relative">
      <Reveal className={align === 'center' ? 'text-center mx-auto max-w-3xl' : 'max-w-3xl'}>
        {eyebrow && <span className="eyebrow mb-4">{eyebrow}</span>}
        <h1 className="text-4xl lg:text-5xl font-bold text-brand-text leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-5 text-brand-textMuted text-lg leading-relaxed">{subtitle}</p>
        )}
      </Reveal>
    </div>
  </header>
);

/** Acordeón accesible para preguntas frecuentes. */
export const Accordion = ({ items }) => {
  const [open, setOpen] = useState(0);
  const reduce = useReducedMotion();

  return (
    <div className="space-y-3">
      {items.map(({ q, a }, i) => {
        const isOpen = open === i;
        return (
          <Reveal key={q} delay={Math.min(i * 0.04, 0.3)}>
            <div className={`card-static overflow-hidden transition-colors ${isOpen ? 'border-brand-accent/40' : ''}`}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-xl"
              >
                <span className="font-semibold text-brand-text">{q}</span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 text-brand-accent transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <p className="px-5 pb-5 text-brand-textMuted text-sm leading-relaxed">{a}</p>
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
