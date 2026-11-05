import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { routes } from '../utils/routes';
import { useAuth } from '../contexts/useAuth';
import api from '../api/client';
import { Card } from '../components/ui';
import { AlertCircle, Info, Check, ArrowRight } from 'lucide-react';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';
import { productPlans, productInfoItems } from '../data/products';

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
          setError('No se pudieron cargar los productos. Intenta nuevamente.');
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
          <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
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
          <Card className="p-10 max-w-md mx-auto text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-rose-400" />
            <p className="text-brand-textMuted text-sm">{error}</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Seo
        title="Productos"
        description="QR digital gratuito y sticker QR personalizado de identificación de emergencia."
      />
      <PageHeader
        eyebrow="Productos"
        title="Elige cómo llevar tu identificación de emergencia"
        subtitle="Comienza gratis con tu QR digital y suma un sticker físico personalizado cuando lo necesites."
        align="center"
      />

      <section className="pb-20">
        <div className="container-page">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {productPlans.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.1}>
                <Card className={`p-7 h-full flex flex-col ${p.free ? 'border-brand-accent/40 shadow-glow' : ''}`}>
                  <div className="h-6 mb-3">
                    {p.free && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-[11px] font-semibold uppercase tracking-wider">
                        Más elegido
                      </span>
                    )}
                    {p.coming && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full border border-brand-gold/40 text-brand-gold text-[11px] font-semibold uppercase tracking-wider">
                        Próximamente
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-lg text-brand-text mb-1">{p.name}</h2>
                  <div className="text-2xl font-bold text-brand-text mb-3">{p.price}</div>
                  <p className="text-brand-textMuted text-sm leading-relaxed mb-5">{p.desc}</p>
                  <ul className="space-y-2 mb-7 text-sm text-brand-textMuted">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 text-brand-accent flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    {p.coming ? (
                      <span className="text-xs text-brand-textMuted block">Producto no disponible para compra</span>
                    ) : (
                      <Link to={p.href} className={p.free ? 'btn-primary w-full' : 'btn-outline w-full'}>
                        {p.action}
                      </Link>
                    )}
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>

          {products.length > 0 && (
            <section className="mb-16">
              <Reveal>
                <h2 className="text-2xl font-bold text-brand-text mb-6">Productos disponibles en tu cuenta</h2>
              </Reveal>
              <div className="grid md:grid-cols-3 gap-6">
                {products.map((p, i) => (
                  <Reveal key={p.id} delay={(i % 3) * 0.08}>
                    <Card className="p-6 h-full">
                      <h3 className="font-semibold text-brand-text mb-2">{p.name}</h3>
                      <p className="text-brand-textMuted text-sm mb-4">{p.description || ''}</p>
                      <div className="text-brand-accent font-bold mb-4">
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
              <h2 className="font-semibold text-brand-text mb-5">Información importante</h2>
              <ul className="space-y-3 text-brand-textMuted text-sm">
                {productInfoItems.map((text) => (
                  <li key={text} className="flex items-start gap-3">
                    <Info className="w-4 h-4 mt-0.5 text-brand-accent flex-shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>

          {isAuthenticated ? (
            <Reveal className="mt-12">
              <div className="relative overflow-hidden rounded-2xl border border-brand-accent/30 bg-gradient-to-br from-brand-panel via-brand-navy to-brand-dark p-10 lg:p-14 text-center shadow-glow">
                <h2 className="text-2xl lg:text-3xl font-bold text-brand-text mb-3">
                  Activa tu QR de emergencia
                </h2>
                <p className="text-brand-textMuted mb-7 max-w-md mx-auto leading-relaxed">
                  Desde tu panel puedes completar tu perfil y activar tu QR con un pago único de{' '}
                  <span className="font-bold text-brand-accent">$30.000 COP</span>. Sin suscripción.
                </p>
                <Link to={routes.dashboardQr} className="btn-primary">
                  Ir a Mi QR <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          ) : (
            <Reveal className="mt-12">
              <div className="relative overflow-hidden rounded-2xl border border-brand-accent/30 bg-gradient-to-br from-brand-panel via-brand-navy to-brand-dark p-10 lg:p-14 text-center shadow-glow">
                <h2 className="text-2xl lg:text-3xl font-bold text-brand-text mb-3">
                  Activa tu QR de emergencia
                </h2>
                <p className="text-brand-textMuted mb-7 max-w-md mx-auto leading-relaxed">
                  Crea una cuenta, configura tu perfil y activa tu QR con un pago único de{' '}
                  <span className="font-bold text-brand-accent">$30.000 COP</span>. Sin suscripción.
                </p>
                <Link to={routes.register} className="btn-primary">
                  Crear cuenta <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </main>
  );
};

export default Products;
