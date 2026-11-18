import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../utils/routes';
import api from '../api/client';
import { Card } from '../components/ui';
import { AlertCircle, Check, Image as ImageIcon, Package, QrCode, ShieldCheck, Sticker, Truck } from 'lucide-react';
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
    return `$${amount}`;
  }
};

const EASE = [0.22, 1, 0.36, 1];

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await api.get('/products');
        const list = res.data.products || res.data || [];
        if (!mounted) return;
        setProducts(list);

        const stickerProduct = list.find((p) => p.slug === 'sticker-qr-personalizado');
        if (stickerProduct) {
          const dRes = await api.get('/designs', { params: { product_id: stickerProduct.id } });
          if (!mounted) return;
          setDesigns(dRes.data.designs || []);
        } else {
          setDesigns([]);
        }
      } catch (err) {
        if (!mounted) return;
        if (err.response && err.response.status === 404) {
          setProducts([]);
          setDesigns([]);
        } else {
          setError('No pudimos cargar el catálogo. Inténtalo de nuevo en unos minutos.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  const stickerProduct = useMemo(
    () => products.find((p) => p.slug === 'sticker-qr-personalizado'),
    [products]
  );

  const price = useMemo(() => (stickerProduct ? stickerProduct.price : null), [stickerProduct]);

  const availableDesigns = useMemo(
    () => designs.filter((d) => d.is_available === 1 || d.is_available === true),
    [designs]
  );

  const unavailableCount = designs.length - availableDesigns.length;

  if (loading) {
    return (
      <main className="min-h-screen">
        <Seo title="Productos" />
        <PageHeader eyebrow="Productos" title="Nuestros productos" align="center" />
        <div className="container-page flex justify-center pb-24" role="status" aria-label="Cargando catálogo">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <Seo title="Productos" />
        <PageHeader eyebrow="Productos" title="Nuestros productos" align="center" />
        <div className="container-page pb-24">
          <Card className="mx-auto max-w-md p-10 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
            <p className="text-sm text-text-secondary">{error}</p>
          </Card>
        </div>
      </main>
    );
  }

  if (!stickerProduct) {
    return (
      <main className="min-h-screen">
        <Seo title="Productos" />
        <PageHeader eyebrow="Productos" title="Nuestros productos" align="center" />
        <div className="container-page pb-24">
          <Card className="mx-auto max-w-md p-10 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
            <p className="text-sm text-text-secondary">El producto de stickers no está disponible en este momento.</p>
          </Card>
        </div>
      </main>
    );
  }

  const includeItems = [
    { label: '2 stickers físicos personalizados', text: 'Ambos con el mismo diseño que elijas, listos para casco, moto o mochila.' },
    { label: '1 código QR único', text: 'Asociado a tu perfil de emergencia y a tu identificador permanente.' },
    { label: 'Acceso a tu perfil de emergencia', text: 'Página pública con solo la información que autorices compartir.' },
    { label: 'Administración de datos y privacidad', text: 'Edita tu perfil, contactos y qué se ve al escanear, desde tu cuenta.' },
    { label: 'Un mismo diseño para ambos stickers', text: 'No se combinan diseños diferentes en una misma compra.' },
  ];

  const featureItems = [
    { Icon: Sticker, title: 'Vínculo con tu QR', text: 'Cada sticker apunta a tu página pública de emergencia.' },
    { Icon: ShieldCheck, title: 'Sin datos personales en el sticker', text: 'El QR solo contiene un enlace con un código aleatorio.' },
    { Icon: Package, title: 'Sin suscripción', text: 'Pago único por el paquete de dos stickers.' },
    { Icon: Truck, title: 'Envío a domicilio', text: 'Los costos y tiempos de envío se confirman antes de completar el pago.' },
  ];

  const benefitItems = [
    'Quien escanea tu QR no necesita cuenta ni aplicación.',
    'Solo ven los campos que marcaste como públicos en tu privacidad.',
    'Si pierdes un sticker, lo desactivas o lo reemplazas desde tu cuenta.',
    'Tu QR digital sigue siendo gratis desde tu cuenta.',
  ];

  const activationSteps = [
    { label: 'Elige tu diseño', hint: 'Uno de los seis diseños disponibles en tu panel.' },
    { label: 'Confirma el pago', hint: 'Pago único de $30.000 COP por sticker mediante Mercado Pago.' },
    { label: 'Tu QR se activa', hint: 'Al confirmarse el pago, se activa tu identificador permanente.' },
    { label: 'Recibe y pega', hint: 'Dos stickers con tu diseño y QR listos para usar.' },
  ];

  return (
    <main className="min-h-screen">
      <Seo
        title="Tu QR Te Cuida — Stickers QR personalizados"
        description="Paquete de 2 stickers físicos personalizados con el diseño que elijas y tu código QR único de emergencia. Pago único, sin suscripción."
      />
      <PageHeader
        eyebrow="Tu QR Te Cuida"
        title="Stickers QR de emergencia"
        subtitle="Lleva tu código QR siempre a la vista. Elige el diseño de tus stickers, confirma tus datos y recibe el paquete en tu domicilio."
        align="center"
      />

      {/* ───────── Información del producto ───────── */}
      <section className="pb-20">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-10">
              <Reveal>
                <Card className="p-6 lg:p-8">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                      <Package size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">Tu QR Te Cuida — paquete de stickers</h2>
                      <p className="mt-1 text-sm text-text-secondary">Producto físico vinculado a tu perfil de emergencia.</p>
                    </div>
                  </div>
                  <p className="mb-6 leading-relaxed text-text-secondary">
                    Dos stickers físicos personalizados con el diseño que elijas, asociados a tu código QR único y permanente.
                    Quien escanee el código verá tu página de emergencia con solo la información que autorizaste.
                  </p>
                  <dl className="space-y-4">
                    <div className="flex flex-wrap items-start gap-4 text-sm">
                      <span className="font-semibold text-neutral-900">Precio vigente:</span>
                      <span className="font-bold text-neutral-900">{formatAmount(price)}</span>
                      <span className="text-text-secondary"> · pago único, sin suscripción</span>
                    </div>
                  </dl>
                </Card>
              </Reveal>

              <Reveal delay={0.08}>
                <Card className="p-6 lg:p-8">
                  <h2 className="mb-4 text-lg font-bold text-neutral-900">Tu compra incluye</h2>
                  <ul className="space-y-4">
                    {includeItems.map(({ label, text }, i) => (
                      <li key={i} className="flex items-start gap-3.5">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                          <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{label}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-xs leading-relaxed text-text-secondary">
                    Los dos stickers se producen con el mismo diseño seleccionado. No se entregan dos diseños diferentes en una misma compra.
                  </p>
                </Card>
              </Reveal>

              <Reveal delay={0.16}>
                <Card className="p-6 lg:p-8">
                  <h2 className="mb-4 text-lg font-bold text-neutral-900">Características del sticker</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {featureItems.map(({ Icon, title, text }, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15 mt-0.5">
                          <Icon size={16} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Reveal>
            </div>

            <div className="lg:col-span-5 space-y-10">
              <Reveal delay={0.24}>
                <Card className="p-6 lg:p-8">
                  <h2 className="mb-4 text-lg font-bold text-neutral-900">Beneficios del QR personalizado</h2>
                  <ul className="space-y-3 text-sm text-text-secondary">
                    {benefitItems.map((text, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                          <QrCode size={10} aria-hidden="true" />
                        </span>
                        <span className="leading-relaxed">{text}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>

              <Reveal delay={0.32}>
                <Card className="p-6 lg:p-8">
                  <h2 className="mb-4 text-lg font-bold text-neutral-900">Proceso de activación</h2>
                  <ol className="space-y-4">
                    {activationSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-brand-500 bg-white text-brand-500 font-bold text-sm">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{step.label}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{step.hint}</p>
                        </div>
                      </div>
                    ))}
                  </ol>
                </Card>
              </Reveal>

              <Reveal delay={0.4}>
                <div className={`
                  rounded-2xl border border-border bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-6 text-white shadow-glow lg:p-8
                `}>
                  <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-30" />
                  <div className="relative">
                    <h2 className="mb-3 text-xl font-bold sm:text-2xl">Información del producto</h2>
                    <p className="mb-6 leading-relaxed text-white/80">
                      Los stickers QR son un producto físico vinculado a tu perfil de emergencia. Para comprar,
                      ve a tu panel y selecciona &quot;Comprar nuevos stickers&quot;. Allí podrás elegir uno de los seis
                      diseños disponibles y completar el pago de $30.000 COP por sticker.
                    </p>
                    <p className="mb-4 text-sm text-white/70">
                      El catálogo de productos es solo informativo. No se pueden realizar pedidos desde esta página.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Selector de diseños (solo visual) ───────── */}
      <section className="pb-24">
        <div className="container-page">
          <Reveal>
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
                Diseños disponibles
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Seis diseños disponibles. Este catálogo es solo informativo; para comprar, ve a tu panel de usuario.
              </p>
            </div>
          </Reveal>

          {unavailableCount > 0 && (
            <Reveal>
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="status">
                <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                {unavailableCount} diseño no disponible
              </div>
            </Reveal>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((design) => {
              const available = design.is_available === 1 || design.is_available === true;
              return (
                <Reveal key={design.id} delay={Math.min((designs.indexOf(design) % 6) * 0.05, 0.25)}>
                  <div
                    className={`
                      relative flex flex-col items-center rounded-2xl border p-4 lg:p-6 transition-all duration-300
                      ${available
                        ? 'border-border bg-white hover:border-brand-500/40 hover:shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]'
                        : 'border-border border-dashed bg-neutral-50/50 text-text-muted opacity-75'
                    }`}
                  >
                    <div className="relative mb-3">
                      <img
                        src={design.image_url || ''}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        aria-hidden="true"
                        className="w-32 h-32 rounded-xl object-cover bg-neutral-100 object-center shadow-inner"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {!design.image_url && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-neutral-100">
                          <ImageIcon className="mb-1.5 h-10 w-10 text-neutral-400" aria-hidden="true" />
                          <span className="text-[10px] font-medium text-neutral-500 leading-tight text-center px-2">
                            Imagen pendiente
                          </span>
                        </div>
                      )}
                      {!available && (
                        <span className="absolute left-0 top-0 z-10 inline-flex items-center rounded-bl-xl rounded-tr-xl border border-brand-500 bg-brand-900 px-2 py-0.5 text-xs font-bold text-white ring-1 ring-white">
                          No disponible
                        </span>
                      )}
                    </div>
                    <h3 className={`
                      mb-1 font-semibold text-center
                      ${available ? 'text-neutral-900' : 'text-neutral-400'}
                    `}>
                      {design.name}
                    </h3>
                    {design.description && available && (
                      <p className="text-[10px] leading-relaxed text-center text-text-secondary/70 px-2">{design.description}</p>
                    )}
                    {!available && (
                      <p className="mt-1 text-[10px] font-semibold text-center text-rose-600">No disponible para pedir</p>
                    )}
                  </div>
                </Reveal>
              );
            })}
          </div>

          {designs.length === 0 && (
            <Card className="mx-auto max-w-md p-12 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-500" />
              <h3 className="mb-2 text-lg font-semibold text-neutral-900">No hay diseños disponibles</h3>
              <p className="text-sm text-text-secondary">Vuelve más tarde o escríbenos por WhatsApp para un diseño personalizado.</p>
            </Card>
          )}

          <p className="mt-8 text-center text-xs text-text-secondary">
            Catálogo informativo. Para comprar stickers, ve a tu panel de usuario y selecciona &quot;Comprar nuevos stickers&quot;.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Products;
