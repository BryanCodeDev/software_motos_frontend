import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';
import api from '../api/client';
import { Card } from '../components/ui';
import { AlertCircle, Info, ArrowRight } from 'lucide-react';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';
import { PlanCard } from '../components/PlanCard';
import { productPlans, productInfoItems, STICKER_PACK_PRICE } from '../data/products';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    api
      .get('/products')
      .then((res) => setProducts(res.data.products || res.data || []))
      .catch((err) => {
        if (err.response && err.response.status === 404) {
          setProducts([]);
          setError(null);
        } else {
          setError('No pudimos cargar los productos. Inténtalo de nuevo en unos minutos.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen">
        <Seo title="Productos" />
        <PageHeader eyebrow="Productos" title="Nuestros productos" align="center" />
        <div className="container-page flex justify-center pb-24" role="status" aria-label="Cargando productos">
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

  const ctaTitle = 'Lleva tu QR siempre a la vista';
  const ctaText = isAuthenticated
    ? 'Desde tu panel completas tu perfil y pides tus 2 stickers con un pago único de'
    : 'Crea tu cuenta, configura tu perfil y pide tus 2 stickers con un pago único de';

  return (
    <main className="min-h-screen">
      <Seo
        title="Productos"
        description="QR digital gratis y stickers QR de emergencia para motociclistas: 2 stickers por $30.000 COP, o un diseño personalizado por WhatsApp."
      />
      <PageHeader
        eyebrow="Productos"
        title="Elige cómo llevar tu identificación de emergencia"
        subtitle="Empieza gratis con tu QR digital y suma stickers para pegarlos en tu casco, tu moto o donde quieras."
        align="center"
      />

      <section className="pb-20">
        <div className="container-page">
          <div className="mb-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {productPlans.map((p, i) => (
              <Reveal key={p.name} delay={(i % 4) * 0.1}>
                <PlanCard plan={p} isAuthenticated={isAuthenticated} as="h2" />
              </Reveal>
            ))}
          </div>

          {products.length > 0 && (
            <section className="mb-16">
              <Reveal>
                <h2 className="mb-6 text-2xl font-bold text-neutral-900">Disponibles para tu cuenta</h2>
              </Reveal>
              <div className="grid gap-6 md:grid-cols-3">
                {products.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 0.08}>
                    <Card className="flex h-full flex-col p-6">
                      <h3 className="mb-2 font-semibold text-neutral-900">{p.name}</h3>
                      <p className="mb-4 text-sm text-text-secondary">{p.description || ''}</p>
                      <div className="mb-4 mt-auto font-bold text-brand-500">
                        {p.price} {p.currency}
                      </div>
                      <Link to={routes.products} className="btn-outline w-full text-xs">
                        Ver detalles
                      </Link>
                    </Card>
                  </Reveal>
                ))}
              </div>
            </section>
          )}

          <Reveal>
            <Card className="p-8 lg:p-10">
              <h2 className="mb-6 font-semibold text-neutral-900">Antes de elegir, ten en cuenta</h2>
              <ul className="grid gap-4 text-sm text-text-secondary md:grid-cols-2">
                {productInfoItems.map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                      <Info className="h-4 w-4" />
                    </span>
                    <span className="pt-1 leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          <Reveal className="mt-12">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-10 text-center shadow-glow lg:p-14">
              <div className="bg-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
              <div className="relative">
                <h2 className="mb-3 text-2xl font-bold text-white lg:text-3xl">{ctaTitle}</h2>
                <p className="mx-auto mb-7 max-w-md leading-relaxed text-white/80">
                  {ctaText} <span className="font-bold text-white">{STICKER_PACK_PRICE}</span>. Sin suscripción.
                </p>
                <Link
                  to={isAuthenticated ? routes.dashboardQr : routes.register}
                  className="btn inline-flex bg-white px-6 py-3 text-brand-500 shadow-soft hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  {isAuthenticated ? 'Ir a Mi QR' : 'Crear mi cuenta'} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default Products;