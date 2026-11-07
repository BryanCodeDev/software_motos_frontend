import React from 'react';
import { Link } from 'react-router-dom';
import { Check, MessageCircle } from 'lucide-react';
import { Card } from './ui';
import { routes } from '../utils/routes';
import { WHATSAPP_URL } from '../data/products';

/**
 * Tarjeta de producto. Se usa en Home y en Products.
 * - plan.whatsapp  -> botón que abre WhatsApp en una pestaña nueva
 * - plan.coming    -> sin botón, marcada como próximamente
 * - plan.highlight -> borde y brillo de la marca
 */
export const PlanCard = ({ plan: p, isAuthenticated = false, as: Heading = 'h3' }) => {
  const href = p.requiresAccount && isAuthenticated ? routes.dashboardQr : p.href;
  const label = isAuthenticated && p.authAction ? p.authAction : p.action;

  return (
    <Card
      className={`flex h-full flex-col p-7 ${p.highlight ? 'border-brand-500/40 shadow-glow' : ''} ${
        p.coming ? 'bg-brand-50/60' : ''
      }`}
    >
      <div className="mb-3 h-6">
        {p.badge && (
          <span className="inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-500">
            {p.badge}
          </span>
        )}
        {p.coming && (
          <span className="inline-block rounded-full border border-brand-500/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-500">
            Próximamente
          </span>
        )}
      </div>

      <Heading className="mb-1 text-lg font-semibold text-neutral-900">{p.name}</Heading>
      <div className="mb-3 flex flex-wrap items-baseline gap-x-2">
        <span className="text-2xl font-bold text-neutral-900">{p.price}</span>
        {p.priceNote && <span className="text-xs font-medium text-text-secondary">{p.priceNote}</span>}
      </div>
      <p className="mb-5 text-sm leading-relaxed text-text-secondary">{p.desc}</p>

      <ul className="mb-7 space-y-2 text-sm text-text-secondary">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" aria-hidden="true" /> {f}
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {p.coming ? (
          <span className="block text-xs text-text-secondary">Aún no está disponible para compra</span>
        ) : p.whatsapp ? (
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline w-full"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> {label}
          </a>
        ) : (
          <Link to={href} className={p.highlight ? 'btn-primary w-full' : 'btn-outline w-full'}>
            {label}
          </Link>
        )}
      </div>
    </Card>
  );
};

export default PlanCard;