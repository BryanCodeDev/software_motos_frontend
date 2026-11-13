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
  Loader2, AlertTriangle, UserPlus, ArrowRight,
} from 'lucide-react';

const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
const iconCls = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary';
const inputCls = 'h-11 pl-10 text-base sm:text-sm';

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
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.is_public && form.display_phone && !form.phone.trim()) {
      toast.error('Agrega un teléfono para poder mostrarlo');
      return;
    }
    if (form.is_public && form.display_email && !form.email.trim()) {
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
        email: c.email ?? '',
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
          <EmptyState
            icon={Users}
            title="Aún no tienes contactos"
            text="Agrega al menos una persona de confianza."
          >
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
            <p className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertTriangle size={16} className="mt-0.5 flex-none" aria-hidden="true" />
              Ningún contacto es visible. Activa al menos uno para que sepan a quién llamar.
            </p>
          )}

          <ul className="space-y-3">
            {contacts.map((c) => {
              const shown = [c.display_phone && c.phone && 'teléfono', c.display_email && c.email && 'correo'].filter(Boolean);
              return (
                <li key={c.id} className={`${panel} p-4 sm:p-5`}>
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">
                      {c.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-900">{c.name}</p>
                      {c.relationship && <p className="truncate text-xs text-text-secondary">{c.relationship}</p>}
                      {(c.phone || c.email) && (
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                          {c.phone && (
                            <a href={telHref(c.phone)} className="flex items-center gap-1.5 hover:text-brand-500">
                              <PhoneIcon size={13} aria-hidden="true" /> {c.phone}
                            </a>
                          )}
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="flex min-w-0 items-center gap-1.5 hover:text-brand-500">
                              <MailIcon size={13} className="flex-none" aria-hidden="true" />
                              <span className="truncate">{c.email}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-none gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
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

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                    <p className="text-xs text-text-secondary">
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="grid gap-4 sm:grid-cols-2">
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

          <div className="rounded-xl border border-border bg-brand-50/60 p-4">
            <CheckField
              id="c_public"
              checked={form.is_public}
              onChange={(v) => setForm({ ...form, is_public: v })}
              label="Mostrar al escanear mi QR"
            />
            {form.is_public && (
              <div className="mt-3 space-y-3 border-t border-border pl-7 pt-3">
                <CheckField id="c_dphone" checked={form.display_phone} onChange={(v) => setForm({ ...form, display_phone: v })} label="Mostrar teléfono" />
                <CheckField id="c_demail" checked={form.display_email} onChange={(v) => setForm({ ...form, display_email: v })} label="Mostrar correo" />
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