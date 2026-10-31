import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button, Input, Label } from '../../components/ui';
import Modal from '../../components/Modal';
import { PageTitle, PageLoader, EmptyState, CheckField } from '../../components/DashPage';
import {
  Trash2, Save, Pencil, Users, Phone as PhoneIcon, Mail as MailIcon, Eye, EyeOff, User, Heart,
} from 'lucide-react';
import { Badge, ConfirmDialog } from '../../components/ui-kit';

const panel = 'rounded-2xl border border-brand-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';
const iconCls = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-textMuted';
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

export const ContactsPage = () => {
  const toast = useToast();
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
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/contacts');
        if (!mounted) return;
        setContacts(res.data.contacts || res.data || []);
      } catch (error) {
        if (!mounted) return;
        if (!(error.response && error.response.status === 404)) {
          toast.error('No se pudieron cargar los contactos');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [toast]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    try {
      if (editingId) {
        await api.patch(`/contacts/${editingId}`, payload);
      } else {
        await api.post('/contacts', payload);
      }
      resetForm();
      await loadContacts();
      toast.success('Contacto guardado');
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
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const sorted = contacts.slice();

  return (
    <div className="space-y-6">
      <PageTitle
        title="Contactos de emergencia"
        description="Personas que se podrán contactar desde tu página pública de emergencia. Solo se muestran los que marques como públicos."
      />

      <section ref={formRef} className={`${panel} scroll-mt-24 p-5 sm:p-6 lg:p-8`} aria-labelledby="contact-form-title">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent ring-1 ring-brand-accent/15">
            {editingId ? <Pencil size={18} aria-hidden="true" /> : <Users size={18} aria-hidden="true" />}
          </span>
          <div>
            <h2 id="contact-form-title" className="text-base font-semibold text-brand-text">
              {editingId ? 'Editar contacto' : 'Agregar contacto'}
            </h2>
            <p className="text-xs text-brand-textMuted">
              {editingId ? 'Modifica los datos y guarda los cambios.' : 'Añade a una persona de confianza.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
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
            <div>
              <Label htmlFor="c_phone">Teléfono</Label>
              <div className="relative">
                <PhoneIcon size={18} className={iconCls} aria-hidden="true" />
                <Input id="c_phone" type="tel" autoComplete="off" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+57 300 000 0000" className={inputCls} />
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

          <div className="space-y-3 rounded-xl border border-brand-border bg-brand-dark/60 p-4">
            <CheckField
              id="c_public"
              checked={form.is_public}
              onChange={(v) => setForm({ ...form, is_public: v })}
              label="Mostrar este contacto públicamente"
              hint="Aparecerá en tu página de emergencia cuando alguien escanee el QR."
            />
            {form.is_public && (
              <div className="space-y-3 border-t border-brand-border pl-7 pt-3">
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
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={saving} className="sm:ml-auto">
              <Save size={16} />
              {saving ? 'Guardando...' : editingId ? 'Actualizar contacto' : 'Agregar contacto'}
            </Button>
          </div>
        </form>
      </section>

      <section className={`${panel} p-5 sm:p-6 lg:p-8`} aria-labelledby="contact-list-title">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="contact-list-title" className="text-base font-semibold text-brand-text">Lista de contactos</h2>
          {sorted.length > 0 && (
            <Badge tone="brand" size="md">
              {sorted.length} {sorted.length === 1 ? 'contacto' : 'contactos'}
            </Badge>
          )}
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aún no tienes contactos"
            text="Agrega al menos una persona de confianza para que puedan localizarla en una emergencia."
          />
        ) : (
          <ul className="space-y-3">
            {sorted.map((c) => {
              const shown = [c.display_phone && 'teléfono', c.display_email && 'correo'].filter(Boolean);
              return (
                <li
                  key={c.id}
                  className={`rounded-xl border p-4 transition-colors hover:border-brand-accent/30 hover:bg-brand-dark/50 ${
                    editingId === c.id ? 'border-brand-accent/50 bg-brand-accent/5' : 'border-brand-border bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-brand-accent/10 text-sm font-bold text-brand-accent ring-1 ring-brand-accent/15"
                    >
                      {c.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="truncate text-sm font-semibold text-brand-text">{c.name}</p>
                        <Badge tone={c.is_public ? 'success' : 'neutral'} size="sm">
                          {c.is_public ? <Eye size={11} aria-hidden="true" /> : <EyeOff size={11} aria-hidden="true" />}
                          {c.is_public ? 'Público' : 'Privado'}
                        </Badge>
                      </div>
                      {c.relationship && <p className="mt-0.5 truncate text-xs text-brand-textMuted">{c.relationship}</p>}
                    </div>
                    <div className="flex flex-none gap-1">
                      <button
                        type="button"
                        onClick={() => edit(c)}
                        className="rounded-lg p-2 text-brand-textMuted transition-colors hover:bg-brand-dark hover:text-brand-text"
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
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-brand-border pt-3 text-xs text-brand-textMuted sm:pl-[52px]">
                      {c.phone && (
                        <span className="flex min-w-0 items-center gap-1.5">
                          <PhoneIcon size={14} className="flex-none" aria-hidden="true" />
                          <span className="truncate">{c.phone}</span>
                        </span>
                      )}
                      {c.email && (
                        <span className="flex min-w-0 items-center gap-1.5">
                          <MailIcon size={14} className="flex-none" aria-hidden="true" />
                          <span className="truncate">{c.email}</span>
                        </span>
                      )}
                      {c.is_public && shown.length > 0 && (
                        <span className="text-brand-accent">Visible: {shown.join(' y ')}</span>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Eliminar contacto">
        <p className="mb-6 text-sm leading-relaxed text-brand-textMuted">
          ¿Seguro que deseas eliminar a <span className="font-semibold text-brand-text">{toDelete?.name}</span>?
          Dejará de aparecer en tu página de emergencia. Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToDelete(null)} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmRemove} disabled={deleting}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ContactsPage;
