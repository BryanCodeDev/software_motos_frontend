import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Truck } from 'lucide-react';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';
import api from '../api/client';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { PageHeader } from '../components/Section';

const formatAmount = (amount) => {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return '$29.000';
  }
};

const INCLUDES = [
  '1 perfil digital independiente',
  '1 código QR permanente y único',
  '2 stickers físicos con el mismo QR',
  'Página pública con tu información de emergencia',
];

const STEPS = [
  'Elige tu diseño',
  'Paga una sola vez',
  'Se activa tu QR',
  'Recibe y pega tus stickers',
];

const DEFAULT_ROUTE = '/auth/registro';
const DEFAULT_DASHBOARD = '/panel';

export const Products = () => {
  const { isAuthenticated } = useAuth();
  const [stickerPrice, setStickerPrice] = useState(null);
  const [designs, setDesigns] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadCatalog = async () => {
      try {
        const [pRes, dRes, pkRes] = await Promise.all([
          api.get('/products'),
          api.get('/designs'),
          api.get('/packages'),
        ]);
        if (!mounted) return;

        const list = pRes.data && pRes.data.products ? pRes.data.products : pRes.data || [];
        const sticker = list.find((p) => p && p.slug === 'sticker-qr-personalizado');
        if (mounted && sticker && sticker.price) setStickerPrice(formatAmount(sticker.price));

        const productId = sticker ? sticker.id : null;
        if (productId) {
          const productDesigns = (dRes.data.designs || []).filter((d) => d.product_id === productId);
          setDesigns(productDesigns);
        } else {
          setDesigns(dRes.data.designs || []);
        }

        setPackages(pkRes.data.packages || pkRes.data || []);
      } catch {
        setError('No se pudo cargar el catálogo. Inténtalo de nuevo.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadCatalog();
    return () => { mounted = false; };
  }, []);

  const registerRoute = (routes && routes.register) || DEFAULT_ROUTE;
  const dashboardRoute = (routes && routes.dashboard) || DEFAULT_DASHBOARD;

  const stickerProductName = 'Stickers QR personalizados';

  return (
    <div className="min-h-screen">
      <Seo
        title="Tu QR Te Cuida — Stickers QR personalizados"
        description="Paquete de 2 stickers personalizados con tu código QR único de emergencia. Pago único, sin suscripción."
      />
      <PageHeader
        title="Stickers QR de emergencia"
        subtitle="Lleva tu QR siempre a la vista."
        align="center"
      />

      {loading && (
        <div className="container-page py-20 text-center">
          <p className="text-text-secondary">Cargando catálogo…</p>
        </div>
      )}

      {!loading && error && (
        <div className="container-page py-20 text-center">
          <p className="text-rose-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-outline mt-4 px-4 py-2 text-sm"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ───── Oferta principal ───── */}
          <section className="pb-16">
            <div className="container-page grid items-start gap-8 lg:grid-cols-12">
              <Card className="p-6 lg:sticky lg:top-24 lg:col-span-5 lg:p-8">
                <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Paquete de 2 stickers</h2>
                <p className="mt-3 text-4xl font-extrabold tracking-tight text-neutral-900">
                  {stickerPrice || '$29.000'}
                </p>
                <p className="mt-1 text-sm text-text-secondary">Pago único</p>

                <ul className="mt-6 space-y-3">
                  {(INCLUDES || []).map((text, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-neutral-900">
                      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                        <Check size={13} strokeWidth={3} aria-hidden="true" />
                      </span>
                      <span className="leading-relaxed">{text}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={isAuthenticated ? dashboardRoute : registerRoute}
                  className="btn-primary mt-8 w-full px-5 py-3 text-sm"
                >
                  {isAuthenticated ? 'Ir a mi panel' : 'Crear cuenta para pedir'}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>

                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-text-secondary">
                  <Truck size={14} className="mt-0.5 flex-none" aria-hidden="true" />
                  El envío a domicilio se confirma antes de pagar.
                </p>
              </Card>

              {/* Diseños */}
              <div className="lg:col-span-7">
                <h2 className="mb-5 text-2xl font-extrabold tracking-tight text-neutral-900">
                  Elige entre {designs.length} diseños
                </h2>
                <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {(designs || []).map((design, idx) => (
                    <li
                      key={`design-${design.id || idx}`}
                      className="rounded-2xl border border-border bg-white p-3 transition-colors hover:border-brand-500/40 sm:p-4"
                    >
                      <img
                        src={design.image_url || '/img/sticker-1.webp'}
                        alt={design.name || 'Diseño'}
                        width="160"
                        height="160"
                        loading="lazy"
                        className="aspect-square w-full rounded-xl bg-neutral-100 object-cover object-center"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <p className="mt-3 text-sm font-semibold text-neutral-900">{design.name || 'Diseño'}</p>
                      {design.description && (
                        <p className="text-xs text-text-secondary">{design.description}</p>
                      )}
                    </li>
                  ))}
                  {designs.length === 0 && (
                    <li className="col-span-full text-center py-10 text-text-secondary">
                      No hay diseños disponibles en este momento.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* ───── Catálogo de todos los planes ───── */}
          <section className="pb-24">
            <div className="container-page">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900">Todos los planes</h2>
                <p className="text-sm text-text-secondary">
                  Cada perfil comprado incluye su propio código QR permanente y 2 stickers físicos.
                </p>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(packages || [])
                  .filter((p) => p && p.is_active !== 0 && p.is_visible !== 0)
                  .map((plan, idx) => (
                    <li
                      key={plan.id || `plan-${idx}`}
                      className="rounded-2xl border border-border bg-white p-5 flex flex-col transition-colors hover:border-brand-500/40"
                    >
                      {plan.badge && (
                        <span className="mb-3 inline-block rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-500">
                          {plan.badge}
                        </span>
                      )}
                      <h3 className="mb-1 text-lg font-semibold text-neutral-900">{plan.name || 'Plan'}</h3>
                      <div className="mb-3 flex flex-wrap items-baseline gap-x-2">
                        <span className="text-2xl font-bold text-neutral-900">{plan.price != null ? formatAmount(plan.price) : 'Consulta precio'}</span>
                        {plan.currency && <span className="text-xs font-medium text-text-secondary">/{plan.currency}</span>}
                      </div>
                      <p className="mb-4 text-sm leading-relaxed text-text-secondary">{plan.description || ''}</p>
                      <ul className="mb-6 space-y-2 text-sm text-text-secondary">
                        {(plan.package_profiles || []).flatMap((pp) => [
                          `${pp.quantity_profiles || 1} perfil${pp.quantity_profiles > 1 ? 'es' : ''} de ${pp.profile_type === 'person' ? 'persona' : pp.profile_type === 'pet' ? 'mascota' : 'gestionado'}`,
                          `${pp.stickers_per_profile || 2} sticker${pp.stickers_per_profile > 1 ? 's' : ''} por perfil`,
                        ]).map((f, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" aria-hidden="true" /> {f}
                          </li>
                        ))}
                        <li className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" aria-hidden="true" /> QR permanente por perfil
                        </li>
                      </ul>
                      <Link
                        to={isAuthenticated ? routes.dashboardOrders : registerRoute}
                        className="btn-primary w-full py-2.5 text-sm"
                      >
                        {isAuthenticated ? 'Comprar este paquete' : 'Crear cuenta para comprar'}
                      </Link>
                    </li>
                  ))}
                {(packages || []).length === 0 && (
                  <li className="col-span-full text-center py-10 text-text-secondary">
                    No hay paquetes disponibles en este momento.
                  </li>
                )}
              </ul>
            </div>
          </section>

          {/* ───── Cómo funciona ───── */}
          <section className="pb-24">
            <div className="container-page">
              <h2 className="mb-6 text-2xl font-extrabold tracking-tight text-neutral-900">Cómo funciona</h2>
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {(STEPS || []).map((label, i) => (
                  <li key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-neutral-900">{label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Products;
