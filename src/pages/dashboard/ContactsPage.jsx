import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { routes } from '../../utils/routes';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button, Input, Label } from '../../components/ui';
import Modal from '../../components/Modal';
import { PageTitle, PageLoader, EmptyState, CheckField } from '../../components/DashPage';
import {
  Trash2, Save, Pencil, Users, Phone as PhoneIcon, Mail as MailIcon, User, Heart,
  Loader2, AlertTriangle, UserPlus, ArrowRight, MessageCircle,
} from 'lucide-react';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
const iconCls = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary';
const inputCls = 'h-11 pl-10 text-base sm:text-sm';

const RELATIONS = ['Madre', 'Padre', 'Pareja', 'Hijo/a', 'Hermano/a', 'Amigo/a', 'Médico/a'];

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

/* Números colombianos de 10 dígitos (3xx...) reciben el prefijo 57 */
const waHref = (phone) => {
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('3')) digits = `57${digits}`;
  return `https://wa.me/${digits}`;
};

const Switch = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className={`flex h-6 w-11 flex-none items-center rounded-full p-0.5 transition-colors focus-ring disabled:opacity-60 ${
      checked ? 'bg-brand-500' : 'bg-slate-300'
    }`}
  >
    <span className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export const ContactsPage = () => {
  const toast = useToast();
  const toastRef = useRef(toast);
  useEffect(() => { toastRef.current = toast; });

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

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

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name ?? '',
      relationship: c.relationship ?? '',
      phone: c.phone ?? '',
      email: c.email ?? '',
      is_public: !!c.is_public,
      display_phone: !!c.display_phone,
      display_email: !!c.display_email,
    });
    setErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Escribe el nombre del contacto.';
    if (!form.phone.trim()) next.phone = 'El teléfono es obligatorio: es lo que usará quien te auxilie.';
    else if (form.phone.replace(/\D/g, '').length < 7) next.phone = 'Revisa el número: parece incompleto.';
    if (form.is_public && form.display_email && !form.email.trim()) next.email = 'Agrega un correo para poder mostrarlo.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      relationship: form.relationship.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
    };
    try {
      if (editingId) {
        await api.patch(`/contacts/${editingId}`, payload);
      } else {
        await api.post('/contacts', payload);
      }
      const wasEditing = !!editingId;
      setFormOpen(false);
      setEditingId(null);
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

  /* Cambia si el contacto se muestra al escanear, sin abrir el formulario */
  const togglePublic = async (c) => {
    const makingPublic = !c.is_public;
    const showPhoneByDefault = makingPublic && !c.display_phone && !c.display_email && !!c.phone;
    setTogglingId(c.id);
    try {
      await api.patch(`/contacts/${c.id}`, {
        name: c.name,
        relationship: c.relationship ?? '',
        phone: c.phone ?? '',
        email: c.email ?? null,
        is_public: makingPublic,
        display_phone: showPhoneByDefault ? true : !!c.display_phone,
        display_email: !!c.display_email,
      });
      await loadContacts();
    } catch {
      toastRef.current.error('No se pudo cambiar la visibilidad');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmRemove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/contacts/${toDelete.id}`);
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

  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <PageTitle title="Contactos de emergencia" description="A quién llamará quien te auxilie." />

      {contacts.length === 0 ? (
        <div className={`${panel} p-6 lg:p-8`}>
          <EmptyState icon={Users} title="Aún no tienes contactos" text="Agrega al menos una persona de confianza.">
            <Button type="button" variant="primary" onClick={openNew}>
              <UserPlus size={16} /> Agregar contacto
            </Button>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-text-secondary">
              {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}, {publicCount}{' '}
              {publicCount === 1 ? 'visible' : 'visibles'} al escanear
            </p>
            <Button type="button" variant="primary" onClick={openNew}>
              <UserPlus size={16} /> Agregar contacto
            </Button>
          </div>

          {publicCount === 0 && (
            <p className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="status">
              <AlertTriangle size={16} className="mt-0.5 flex-none" aria-hidden="true" />
              Ningún contacto es visible. Activa al menos uno para que sepan a quién llamar.
            </p>
          )}

          <ul className="grid gap-3 lg:grid-cols-2">
            {contacts.map((c) => {
              const shown = [c.display_phone && c.phone && 'teléfono', c.display_email && c.email && 'correo'].filter(Boolean);
              return (
                <li key={c.id} className={`${panel} flex flex-col p-4 sm:p-5`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">
                      {c.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">{c.name}</p>
                      {c.relationship && <p className="truncate text-xs text-text-secondary">{c.relationship}</p>}
                    </div>
                  </div>

                  {(c.phone || c.email) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.phone && (
                        <>
                          <a href={telHref(c.phone)} className="btn-outline px-3 py-1.5 text-xs">
                            <PhoneIcon size={13} aria-hidden="true" /> {c.phone}
                          </a>
                          <a href={waHref(c.phone)} target="_blank" rel="noopener noreferrer" className="btn-outline px-3 py-1.5 text-xs" aria-label={`WhatsApp a ${c.name}`}>
                            <MessageCircle size={13} aria-hidden="true" /> WhatsApp
                          </a>
                        </>
                      )}
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="btn-outline min-w-0 px-3 py-1.5 text-xs">
                          <MailIcon size={13} className="flex-none" aria-hidden="true" />
                          <span className="truncate">{c.email}</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="min-w-0 text-xs text-text-secondary">
                      {!c.is_public
                        ? 'Oculto al escanear'
                        : shown.length > 0
                          ? `Se muestra: ${shown.join(' y ')}`
                          : 'Visible, pero sin datos de contacto. Edítalo para elegir cuáles.'}
                    </p>
                    <Switch
                      checked={!!c.is_public}
                      onChange={() => togglePublic(c)}
                      disabled={togglingId === c.id}
                      label={`${c.name}: ${c.is_public ? 'visible al escanear' : 'oculto'}`}
                    />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => openEdit(c)} className="btn-outline flex-1 px-3 py-2 text-xs" aria-label={`Editar ${c.name}`}>
                      <Pencil size={14} aria-hidden="true" /> Editar
                    </button>
                    <button type="button" onClick={() => setToDelete(c)} className="btn-outline px-3 py-2 text-xs !text-rose-700 hover:!bg-rose-50" aria-label={`Eliminar ${c.name}`}>
                      <Trash2 size={14} aria-hidden="true" /> Eliminar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-end">
            <Link to={routes.dashboardPrivacy} className="btn-outline px-4 py-2 text-sm">
              Siguiente: privacidad <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </>
      )}

      {/* Agregar o editar */}
      <Modal isOpen={formOpen} onClose={closeForm} title={editingId ? 'Editar contacto' : 'Agregar contacto'}>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="c_name">Nombre</Label>
            <div className="relative">
              <User size={18} className={iconCls} aria-hidden="true" />
              <Input
                id="c_name"
                required
                autoComplete="off"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="María López"
                aria-invalid={errors.name ? 'true' : undefined}
                className={inputCls}
              />
            </div>
            {errors.name && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{errors.name}</p>}
          </div>

          <div>
            <Label htmlFor="c_rel">Relación</Label>
            <div className="relative">
              <Heart size={18} className={iconCls} aria-hidden="true" />
              <Input id="c_rel" value={form.relationship} onChange={(e) => setField('relationship', e.target.value)} placeholder="Esposa" className={inputCls} />
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Relaciones sugeridas">
              {RELATIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setField('relationship', r)}
                  aria-pressed={form.relationship === r}
                  className={`focus-ring rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    form.relationship === r
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : 'border-border bg-white text-text-secondary hover:border-brand-500/40 hover:text-neutral-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="c_phone">Teléfono</Label>
              <div className="relative">
                <PhoneIcon size={18} className={iconCls} aria-hidden="true" />
                <Input
                  id="c_phone"
                  type="tel"
                  inputMode="tel"
                  required
                  autoComplete="off"
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  placeholder="+57 300 000 0000"
                  aria-invalid={errors.phone ? 'true' : undefined}
                  className={inputCls}
                />
              </div>
              {errors.phone && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="c_email">Correo (opcional)</Label>
              <div className="relative">
                <MailIcon size={18} className={iconCls} aria-hidden="true" />
                <Input
                  id="c_email"
                  type="email"
                  autoComplete="off"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  placeholder="maria@ejemplo.com"
                  aria-invalid={errors.email ? 'true' : undefined}
                  className={inputCls}
                />
              </div>
              {errors.email && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{errors.email}</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-brand-50/60 p-4">
            <CheckField
              id="c_public"
              checked={form.is_public}
              onChange={(v) => setField('is_public', v)}
              label="Mostrar al escanear mi QR"
            />
            {form.is_public && (
              <div className="mt-3 space-y-3 border-t border-border pl-7 pt-3">
                <CheckField id="c_dphone" checked={form.display_phone} onChange={(v) => setField('display_phone', v)} label="Mostrar teléfono" />
                <CheckField id="c_demail" checked={form.display_email} onChange={(v) => setField('display_email', v)} label="Mostrar correo" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={closeForm} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Eliminar */}
      <Modal isOpen={!!toDelete} onClose={() => (deleting ? null : setToDelete(null))} title="Eliminar contacto">
        <p className="mb-6 text-sm leading-relaxed text-text-secondary">
          <span className="font-semibold text-neutral-900">{toDelete?.name}</span> dejará de aparecer en tu página de
          emergencia. No se puede deshacer.
        </p>
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
    </div>
  );
};

export default ContactsPage;