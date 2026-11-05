import { Fragment, forwardRef, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, animate, useInView, useReducedMotion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Loader2,
} from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1];
const CARD_SHADOW = 'shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

/* ------------------------------------------------------------------ */
/* PageHeader - Encabezado consistente para todas las páginas         */
/* ------------------------------------------------------------------ */

export const PageHeader = ({ title, description, actions, breadcrumb }) => (
  <header className="mb-6 animate-slide-up sm:mb-8">
    {breadcrumb?.length > 0 && (
      <nav aria-label="Ruta de navegación" className="mb-3">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-text-secondary">
          {breadcrumb.map((b, i) => (
            <Fragment key={`${b.label}-${i}`}>
              {i > 0 && (
                <li aria-hidden="true">
                  <ChevronRight size={12} className="text-text-secondary/50" />
                </li>
              )}
              <li>
                {b.href ? (
                  <Link to={b.href} className="rounded transition-colors hover:text-brand-500">
                    {b.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-medium text-neutral-900">
                    {b.label}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
    )}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 [text-wrap:balance] sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">{actions}</div>}
    </div>
  </header>
);

/* ------------------------------------------------------------------ */
/* StatCard - Tarjeta de métrica KPI con conteo animado               */
/* ------------------------------------------------------------------ */

const CountUp = ({ value }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const isNumber = typeof value === 'number' && Number.isFinite(value);
  const [display, setDisplay] = useState(isNumber && !reduce ? 0 : value);

  useEffect(() => {
    if (!isNumber || reduce) {
      const id = setTimeout(() => setDisplay(value), 0);
      return () => clearTimeout(id);
    }
    if (!inView) return undefined;
    const controls = animate(0, value, {
      duration: 1,
      ease: EASE,
      onUpdate: (v) => setDisplay(Number.isInteger(value) ? Math.round(v) : Number(v.toFixed(1))),
    });
    return () => controls.stop();
  }, [value, isNumber, inView, reduce]);

  return <span ref={ref}>{isNumber ? display.toLocaleString('es-CO') : display}</span>;
};

/** `tone` es una clase de fondo, p. ej. "bg-brand-500". `trend`: { up: boolean, label: string }. */
export const StatCard = ({ label, value, icon: Icon, tone = 'bg-brand-500', hint, trend }) => (
  <div
    className={`group relative overflow-hidden rounded-2xl border border-border bg-white p-5 ${CARD_SHADOW} transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-[0_20px_50px_-20px_rgba(159,18,57,0.35)] sm:p-6`}
  >
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-500/5 transition-transform duration-500 group-hover:scale-150"
    />
    <div className="relative flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-text-secondary">{label}</p>
        <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-neutral-900">
          <CountUp value={value} />
        </p>
        {trend && (
          <p
            className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${
              trend.up ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {trend.up ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />}
            {trend.label}
          </p>
        )}
        {hint && <p className="mt-2.5 text-xs leading-relaxed text-text-secondary">{hint}</p>}
      </div>
      {Icon && (
        <span
          className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl text-white shadow-soft transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 ${tone}`}
        >
          <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
        </span>
      )}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Badge - Insignia de estado consistente                             */
/* ------------------------------------------------------------------ */

const BADGE_TONES = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  warn: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  brand: 'bg-brand-500/10 text-brand-500 ring-brand-500/20',
};

const BADGE_DOTS = {
  success: 'bg-emerald-500',
  info: 'bg-sky-500',
  warn: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-slate-400',
  brand: 'bg-brand-500',
};

export const Badge = ({ tone = 'neutral', children, size = 'sm', dot = false }) => {
  const sizes = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${
        BADGE_TONES[tone] || BADGE_TONES.neutral
      } ${sizes[size] || sizes.sm}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${BADGE_DOTS[tone] || BADGE_DOTS.neutral}`} aria-hidden="true" />}
      {children}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* LoadingCard - Esqueleto de carga con brillo                        */
/* ------------------------------------------------------------------ */

export const LoadingCard = ({ rows = 3, height = 'h-12' }) => {
  const reduce = useReducedMotion();
  return (
    <div className="space-y-3 p-4" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`relative overflow-hidden rounded-lg bg-border/60 ${height}`}>
          {!reduce && (
            <motion.span
              aria-hidden="true"
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '300%' }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* EmptyState - Estado vacío consistente                              */
/* ------------------------------------------------------------------ */

export const EmptyState = ({ icon: Icon, title, text, action, bare = false }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${
        bare ? '' : 'rounded-2xl border border-dashed border-brand-500/25 bg-brand-50/50'
      }`}
    >
      {Icon && (
        <div className="relative mb-5">
          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-500/15 animate-pulse-ring" />
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-500 shadow-soft ring-1 ring-brand-500/15">
            <Icon size={24} aria-hidden="true" />
          </span>
        </div>
      )}
      <h3 className="mb-1 text-base font-semibold text-neutral-900">{title}</h3>
      {text && <p className="mx-auto max-w-sm text-sm leading-relaxed text-text-secondary">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* DataTable - Tabla en escritorio, tarjetas en móvil                 */
/* ------------------------------------------------------------------ */

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' };

const renderCell = (col, row) => {
  if (col.render) return col.render(row);
  const v = row[col.key];
  return v === null || v === undefined || v === '' ? '—' : String(v);
};

export const DataTable = ({
  columns,
  rows,
  emptyMessage,
  emptyIcon,
  emptyAction,
  rowKey = 'id',
  loading = false,
}) => {
  const reduce = useReducedMotion();
  const [titleCol, ...restCols] = columns;

  return (
    <div className={`overflow-hidden rounded-2xl border border-border bg-white ${CARD_SHADOW}`}>
      {loading ? (
        <LoadingCard rows={5} height="h-11" />
      ) : rows.length === 0 ? (
        <EmptyState
          bare
          icon={emptyIcon}
          title={emptyMessage || 'No hay datos para mostrar'}
          action={emptyAction}
        />
      ) : (
        <>
          <div className="custom-scrollbar hidden overflow-x-auto md:block">
            <table className="table w-full text-sm">
              <thead className="border-b border-border bg-brand-50/70 text-left text-xs font-semibold text-text-secondary">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={`whitespace-nowrap px-4 py-3 ${ALIGN[col.align] || ALIGN.left}`}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, i) => (
                  <motion.tr
                    key={row[rowKey]}
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.25), ease: EASE }}
                    className="transition-colors hover:bg-brand-50/60"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`whitespace-nowrap px-4 py-3 text-neutral-900 ${ALIGN[col.align] || ALIGN.left}`}
                      >
                        {renderCell(col, row)}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {rows.map((row, i) => (
              <motion.li
                key={row[rowKey]}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.25), ease: EASE }}
                className="p-4 transition-colors active:bg-brand-50/60"
              >
                <div className="mb-2.5 text-sm font-semibold text-neutral-900">{renderCell(titleCol, row)}</div>
                <dl className="grid gap-1.5">
                  {restCols.map((col) => (
                    <div key={col.key} className="flex items-baseline justify-between gap-4">
                      <dt className="text-xs font-medium text-text-secondary">{col.label}</dt>
                      <dd className="min-w-0 text-right text-sm text-neutral-900">{renderCell(col, row)}</dd>
                    </div>
                  ))}
                </dl>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* FormSection / FieldRow - Estructura de formularios                 */
/* ------------------------------------------------------------------ */

export const FormSection = ({ title, description, children, className = '' }) => (
  <section className={`space-y-5 ${className}`}>
    <div className="border-b border-border pb-3">
      <h2 className="text-base font-semibold tracking-tight text-neutral-900">{title}</h2>
      {description && <p className="mt-1 max-w-xl text-sm leading-relaxed text-text-secondary">{description}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

/** Usa `htmlFor` con el id del campo para asociar la etiqueta; `error` reemplaza al hint. */
export const FieldRow = ({ icon: Icon, label, hint, error, required, htmlFor, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-neutral-900/90">
      {Icon && <Icon size={15} className="flex-none text-brand-500" aria-hidden="true" />}
      <span>{label}</span>
      {required && (
        <span className="text-rose-600" aria-hidden="true">
          *
        </span>
      )}
    </label>
    {children}
    {error ? (
      <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
        <AlertCircle size={13} aria-hidden="true" /> {error}
      </p>
    ) : (
      hint && <p className="text-xs leading-relaxed text-text-secondary">{hint}</p>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* ConfirmDialog - Confirmación accesible con animación               */
/* ------------------------------------------------------------------ */

export const ConfirmDialog = ({
  isOpen,
  onClose,
  title,
  text,
  onConfirm,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'danger',
  loading = false,
}) => {
  const reduce = useReducedMotion();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const loadingRef = useRef(loading);
  const titleId = useId();
  const textId = useId();
  const danger = confirmVariant === 'danger';

  useEffect(() => {
    onCloseRef.current = onClose;
    loadingRef.current = loading;
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Foco inicial en "Cancelar": la opción segura en acciones destructivas.
    const focusTimer = setTimeout(() => dialogRef.current?.querySelector('[data-autofocus]')?.focus(), 0);

    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (!loadingRef.current) onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = Array.from(dialogRef.current?.querySelectorAll('button:not([disabled])') || []);
      if (!els.length) {
        e.preventDefault();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !loadingRef.current && onCloseRef.current()}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={textId}
            tabIndex={-1}
            initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.97 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-2xl outline-none"
          >
            <div className="flex items-start gap-4">
              <span
                className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${
                  danger ? 'bg-rose-50 text-rose-600' : 'bg-brand-500/10 text-brand-500'
                }`}
              >
                {danger ? <AlertTriangle size={22} aria-hidden="true" /> : <CheckCircle2 size={22} aria-hidden="true" />}
              </span>
              <div className="min-w-0 pt-0.5">
                <h2 id={titleId} className="text-lg font-semibold text-neutral-900">
                  {title}
                </h2>
                <p id={textId} className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  {text}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                data-autofocus
                onClick={onClose}
                disabled={loading}
                className="btn-outline px-4 py-2.5 text-sm"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                aria-busy={loading || undefined}
                className={`${danger ? 'btn-danger' : 'btn-primary'} px-4 py-2.5 text-sm`}
              >
                {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

/* ------------------------------------------------------------------ */
/* StepIndicator - Progreso en flujos de varios pasos                 */
/* ------------------------------------------------------------------ */

export const StepIndicator = ({ steps, current }) => {
  const reduce = useReducedMotion();
  return (
    <ol className="flex w-full items-start" aria-label="Progreso">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === steps.length - 1;
        return (
          <li
            key={step.label}
            aria-current={active ? 'step' : undefined}
            className="relative flex flex-1 flex-col items-center"
          >
            {!last && (
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-[18px] h-0.5 w-full -translate-y-1/2 overflow-hidden bg-border"
              >
                <motion.span
                  className="absolute inset-0 origin-left bg-brand-500"
                  initial={false}
                  animate={{ scaleX: done ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                />
              </span>
            )}
            <motion.span
              initial={false}
              animate={{ scale: active && !reduce ? 1.08 : 1 }}
              transition={{ duration: 0.25, ease: EASE }}
              className={`relative z-10 flex h-9 w-9 flex-none items-center justify-center rounded-full text-xs font-bold ring-2 transition-colors duration-300 ${
                done
                  ? 'bg-brand-500 text-white ring-brand-500'
                  : active
                    ? 'bg-white text-brand-500 ring-brand-500 shadow-[0_0_0_4px_rgba(159,18,57,0.12)]'
                    : 'bg-white text-text-secondary ring-border'
              }`}
            >
              {done ? <CheckCircle2 size={16} strokeWidth={2.5} aria-hidden="true" /> : i + 1}
              {done && <span className="sr-only"> (completado)</span>}
            </motion.span>
            <span
              className={`mt-2 px-1 text-center text-[11px] font-medium leading-tight ${
                done || active ? 'text-neutral-900' : 'text-text-secondary'
              } ${active ? '' : 'hidden sm:block'}`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

/* ------------------------------------------------------------------ */
/* IconButton - Botón de ícono accesible                              */
/* ------------------------------------------------------------------ */

export const IconButton = forwardRef(
  ({ icon: Icon, label, variant = 'ghost', size = 'md', className = '', ...props }, ref) => {
    const sizes = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-10 w-10' };
    const variants = {
      ghost: 'text-text-secondary hover:bg-brand-50 hover:text-neutral-900',
      brand: 'text-neutral-900 hover:bg-brand-500 hover:text-white',
      danger: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700',
    };
    return (
      <button
        ref={ref}
        type="button"
        title={label}
        className={`flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 ${
          sizes[size] || sizes.md
        } ${variants[variant] || variants.ghost} ${className}`}
        {...props}
      >
        <Icon size={size === 'sm' ? 16 : size === 'md' ? 18 : 20} aria-hidden="true" />
        <span className="sr-only">{label}</span>
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';