import React, { useState } from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Phone, Send, MapPin, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button, Input, Label, Card } from '../components/ui';
import { useToast } from '../components/useToast';
import api from '../api/client';
import { showApiError } from '../utils/errors';
import Seo from '../components/Seo';
import { Reveal, PageHeader } from '../components/Section';

// Datos de contacto configurables mediante variables de entorno de Vite.
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL;
const SUPPORT_PHONE = import.meta.env.VITE_SUPPORT_PHONE;
const SUPPORT_OFFICE = import.meta.env.VITE_SUPPORT_OFFICE;

const channels = [
  { icon: Mail, label: 'Correo de soporte', value: SUPPORT_EMAIL, href: SUPPORT_EMAIL && `mailto:${SUPPORT_EMAIL}` },
  { icon: Phone, label: 'Teléfono', value: SUPPORT_PHONE, href: SUPPORT_PHONE && `tel:${SUPPORT_PHONE.replace(/\s/g, '')}` },
  { icon: MapPin, label: 'Oficina', value: SUPPORT_OFFICE },
];

const topics = ['Mi cuenta', 'Mi QR o sticker', 'Un pedido', 'Privacidad de mis datos', 'Otro tema'];

export const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const toast = useToast();
  const reduce = useReducedMotion();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contacts', form);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      toast.success('Mensaje enviado correctamente');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'No pudimos enviar tu mensaje. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="relative flex min-h-screen items-center py-20">
        <Seo title="Contacto" />
        <div className="container-page text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="mx-auto max-w-md p-10">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-brand-500/40 bg-brand-500/10 text-brand-500">
                <CheckCircle2 size={26} />
              </div>
              <h1 className="mb-3 text-2xl font-bold text-neutral-900">¡Mensaje enviado!</h1>
              <p className="mb-8 leading-relaxed text-text-secondary">
                Gracias por escribirnos. Revisaremos tu mensaje y te responderemos al correo que nos
                dejaste.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link to={routes.home} className="btn-primary">Volver al inicio</Link>
                <Link to={routes.faq} className="btn-outline">Ver preguntas frecuentes</Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Seo
        title="Contacto"
        description="Escríbenos para resolver dudas sobre tu cuenta, tu QR, tus pedidos o la privacidad de tus datos."
      />
      <PageHeader
        eyebrow="Contacto"
        title="Estamos para ayudarte"
        subtitle="¿Dudas sobre tu cuenta, tu QR o tus pedidos? Escríbenos y te respondemos."
      />

      <section className="pb-20">
        <div className="container-page">
          <Reveal>
            <div
              role="note"
              className="mb-8 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p className="leading-relaxed">
                <strong>¿Es una emergencia?</strong> Este canal es solo para soporte de la plataforma.
                Llama de inmediato a los servicios oficiales de emergencia.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-8 lg:grid-cols-5">
            <Reveal className="lg:col-span-2">
              <Card className="h-full p-7">
                <h2 className="mb-6 font-semibold text-neutral-900">Otros canales de soporte</h2>
                <div className="space-y-6">
                  {channels.map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-4">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-brand-500/30 bg-brand-500/10 text-brand-500">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <div className="mb-0.5 text-xs uppercase tracking-wider text-text-secondary">{label}</div>
                        {value ? (
                          href ? (
                            <a href={href} className="text-sm text-neutral-900 transition-colors hover:text-brand-500">
                              {value}
                            </a>
                          ) : (
                            <div className="text-sm text-neutral-900">{value}</div>
                          )
                        ) : (
                          <div className="text-sm text-text-secondary">Disponible próximamente</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 border-t border-border pt-6">
                  <p className="mb-3 text-sm text-text-secondary">¿Quieres una respuesta inmediata?</p>
                  <Link
                    to={routes.faq}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500 transition-colors hover:text-brand-600"
                  >
                    Revisa las preguntas frecuentes <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            </Reveal>

            <Reveal className="lg:col-span-3" delay={0.1}>
              <Card className="p-7">
                <h2 className="mb-1 text-lg font-semibold text-neutral-900">Envíanos un mensaje</h2>
                <p className="mb-6 text-sm text-text-secondary">Todos los campos son obligatorios.</p>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nombre completo</Label>
                      <Input
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Correo electrónico</Label>
                      <Input
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="tucorreo@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Asunto</Label>
                    <Input
                      required
                      list="contact-topics"
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="Elige un tema o escribe el tuyo"
                    />
                    <datalist id="contact-topics">
                      {topics.map((t) => (
                        <option key={t} value={t} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje</Label>
                    <textarea
                      required
                      className="input resize-y"
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Cuéntanos con detalle en qué podemos ayudarte"
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar mensaje'} {!loading && <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Contact;