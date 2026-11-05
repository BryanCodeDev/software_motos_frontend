import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button, Input, Label } from '../../components/ui';
import Modal from '../../components/Modal';
import { PageTitle, PageLoader, EmptyState, CheckField } from '../../components/DashPage';
import {
  Trash2, Save, Pencil, Users, Phone as PhoneIcon, Mail as MailIcon, Eye, EyeOff, User, Heart,
  X, Loader2, ScanLine, HeartPulse, AlertTriangle, UserPlus,
} from 'lucide-react';
import { Badge } from '../../components/ui-kit';

/* ───────── Constantes de diseño (alineadas con Home) ───────── */
const EASE = [0.22, 1, 0.36, 1];
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
const iconCls = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary';
const inputCls = 'h-11 pl-10 text-base sm:text-sm';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

const emptyForm = {
  name: '',
  relationship: '',
  phone: '',
  email: '',
  is_public: false,
  display_phone: false,
  display_email: false,
};

const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;

/* ───────── Vista previa de lo que verá quien escanea ───────── */
const PublicPreview = ({ contacts }) => {
  const visible = contacts.filter((c) => c.is_public);
  return (
    <section className={`${panel} overflow-hidden`} aria-labelledby="preview-title">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
          <ScanLine size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 id="preview-title" className="text-base font-semibold text-neutral-900">Vista pública</h2>
          <p className="text-xs text-text-secondary">Esto es lo que verá quien escanee tu QR.</p>
        </div>
      </div>

      <div className="relative bg-brand-50/60 p-4 sm:p-6">
        <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-border bg-white shadow-card">
          <div className="gradient-brand flex items-center gap-2 px-4 py-3 text-white">
            <HeartPulse size={16} aria-hidden="true" />
            <span className="text-sm font-semibold">Contactos de emergencia</span>
          </div>

          {visible.length === 0 ? (
            <div className="flex items-start gap-3 p-4 text-xs leading-relaxed text-text-secondary">
              <AlertTriangle size={16} className="mt-0.5 flex-none text-amber-600" aria-hidden="true" />
              <p>
                Ningún contacto es público todavía. Quien te auxilie no sabrá a quién llamar.
                Marca al menos uno como público.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              <AnimatePresence initial={false}>
                {visible.map((c) => {
                  const showPhone = c.display_phone && c.phone;
                  const showEmail = c.display_email && c.email;
                  return (
                    <motion.li
                      key={c.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-4">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">
                          {c.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-900">{c.name}</p>
                          {c.relationship && <p className="truncate text-xs text-text-secondary">{c.relationship}</p>}
                          {!showPhone && !showEmail && (
                            <p className="text-[11px] text-amber-700">Sin datos de contacto visibles</p>
                          )}
                          {showEmail && <p className="truncate text-xs text-text-secondary">{c.email}</p>}
                        </div>
                        {showPhone && (
                          <span className="inline-flex flex-none items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white">
                            <PhoneIcon size={13} aria-hidden="true" /> Llamar
                          </span>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

/* ───────── Página ───────── */
export const ContactsPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });
  const formRef = useRef(null);

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const res = await api.get('/contacts');
      setContacts(res.data.contacts || res.data || []);
    } catch {
      // se conserva la lista actual
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(loadContacts, 0);
    return () => clearTimeout(t);
  }, [loadContacts]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.display_phone && !form.phone.trim()) {
      toast.error('Agrega un teléfono para poder mostrarlo');
      return;
    }
    if (form.display_email && !form.email.trim()) {
      toast.error('Agrega un correo para poder mostrarlo');
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      relationship: form.relationship.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    };
    try {
      if (editingId) {
        await api.patch(`/contacts/${editingId}`, payload);
      } else {
        await api.post('/contacts', payload);
      }
      const wasEditing = !!editingId;
      resetForm();
      await loadContacts();
      toast.success(wasEditing ? 'Contacto actualizado' : 'Contacto guardado');
    } catch (error) {
      try {
        showApiError(error);
      } catch (err) {
        toast.error(err?.message || 'No se pudo guardar el contacto');
      }
    } finally {
      setSaving(false);
    }
  };

  const edit = (c) => {
    setForm({
      name: c.name ?? '',
      relationship: c.relationship ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      is_public: !!c.is_public,
      display_phone: !!c.display_phone,
      display_email: !!c.display_email,
    });
    setEditingId(c.id);
    // En pantallas grandes el formulario ya está visible (sticky).
    if (window.innerWidth < 1024) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const confirmRemove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/contacts/${toDelete.id}`);
      if (editingId === toDelete.id) resetForm();
      setToDelete(null);
      await loadContacts();
      toast.success('Contacto eliminado');
    } catch {
      toast.error('No se pudo eliminar el contacto');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;

  const publicCount = contacts.filter((c) => c.is_public).length;
  const editingName = editingId ? contacts.find((c) => c.id === editingId)?.name : null;

  return (
    <MotionConfig reducedMotion="user">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <PageTitle
            title="Contactos de emergencia"
            description="Personas a las que se podrá llamar desde tu página pública de emergencia. Solo se muestran las que marques como públicas."
          />
        </motion.div>

        <div className="grid items-start gap-6 lg:grid-cols-5">
          {/* ───── Formulario ───── */}
          <motion.section
            variants={item}
            ref={formRef}
            aria-labelledby="contact-form-title"
            className={`${panel} scroll-mt-24 overflow-hidden lg:sticky lg:top-24 lg:order-2 lg:col-span-2`}
          >
            <div className={`h-1 w-full transition-colors duration-300 ${editingId ? 'bg-brand-500' : 'bg-brand-500/20'}`} aria-hidden="true" />
            <div className="p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 ring-1 ring-brand-500/15">
                  {editingId ? <Pencil size={18} aria-hidden="true" /> : <UserPlus size={18} aria-hidden="true" />}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 id="contact-form-title" className="text-base font-semibold text-neutral-900">
                    {editingId ? 'Editar contacto' : 'Agregar contacto'}
                  </h2>
                  <p className="truncate text-xs text-text-secondary">
                    {editingId ? `Estás editando a ${editingName || 'este contacto'}.` : 'Añade a una persona de confianza.'}
                  </p>
                </div>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-none rounded-lg p-2 text-text-secondary transition-colors hover:bg-brand-50 hover:text-neutral-900"
                    aria-label="Cancelar edición"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="c_name">Nombre</Label>
                    <div className="relative">
                      <User size={18} className={iconCls} aria-hidden="true" />
                      <Input id="c_name" required autoComplete="off" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="María López" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="c_rel">Relación</Label>
                    <div className="relative">
                      <Heart size={18} className={iconCls} aria-hidden="true" />
                      <Input id="c_rel" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Esposa" className={inputCls} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                    <div>
                      <Label htmlFor="c_phone">Teléfono</Label>
                      <div className="relative">
                        <PhoneIcon size={18} className={iconCls} aria-hidden="true" />
                        <Input id="c_phone" type="tel" inputMode="tel" autoComplete="off" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+57 300 000 0000" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="c_email">Correo</Label>
                      <div className="relative">
                        <MailIcon size={18} className={iconCls} aria-hidden="true" />
                        <Input id="c_email" type="email" autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="maria@ejemplo.com" className={inputCls} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-brand-50/60 p-4">
                  <CheckField
                    id="c_public"
                    checked={form.is_public}
                    onChange={(v) => setForm({ ...form, is_public: v })}
                    label="Mostrar este contacto públicamente"
                    hint="Aparecerá en tu página de emergencia cuando alguien escanee el QR."
                  />
                  <AnimatePresence initial={false}>
                    {form.is_public && (
                      <motion.div
                        key="public-options"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 space-y-3 border-t border-border pl-7 pt-3">
                          <CheckField
                            id="c_dphone"
                            checked={form.display_phone}
                            onChange={(v) => setForm({ ...form, display_phone: v })}
                            label="Mostrar teléfono"
                          />
                          <CheckField
                            id="c_demail"
                            checked={form.display_email}
                            onChange={(v) => setForm({ ...form, display_email: v })}
                            label="Mostrar correo"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {editingId && (
                    <Button type="button" variant="ghost" onClick={resetForm} disabled={saving}>
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Guardando...' : editingId ? 'Actualizar contacto' : 'Agregar contacto'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.section>

          {/* ───── Lista + vista pública ───── */}
          <div className="space-y-6 lg:order-1 lg:col-span-3">
            <motion.section variants={item} className={`${panel} p-5 sm:p-6`} aria-labelledby="contact-list-title">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 id="contact-list-title" className="text-base font-semibold text-neutral-900">Tus contactos</h2>
                {contacts.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="brand" size="md">
                      {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
                    </Badge>
                    <Badge tone={publicCount > 0 ? 'success' : 'warn'} size="md">
                      {publicCount} {publicCount === 1 ? 'público' : 'públicos'}
                    </Badge>
                  </div>
                )}
              </div>

              {contacts.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Aún no tienes contactos"
                  text="Agrega al menos una persona de confianza para que puedan localizarla en una emergencia."
                />
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial>
                    {contacts.map((c, i) => {
                      const shown = [c.display_phone && 'teléfono', c.display_email && 'correo'].filter(Boolean);
                      const isEditing = editingId === c.id;
                      return (
                        <motion.li
                          key={c.id}
                          layout
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -28, transition: { duration: 0.2 } }}
                          transition={{ duration: 0.35, ease: EASE, delay: Math.min(i, 6) * 0.04 }}
                          className={`rounded-xl border p-4 transition-colors duration-200 hover:border-brand-500/30 hover:bg-brand-50/50 ${
                            isEditing ? 'border-brand-500/50 bg-brand-500/5 shadow-soft' : 'border-border bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500 ring-1 ring-brand-500/15">
                              {c.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <p className="truncate text-sm font-semibold text-neutral-900">{c.name}</p>
                                <Badge tone={c.is_public ? 'success' : 'neutral'} size="sm">
                                  {c.is_public ? <Eye size={11} aria-hidden="true" /> : <EyeOff size={11} aria-hidden="true" />}
                                  {c.is_public ? 'Público' : 'Privado'}
                                </Badge>
                                {isEditing && <Badge tone="brand" size="sm">Editando</Badge>}
                              </div>
                              {c.relationship && <p className="mt-0.5 truncate text-xs text-text-secondary">{c.relationship}</p>}
                            </div>
                            <div className="flex flex-none gap-1">
                              <button
                                type="button"
                                onClick={() => edit(c)}
                                className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-brand-50 hover:text-brand-500"
                                aria-label={`Editar ${c.name}`}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setToDelete(c)}
                                className="rounded-lg p-2 text-rose-600 transition-colors hover:bg-rose-50"
                                aria-label={`Eliminar ${c.name}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {(c.phone || c.email) && (
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border pt-3 text-xs text-text-secondary sm:pl-[52px]">
                              {c.phone && (
                                <a href={telHref(c.phone)} className="flex min-w-0 items-center gap-1.5 transition-colors hover:text-brand-500">
                                  <PhoneIcon size={14} className="flex-none" aria-hidden="true" />
                                  <span className="truncate">{c.phone}</span>
                                </a>
                              )}
                              {c.email && (
                                <a href={`mailto:${c.email}`} className="flex min-w-0 items-center gap-1.5 transition-colors hover:text-brand-500">
                                  <MailIcon size={14} className="flex-none" aria-hidden="true" />
                                  <span className="truncate">{c.email}</span>
                                </a>
                              )}
                              {c.is_public && shown.length > 0 && (
                                <span className="font-medium text-brand-500">Visible: {shown.join(' y ')}</span>
                              )}
                            </div>
                          )}
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </motion.section>

            <motion.div variants={item}>
              <PublicPreview contacts={contacts} />
            </motion.div>
          </div>
        </div>

        <Modal isOpen={!!toDelete} onClose={() => (deleting ? null : setToDelete(null))} title="Eliminar contacto">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-rose-50 text-rose-600 ring-1 ring-rose-600/15">
              <Trash2 size={18} aria-hidden="true" />
            </span>
            <p className="text-sm leading-relaxed text-text-secondary">
              ¿Seguro que deseas eliminar a <span className="font-semibold text-neutral-900">{toDelete?.name}</span>?
              Dejará de aparecer en tu página de emergencia. Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmRemove} disabled={deleting}>
              {deleting && <Loader2 size={16} className="animate-spin" />}
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </Modal>
      </motion.div>
    </MotionConfig>
  );
};

export default ContactsPage;