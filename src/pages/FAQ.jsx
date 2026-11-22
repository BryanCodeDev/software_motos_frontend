import React, { useEffect, useMemo, useState } from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import api from '../api/client';
import { ArrowRight, Mail, ShieldCheck, Package, UserPlus, Search, X, SearchX } from 'lucide-react';
import { Card } from '../components/ui';
import Seo from '../components/Seo';
import { Reveal, PageHeader, Accordion } from '../components/Section';
import { faqs } from '../data/faqs';

const quickLinks = [
  { icon: UserPlus, label: 'Cómo funciona', to: routes.howItWorks },
  { icon: ShieldCheck, label: 'Privacidad y seguridad', to: routes.privacy },
  { icon: Package, label: 'Productos y precios', to: routes.products },
];

// Preguntas adicionales según el estado del usuario.
const loggedOutFaqs = [
  {
    q: '¿Necesito crear cuenta para usar el QR?',
    a: 'No. Quien escanea tu QR no necesita cuenta ni aplicación. Solo tú necesitas una cuenta para administrar tu perfil, tus contactos y tu privacidad.',
  },
  {
    q: '¿El QR digital tiene costo?',
    a: 'No. El QR digital es gratuito una vez que creas tu cuenta. Los stickers físicos tienen un costo único según el paquete que elijas; el valor se confirma antes de pagar.',
  },
];

const loggedInNoQrFaqs = [
  {
    q: '¿Cómo obtengo mi primer QR?',
    a: 'Entra a la página de productos, elige el diseño de tus stickers y confirma el pago. Al aprobarse el pago se genera tu identificador QR permanente y se vincula a tu cuenta.',
  },
  {
    q: '¿El QR tiene costo?',
    a: 'Tu QR digital es gratuito. Solo pagas si quieres los stickers físicos, según el paquete que elijas (pago único, sin suscripción).',
  },
];

const loggedInHasQrFaqs = [
  {
    q: '¿Puedo comprar más stickers con mi mismo QR?',
    a: 'Sí. Cada compra adicional reutiliza tu identificador QR actual; no se genera uno nuevo. Solo elige un nuevo diseño para los stickers.',
  },
  {
    q: '¿Puedo cambiar el diseño sin cambiar mi QR?',
    a: 'Sí. El diseño del sticker es solo una preferencia visual; tu identificador y enlace permanente /e/:identifier nunca cambian.',
  },
  {
    q: '¿Qué hago si pierdo un sticker?',
    a: 'Desactiva el identificador perdido desde tu cuenta para que deje de mostrar tu información, y pide uno nuevo. Tu perfil sigue vinculado a tu cuenta.',
  },
];

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const FAQ = () => {
  const { isAuthenticated } = useAuth();
  const [hasQr, setHasQr] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    const checkQr = async () => {
      if (!isAuthenticated) {
        setHasQr(false);
        return;
      }
      try {
        const { data } = await api.get('/identifiers/my');
        if (!mounted) return;
        setHasQr(!!data?.identifier);
      } catch {
        if (!mounted) return;
        setHasQr(false);
      }
    };
    checkQr();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  // Elegir preguntas adicionales según estado.
  let extraFaqs = [];
  if (!isAuthenticated) {
    extraFaqs = loggedOutFaqs;
  } else if (hasQr === false) {
    extraFaqs = loggedInNoQrFaqs;
  } else {
    extraFaqs = loggedInHasQrFaqs;
  }

  const allFaqs = useMemo(() => [...faqs, ...extraFaqs], [extraFaqs]);

  // Buscador: en el celular es más rápido escribir una palabra que recorrer toda la lista.
  const filtered = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return allFaqs;
    return allFaqs.filter((f) => norm(`${f.q} ${f.a}`).includes(q));
  }, [allFaqs, query]);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  };

  return (
    <main className="min-h-screen">
      <Seo
        title="Preguntas frecuentes"
        description="Respuestas claras sobre el QR de emergencia, tu privacidad, los stickers y los pagos."
        jsonLd={faqJsonLd}
      />
      <PageHeader
        eyebrow="Preguntas frecuentes"
        title="Todo lo que necesitas saber"
        subtitle="Así funciona Tu QR te Cuida, cómo protegemos tu privacidad y qué productos ofrecemos, explicado sin tecnicismos."
      />
      <section className="pb-16 sm:pb-20">
        <div className="container-page">
          <div className="grid items-start gap-8 lg:grid-cols-3 lg:gap-10">
            <div className="lg:col-span-2">
              <Reveal>
                <div className="relative mb-5">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Busca una palabra: QR, pago, privacidad…"
                    aria-label="Buscar en las preguntas frecuentes"
                    className="input !pl-12 !pr-12 !py-3.5 !text-base"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Borrar búsqueda"
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-brand-50 hover:text-brand-500 focus-ring"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className="mb-4 text-xs font-medium text-text-secondary" aria-live="polite">
                  {query ? `${filtered.length} de ${allFaqs.length} preguntas` : `${allFaqs.length} preguntas`}
                </p>
              </Reveal>

              {filtered.length > 0 ? (
                <Accordion key={query} items={filtered} />
              ) : (
                <Card className="p-8 text-center">
                  <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/10 text-brand-500">
                    <SearchX className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="mb-1 font-semibold text-neutral-900">No encontramos esa palabra</p>
                  <p className="mb-5 text-sm text-text-secondary">Prueba con otra o escríbenos tu duda.</p>
                  <Link to={routes.contact} className="btn-primary min-h-[48px]">
                    Contáctanos <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Card>
              )}
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:space-y-6">
              <Reveal>
                <div className="rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-500 p-6 text-white shadow-glow sm:p-7">
                  <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <Mail className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h2 className="mb-2 text-lg font-bold">¿No encuentras tu respuesta?</h2>
                  <p className="mb-5 text-sm leading-relaxed text-white/80">Escríbenos tu duda y te respondemos al correo que nos dejes.</p>
                  <Link to={routes.contact} className="btn min-h-[48px] w-full bg-white px-5 text-sm text-brand-500 hover:bg-brand-50 sm:w-auto">
                    Contáctanos <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <Card className="p-5 sm:p-6">
                  <h2 className="mb-3 text-sm font-semibold text-neutral-900">También te puede interesar</h2>
                  <ul className="space-y-1">
                    {quickLinks.map(({ icon: Icon, label, to }) => (
                      <li key={to}>
                        <Link
                          to={to}
                          className="flex min-h-[48px] items-center gap-3 rounded-lg px-2 text-sm text-text-secondary transition-colors hover:bg-brand-50 hover:text-brand-500"
                        >
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-500/10 text-brand-500">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          {label}
                          <ArrowRight className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

export default FAQ;