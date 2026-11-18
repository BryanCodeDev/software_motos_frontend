import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';
import api from '../api/client';
import { Card } from '../components/ui';
import { AlertCircle, ArrowRight, Check, Image as ImageIcon, Package, QrCode, ShieldCheck, Sticker, Truck } from 'lucide-react';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';

const DESIGN_STORAGE_KEY = 'tqtc_selected_design';

const loadSelectedDesign = () => {
  try {
    const raw = localStorage.getItem(DESIGN_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return value && value.designId ? Number(value.designId) : null;
  } catch {
    return null;
  }
};

const saveSelectedDesign = (designId) => {
  try {
    localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify({ designId, updatedAt: Date.now() }));
  } catch {
    // Sin almacenamiento local: la selección vive solo en la sesión actual.
  }
};

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
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [selectedDesignId, setSelectedDesignId] = useState(() => loadSelectedDesign());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [continueBusy, setContinueBusy] = useState(false);
  const [selectError, setSelectError] = useState(null);

  useEffect(() => {
    let mounted = true;
    let productsLoaded = false;

    const load = async () => {
      try {
        const res = await api.get('/products');
        const list = res.data.products || res.data || [];
        if (!mounted) return;
        setProducts(list);
        productsLoaded = true;

        const stickerProduct = list.find((p) => p.slug === 'sticker-qr-personalizado');
        if (stickerProduct) {
          const dRes = await api.get('/designs', { params: { product_id: stickerProduct.id } });
          if (!mounted) return;
          setDesigns(dRes.data.designs || []);
        } else if (!mounted) {
          return;
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

  const selectedDesign = designs.find((d) => d.id === selectedDesignId);

  const isSelectionValid = Boolean(
    selectedDesign && (selectedDesign.is_available === 1 || selectedDesign.is_available === true)
  );

  const handleSelect = (designId) => {
    const design = designs.find((d) => d.id === designId);
    if (!design || (design.is_available !== 1 && design.is_available !== true)) {
      setSelectError('Este diseño no está disponible.');
      return;
    }
    setSelectedDesignId(designId);
    saveSelectedDesign(designId);
    setSelectError(null);
  };

  const handleContinue = async () => {
    setSelectError(null);
    if (!isSelectionValid) {
      setSelectError('Debes elegir un diseño para continuar.');
      return;
    }
    setContinueBusy(true);
    try {
      if (!isAuthenticated) {
        saveSelectedDesign(selectedDesignId);
        window.location.href = `${routes.register}?next=${encodeURIComponent(routes.checkout)}`;
        return;
      }
      window.location.href = routes.checkout;
    } finally {
      setContinueBusy(false);
    }
  };

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
    { label: 'Administración de datos y privacidad', text: 'Edita tu perfil, contactes y qué se ve al escanear, desde tu cuenta.' },
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
    { label: 'Elige tu diseño', hint: 'Uno de los diez diseños disponibles.' },
    { label: 'Confirma envío y pago', hint: 'Datos de contacto, dirección y método de pago.' },
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
                    <h2 className="mb-3 text-xl font-bold sm:text-2xl">¿Listo para pedir tus stickers?</h2>
                    <p className="mb-6 leading-relaxed text-white/80">
                      Elige tu diseño, confirma tus datos de envío y paga con los métodos disponibles.
                    </p>
                    {isAuthenticated ? (
                      <Link to={routes.checkout} className="btn inline-flex bg-white px-6 py-3 text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50">
                        <ArrowRight className="h-4 w-4" /> Ir al resumen de compra
                      </Link>
                    ) : (
                      <>
                        <Link to={routes.login} className="btn inline-flex w-full sm:w-auto bg-white px-6 py-3 text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50 mb-3 sm:mb-0">
                          Iniciar sesión <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link to={routes.register} className="btn inline-flex w-full sm:w-auto border border-white text-white px-6 py-3 shadow-soft hover:bg-white/10">
                          Crear cuenta <ArrowRight className="h-4 w-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Selector de diseños ───────── */}
      <section className="pb-24">
        <div className="container-page">
          <Reveal>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
                  Elige el diseño de tus stickers
                </h2>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    Diez diseños disponibles. Selecciona uno; los dos stickers de tu paquete llevarán ese mismo diseño.
                  </p>
              </div>
              {unavailableCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                  {unavailableCount} diseño no disponible
                </span>
              )}
            </div>
          </Reveal>

          {selectError && (
            <Reveal>
              <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
                <AlertCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                {selectError}
              </div>
            </Reveal>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Diseño de los stickers">
            {designs.map((design) => {
              const selected = selectedDesignId === design.id;
              const available = design.is_available === 1 || design.is_available === true;
              return (
                <Reveal key={design.id} delay={Math.min((designs.indexOf(design) % 6) * 0.05, 0.25)}>
                  <div
                    role="radio"
                    aria-checked={selected}
                    aria-label={`Diseño ${design.name}${available ? '' : ', no disponible'}`}
                    tabIndex={available ? 0 : -1}
                    onClick={() => available && handleSelect(design.id)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && available) {
                        e.preventDefault();
                        handleSelect(design.id);
                      }
                    }}
                    className={`
                      relative flex flex-col items-center rounded-2xl border p-4 lg:p-6 transition-all duration-300
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2
                      ${selected
                        ? 'border-2 border-brand-500 bg-brand-50 shadow-[0_0_0_4px_rgba(159,18,57,0.12)]'
                        : available
                          ? 'border-border bg-white hover:border-brand-500/40 hover:shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]'
                          : 'border-border border-dashed bg-neutral-50/50 text-text-muted opacity-75'
                      }`}
                  >
                    <div className="relative mb-3 group">
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
                      {(!design.image_url || !available) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-neutral-100">
                          <ImageIcon className="mb-1.5 h-10 w-10 text-neutral-400" aria-hidden="true" />
                          <span className="text-[10px] font-medium text-neutral-500 leading-tight text-center px-2">
                            {!design.image_url ? 'Imagen pendiente' : 'No disponible'}
                          </span>
                        </div>
                      )}
                      {selected && (
                        <span className="absolute right-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-soft ring-2 ring-white">
                          <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                          <span className="sr-only">Seleccionado</span>
                        </span>
                      )}
                      {!available && (
                        <span className="absolute left-0 top-0 z-10 inline-flex items-center rounded-bl-xl rounded-tr-xl border border-brand-500 bg-brand-900 px-2 py-0.5 text-xs font-bold text-white ring-1 ring-white">
                          No disponible
                        </span>
                      )}
                    </div>
                    <h3 className={`
                      mb-1 font-semibold text-center
                      ${selected ? 'text-brand-700' : available ? 'text-neutral-900' : 'text-neutral-400'}
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

          {/* ───────── CTA selector ───────── */}
          <Reveal className="mt-12">
            <div className={`
              relative overflow-hidden rounded-2xl border border-border bg-white p-6 lg:p-8 shadow-soft
            `}>
              <div aria-hidden="true" className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/5 blur-3xl" />
              <div className="relative">
                <h3 className="mb-3 text-base font-semibold text-neutral-900 sm:text-lg">
                  {isSelectionValid
                    ? `Diseño seleccionado: ${selectedDesign?.name}`
                    : 'Selecciona un diseño para continuar'
                  }
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-text-secondary sm:mb-0 lg:mb-2">
                  {isSelectionValid
                    ? `Recibirás 2 stickers personalizados con el diseño "${selectedDesign?.name}" y tu código QR único. Precio: ${formatAmount(price)}.`
                    : 'La selección de un diseño es obligatoria antes de pasar al resumen de compra.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={!isSelectionValid || continueBusy}
                    className={`
                      btn w-full sm:w-auto bg-brand-500 text-white px-6 py-3 text-sm font-semibold shadow-soft
                      hover:bg-brand-600 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none
                    `}
                  >
                    {continueBusy ? (
                      <>
                        <ArrowRight size={16} className="animate-spin" aria-hidden="true" />
                        Continuando…
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4" /> Continuar con este diseño
                      </>
                    )}
                  </button>
                  {!isAuthenticated && (
                    <Link
                      to={routes.login}
                      className="btn w-full sm:w-auto outline px-6 py-3 text-sm font-semibold"
                    >
                      Iniciar sesión
                    </Link>
                  )}
                </div>
                {!isSelectionValid && !selectError && (
                  <p className="mt-4 text-xs font-semibold text-rose-600" role="status" aria-live="polite">
                    Debes elegir un diseño para continuar.
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default Products;
