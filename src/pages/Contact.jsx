import React, { useState } from 'react';
import { routes } from '../utils/routes';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Phone, Send, MapPin, ArrowRight } from 'lucide-react';
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
      await api.post('/contact', form);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      toast.success('Mensaje enviado correctamente');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err.message || 'No se pudo enviar el mensaje');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="relative min-h-screen flex items-center py-20">
        <Seo title="Contacto" />
        <div className="container-page text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card className="p-10 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-full bg-brand-accent/10 border border-brand-accent/40 flex items-center justify-center mx-auto mb-5 text-brand-accent">
                <Send size={24} />
              </div>
              <h1 className="text-2xl font-bold text-brand-text mb-3">Mensaje enviado</h1>
              <p className="text-brand-textMuted mb-8 leading-relaxed">
                Gracias por escribirnos. Nuestro equipo revisará tu mensaje y te responderá a la brevedad.
              </p>
              <Link to={routes.home} className="btn-outline">
                Volver al inicio
              </Link>
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
        description="Formulario de contacto y canales de soporte de Tu QR te Cuida."
      />
      <PageHeader
        eyebrow="Contacto"
        title="Estamos para ayudarte"
        subtitle="¿Tienes preguntas sobre la plataforma, tus pedidos o tu cuenta? Escríbenos y te responderemos."
      />

      <section className="pb-20">
        <div className="container-page">
          <div className="grid lg:grid-cols-5 gap-8">
            <Reveal className="lg:col-span-2">
              <Card className="p-7 h-full">
                <h2 className="font-semibold text-brand-text mb-6">Canales de soporte</h2>
                <div className="space-y-6">
                  {channels.map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-4">
                      <span className="w-10 h-10 rounded-lg bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent flex-shrink-0">
                        <Icon className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="text-brand-textMuted text-xs uppercase tracking-wider mb-0.5">{label}</div>
                        {value ? (
                          href ? (
                            <a href={href} className="text-brand-text text-sm hover:text-brand-accent transition-colors">
                              {value}
                            </a>
                          ) : (
                            <div className="text-brand-text text-sm">{value}</div>
                          )
                        ) : (
                          <div className="text-brand-textMuted text-sm">Disponible próximamente</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-8 pt-6 border-t border-brand-border text-xs text-brand-textMuted leading-relaxed">
                  Este canal es para soporte de la plataforma. Ante una emergencia, comunícate con los
                  servicios oficiales de emergencia.
                </p>
              </Card>
            </Reveal>

            <Reveal className="lg:col-span-3" delay={0.1}>
              <Card className="p-7">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label>Nombre completo</Label>
                      <Input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Juan Pérez"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Correo electrónico</Label>
                      <Input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="juan@ejemplo.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Asunto</Label>
                    <Input
                      required
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      placeholder="Consulta sobre mi pedido"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mensaje</Label>
                    <textarea
                      required
                      className="input resize-y"
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="Cuéntanos en qué podemos ayudarte"
                    />
                  </div>
                  <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar mensaje'}
                  </Button>
                </form>
              </Card>
            </Reveal>
          </div>

          <Reveal className="mt-12">
            <Link to={routes.faq} className="btn-outline">
              Ver preguntas frecuentes <ArrowRight className="w-4 h-4" />
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
};

export default Contact;
