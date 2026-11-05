import { Link, NavLink, useLocation } from 'react-router-dom';
import React from 'react';
import {
  ArrowRight, ChevronRight, Calendar, Clock, Users, User, ShieldCheck, QrCode,
  Package, AlertTriangle, CheckCircle2, AlertCircle, Loader2, Search, Filter,
  Plus, Edit2, Trash2, Eye, EyeOff, Phone, Mail, Lock, Settings, LayoutDashboard,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/* PageHeader - Encabezado consistente para todas las páginas         */
/* ------------------------------------------------------------------ */

export const PageHeader = ({ title, description, actions, breadcrumb }) => {
  const { pathname } = useLocation();
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        {breadcrumb && (
          <nav className="flex items-center gap-1 text-xs text-brand-textMuted" aria-label="Breadcrumb">
            {breadcrumb.map((b, i) => (
              <>
                {i > 0 && <ChevronRight size={12} className="text-brand-textMuted/50" aria-hidden="true" />}
                {b.href ? (
                  <Link to={b.href} className="text-brand-text hover:text-brand-accent transition-colors">{b.label}</Link>
                ) : (
                  <span className="text-brand-textMuted">{b.label}</span>
                )}
              </>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-text sm:text-3xl">{title}</h1>
      </div>
      {description && <p className="max-w-2xl text-sm leading-relaxed text-brand-textMuted">{description}</p>}
      {actions && <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">{actions}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* StatCard - Tarjeta de métrica KPI consistente                      */
/* ------------------------------------------------------------------ */

export const StatCard = ({ label, value, icon: Icon, tone, hint, trend }) => (
  <div className="rounded-2xl border border-brand-border/50 bg-white/90 backdrop-blur-sm p-6 shadow-soft transition-all duration-300 hover:border-brand-accent/50 hover:shadow-[0_20px_40px_-10px_rgba(159,18,57,0.15)] hover:-translate-y-1">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-textMuted">{label}</p>
        <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-brand-text">{value}</p>
        {trend && (
          <p className="mt-2 text-xs font-medium {trend.up ? 'text-emerald-600' : 'text-rose-600'}">
            {trend.up ? <ArrowRight size={12} className="mr-1" /> : <ArrowRight size={12} rotate={180} className="ml-1" />}
            {trend.label}
          </p>
        )}
        {hint && <p className="mt-2.5 text-xs text-brand-textMuted">{hint}</p>}
      </div>
      {Icon && (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset shadow-lg">
          <span className={`relative flex h-8 w-8 items-center justify-center rounded-lg ${tone} text-white`}>
            <Icon size={16} strokeWidth={2.5} aria-hidden="true" />
            <span className="absolute -inset-1 rounded-xl opacity-20 blur" />
          </span>
        </div>
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
  warn: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  brand: 'bg-brand-accent/10 text-brand-accent ring-brand-accent/20',
};

export const Badge = ({ tone = 'neutral', children, size = 'sm' }) => {
  const sizes = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${BADGE_TONES[tone] || BADGE_TONES.neutral} ${sizes[size] || sizes.sm}`}>
      {children}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* DataTable - Tabla consistente con vista móvil de tarjetas          */
/* ------------------------------------------------------------------ */

export const DataTable = ({ columns, rows, emptyMessage, emptyIcon, emptyAction, rowKey = 'id' }) => (
  <div className="rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]">
    {rows.length === 0 ? (
      <div className="p-8 text-center">
        {emptyIcon && <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent"><emptyIcon size={24} aria-hidden="true" /></div>}
        <p className="text-sm font-semibold text-brand-text">{emptyMessage || 'No hay datos para mostrar'}</p>
        {emptyAction && <div className="mt-4">{emptyAction}</div>}
      </div>
    ) : (
      <>
        <table className="table w-full text-sm">
          <thead className="bg-brand-dark/70 text-left text-[10px] font-semibold uppercase tracking-wider text-brand-textMuted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} scope="col" className={`px-4 py-3 ${col.align || 'left'}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.map((row) => (
              <tr key={row[rowKey]} className="transition-colors hover:bg-brand-dark/60">
                {columns.map((col) => {
                  const val = col.render ? col.render(row) : String(row[col.key] || '—');
                  return (
                    <td key={col.key} className={`px-4 py-3 whitespace-nowrap ${col.align || 'left'} text-brand-text`}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile card view */}
        <div className="space-y-3 md:hidden">
          {rows.map((row) => (
            <div key={row[rowKey]} className="rounded-xl border p-4 hover:bg-brand-dark/50 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-semibold text-brand-text">{String(row[rowKey] || '—')}</p>
                </div>
              </div>
              <div className="grid gap-1.5">
                {columns.map((col) => {
                  if (col.key === rowKey) return null;
                  const val = col.render ? col.render(row) : String(row[col.key] || '—');
                  return (
                    <div key={col.key} className="flex items-baseline gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-textMuted">{col.label}</span>
                      <span className="text-sm text-brand-text">{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* FormSection - Sección de formulario consistente                    */
/* ------------------------------------------------------------------ */

export const FormSection = ({ title, description, children, className = '' }) => (
  <section className={`space-y-5 ${className}`}>
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-textMuted">{title}</h2>
      {description && <p className="mt-1 max-w-md text-xs text-brand-textMuted">{description}</p>}
    </div>
    <div className="space-y-4">{children}</div>
  </section>
);

/* ------------------------------------------------------------------ */
/* FieldRow - Campo de formulario con label, ícono y hint             */
/* ------------------------------------------------------------------ */

export const FieldRow = ({ icon: Icon, label, hint, required, children, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    <div className="flex items-center gap-2">
      {Icon && <Icon size={15} className="text-brand-accent shrink-0" aria-hidden="true" />}
      <label className="text-sm font-medium text-brand-text/90">{required ? <span>{label} <span className="text-rose-500 ml-0.5">*</span></span> : label}</label>
    </div>
    {children}
    {hint && <p className="text-xs text-brand-textMuted">{hint}</p>}
  </div>
);

/* ------------------------------------------------------------------ */
/* EmptyState - Estado vacío consistente                              */
/* ------------------------------------------------------------------ */

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-brand-border bg-brand-dark/50">
    {Icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent"><Icon size={24} aria-hidden="true" /></div>}
    <h3 className="mb-1 text-sm font-semibold text-brand-text">{title}</h3>
    {text && <p className="max-w-sm mx-auto text-xs text-brand-textMuted leading-relaxed">{text}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);

/* ------------------------------------------------------------------ */
/* LoadingCard - Esqueleto de carga consistente                       */
/* ------------------------------------------------------------------ */

export const LoadingCard = ({ rows = 3, height = 'h-12' }) => (
  <div className="animate-pulse space-y-3 p-4" aria-busy="true">
    {[...Array(rows)].map((_, i) => (
      <div key={i} className={`${height} rounded-lg bg-brand-border/60`} />
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* ConfirmDialog - Modal de confirmación simple                       */
/* ------------------------------------------------------------------ */

export const ConfirmDialog = ({ isOpen, onClose, title, text, onConfirm, confirmLabel = 'Confirmar', confirmVariant = 'danger', loading = false }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center" aria-modal="true" role="dialog" aria-labelledby="confirm-title">
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-md p-6 mx-auto bg-white rounded-2xl border border-brand-border shadow-2xl">
      <h2 id="confirm-title" className="mb-2 text-base font-semibold text-brand-text">{title}</h2>
      <p className="mb-6 text-sm text-brand-textMuted leading-relaxed">{text}</p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-brand-textMuted hover:bg-brand-dark/50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-50 ${
            confirmVariant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-500'
              : 'bg-brand-accent hover:bg-brand-accentHover'
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* StepIndicator - Indicador de paso para flujos multi-paso           */
/* ------------------------------------------------------------------ */

export const StepIndicator = ({ steps, current }) => (
  <ol className="flex items-center justify-between" aria-label="Proceso">
    {steps.map((step, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <li key={step.label} className="flex-1 flex flex-col items-center gap-2 relative">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-2 transition-all ${
              done
                ? 'bg-brand-accent text-white ring-brand-accent'
                : active
                  ? 'bg-brand-accent/10 text-brand-accent ring-brand-accent/30'
                  : 'bg-white text-brand-textMuted ring-brand-border'
            }`}
          >
            {done ? <CheckCircle2 size={14} strokeWidth={2.5} /> : i + 1}
          </span>
          <span className={`${done || active ? 'text-brand-text' : 'text-brand-textMuted'} text-[11px] font-medium`}>{step.label}</span>
          {i < steps.length - 1 && (
            <span
              className={`absolute -top-1/2 h-[1px] w-full ${
                done ? 'bg-brand-accent' : 'bg-brand-border'
              }`}
              aria-hidden="true"
            />
          )}
        </li>
      );
    })}
  </ol>
);

/* ------------------------------------------------------------------ */
/* IconButton - Botón de ícono consistente                            */
/* ------------------------------------------------------------------ */

export const IconButton = ({ icon: Icon, label, variant = 'ghost', size = 'md', className = '', ...props }) => {
  const sizes = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-10 w-10' };
  const variants = {
    ghost: 'text-brand-textMuted hover:bg-brand-dark hover:text-brand-text',
    brand: 'text-brand-text hover:bg-brand-accent hover:text-white',
    danger: 'text-rose-600 hover:bg-rose-50 hover:text-rose-600',
  };
  return (
    <button
      type="button"
      className={`flex items-center justify-center rounded-xl transition-colors ${sizes[size] || sizes.md} ${variants[variant] || variants.ghost} ${className}`}
      {...props}
    >
      <Icon size={size === 'sm' ? 16 : size === 'md' ? 18 : 20} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  );
};
