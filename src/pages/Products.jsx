import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Truck, ChevronsRight, Sticker, CreditCard, QrCode, Palette, Package, ShieldCheck } from 'lucide-react';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';
import api from '../api/client';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';

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

const hideScrollbar = '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const STEP_ICONS = [Palette, CreditCard, QrCode, Truck];

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

const DESIGN_IMAGES = [
  '/img/sticker-1.webp',
  '/img/sticker-2.webp',
  '/img/sticker-3.webp',
  '/img/sticker-4.webp',
  '/img/sticker-5.webp',
  '/img/sticker-6.webp',
  '/img/sticker-7.webp',
  '/img/sticker-8.webp',
  '/img/sticker-9.webp',
  '/img/sticker-10.webp',
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
        <div className="container-page pb-20" aria-busy="true" aria-label="Cargando catálogo">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="h-80 animate-pulse rounded-2xl bg-brand-100/70 lg:col-span-5" />
            <div className="grid grid-cols-3 gap-3 lg:col-span-7">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-2xl bg-brand-100/70" />
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="container-page py-16 text-center">
          <p className="text-rose-700">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-outline mt-4 min-h-[48px] px-5 text-sm">
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* ───── Oferta principal ───── */}
          <section className="pb-12 sm:pb-16">
            <div className="container-page grid items-start gap-8 lg:grid-cols-12">
              <Reveal className="lg:sticky lg:top-24 lg:col-span-5">
                <Card className="p-5 sm:p-6 lg:p-8">
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500">
                    <Sticker size={13} aria-hidden="true" /> Pago único
                  </span>
                  <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Paquete de 2 stickers</h2>
                  <p className="mt-2 text-4xl font-extrabold tracking-tight text-neutral-900">{stickerPrice || '$29.000'}</p>

                  <ul className="mt-5 space-y-3">
                    {(INCLUDES || []).map((text, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-neutral-900">
                        <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                          <Check size={13} strokeWidth={3} aria-hidden="true" />
                        </span>
                        <span className="leading-relaxed">{text}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={isAuthenticated ? dashboardRoute : registerRoute} className="btn-primary mt-7 min-h-[52px] w-full px-5 text-sm">
                    {isAuthenticated ? 'Ir a mi panel' : 'Crear cuenta para pedir'}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>

                  <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-text-secondary">
                    <Truck size={14} className="mt-0.5 flex-none" aria-hidden="true" />
                    El envío a domicilio se confirma antes de pagar.
                  </p>
                </Card>
              </Reveal>

              {/* Diseños: en móvil se desliza de lado */}
              <div className="min-w-0 lg:col-span-7">
                <h2 className="mb-4 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-neutral-900 sm:mb-5 sm:text-2xl">
                  <Palette className="h-5 w-5 text-brand-500" aria-hidden="true" />
                  Elige entre {designs.length} diseños
                </h2>
                <ul className={`-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 ${hideScrollbar}`}>
                  {(designs || []).map((design, idx) => (
                    <li
                      key={`design-${design.id || idx}`}
                      className="group w-[44%] flex-none snap-center rounded-2xl border border-border bg-white p-3 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-soft sm:w-auto sm:p-4"
                    >
                      <div className="overflow-hidden rounded-xl bg-neutral-100">
                        <img
                          src={DESIGN_IMAGES[idx] || design.image_url || '/img/sticker-1.webp'}
                          alt={design.name || 'Diseño'}
                          width="160"
                          height="160"
                          loading="lazy"
                          className="aspect-square w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-neutral-900">{design.name || 'Diseño'}</p>
                      {design.description && <p className="text-xs text-text-secondary">{design.description}</p>}
                    </li>
                  ))}
                  {designs.length === 0 && (
                    <li className="col-span-full w-full py-10 text-center text-text-secondary">No hay diseños disponibles en este momento.</li>
                  )}
                </ul>
                {designs.length > 2 && (
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-xs font-medium text-text-secondary sm:hidden">
                    Desliza para ver más <ChevronsRight className="h-4 w-4 text-brand-500" aria-hidden="true" />
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ───── Cómo funciona (corto, antes de los planes) ───── */}
          <section className="pb-12 sm:pb-16">
            <div className="container-page">
              <h2 className="mb-4 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-neutral-900 sm:mb-6 sm:text-2xl">
                <ShieldCheck className="h-5 w-5 text-brand-500" aria-hidden="true" />
                Así de simple
              </h2>
              <ol className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {(STEPS || []).map((label, i) => {
                  const Icon = STEP_ICONS[i] || Check;
                  return (
                    <Reveal as="li" key={i} delay={i * 0.07} className="h-full">
                      <div className="relative flex h-full flex-col gap-3 rounded-2xl border border-border bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-soft">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="text-sm font-semibold leading-snug text-neutral-900">{label}</span>
                        <span className="absolute right-3 top-3 text-2xl font-bold tabular-nums text-brand-200" aria-hidden="true">{i + 1}</span>
                      </div>
                    </Reveal>
                  );
                })}
              </ol>
            </div>
          </section>

          {/* ───── Catálogo de todos los planes ───── */}
          <section className="pb-20 sm:pb-24">
            <div className="container-page">
              <div className="mb-6 sm:mb-8">
                <h2 className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-neutral-900 sm:text-2xl">
                  <Package className="h-5 w-5 text-brand-500" aria-hidden="true" />
                  Todos los planes
                </h2>
                <p className="mt-1.5 text-sm text-text-secondary">
                  Cada perfil comprado incluye su propio código QR permanente y 2 stickers físicos.
                </p>
              </div>

              {/* Móvil: se desliza de lado · sm+: grilla */}
              <ul className={`-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 pt-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 sm:pt-0 lg:grid-cols-3 ${hideScrollbar}`}>
                {(packages || [])
                  .filter((p) => p && p.is_active !== 0 && p.is_visible !== 0)
                  .map((plan, idx) => (
                    <li
                      key={plan.id || `plan-${idx}`}
                      className="flex w-[86%] flex-none snap-center flex-col rounded-2xl border border-border bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-soft sm:w-auto"
                    >
                      {plan.badge && (
                        <span className="mb-3 inline-block self-start rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-500">
                          {plan.badge}
                        </span>
                      )}
                      <h3 className="mb-1 text-lg font-semibold text-neutral-900">{plan.name || 'Plan'}</h3>
                      <div className="mb-3 flex flex-wrap items-baseline gap-x-2">
                        <span className="text-3xl font-extrabold text-neutral-900">{plan.price != null ? formatAmount(plan.price) : 'Consulta precio'}</span>
                        {plan.currency && <span className="text-xs font-medium text-text-secondary">/{plan.currency}</span>}
                      </div>
                      <p className="mb-4 text-sm leading-relaxed text-text-secondary">{plan.description || ''}</p>
                      <ul className="mb-6 flex-1 space-y-2 text-sm text-text-secondary">
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
                      <Link to={isAuthenticated ? routes.dashboardOrders : registerRoute} className="btn-primary min-h-[48px] w-full text-sm">
                        {isAuthenticated ? 'Comprar este paquete' : 'Crear cuenta para comprar'}
                      </Link>
                    </li>
                  ))}
                {(packages || []).length === 0 && (
                  <li className="col-span-full w-full py-10 text-center text-text-secondary">No hay paquetes disponibles en este momento.</li>
                )}
              </ul>
              {(packages || []).length > 1 && (
                <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-text-secondary sm:hidden">
                  Desliza para ver más planes <ChevronsRight className="h-4 w-4 text-brand-500" aria-hidden="true" />
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default Products;