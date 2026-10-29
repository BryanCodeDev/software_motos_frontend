import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { showApiError } from '../../utils/errors';
import { useToast } from '../../components/useToast';
import { Button, Input, Label } from '../../components/ui';
import Modal from '../../components/Modal';
import { PageTitle, PageLoader, EmptyState, CheckField } from '../../components/DashPage';
import { Trash2, Save, Pencil, Users, Phone as PhoneIcon, Mail as MailIcon, Eye, EyeOff } from 'lucide-react';

const emptyForm = {
  name: '',
  relationship: '',
  phone: '',
  email: '',
  is_public: false,
  display_phone: false,
  display_email: false,
  priority_order: 0,
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
    return () => {
      mounted = false;
    };
  }, [toast]);

  const reloadContacts = async () => {
    try {
      const res = await api.get('/contacts');
      setContacts(res.data.contacts || res.data || []);
    } catch {
      // se conserva la lista actual
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, priority_order: Number(form.priority_order) || 0 };
    try {
      if (editingId) {
        await api.patch(`/contacts/${editingId}`, payload);
      } else {
        await api.post('/contacts', payload);
      }
      resetForm();
      await reloadContacts();
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
      priority_order: c.priority_order ?? 0,
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
      await reloadContacts();
      toast.success('Contacto eliminado');
    } catch {
      toast.error('No se pudo eliminar el contacto');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader />;

  const sorted = contacts.slice().sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0));

  return (
    <div>
      <PageTitle
        title="Contactos de emergencia"
        description="Personas que se podrán contactar desde tu página pública de emergencia. Solo se muestran los que marques como públicos."
      />

      <div ref={formRef} className="card-static p-6 lg:p-8 mb-8 scroll-mt-24">
        <h2 className="font-semibold text-brand-text mb-5">
          {editingId ? 'Editar contacto' : 'Agregar contacto'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-4 space-y-2">
              <Label htmlFor="c_name">Nombre</Label>
              <Input
                id="c_name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="María López"
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="c_rel">Relación</Label>
              <Input
                id="c_rel"
                value={form.relationship}
                onChange={(e) => setForm({ ...form, relationship: e.target.value })}
                placeholder="Esposa"
              />
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label htmlFor="c_phone">Teléfono</Label>
              <Input
                id="c_phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+57 300 000 0000"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="c_prio">Prioridad</Label>
              <Input
                id="c_prio"
                type="number"
                min="0"
                value={form.priority_order}
                onChange={(e) => setForm({ ...form, priority_order: e.target.value })}
              />
            </div>
            <div className="md:col-span-6 space-y-2">
              <Label htmlFor="c_email">Correo</Label>
              <Input
                id="c_email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="maria@ejemplo.com"
              />
            </div>
          </div>

          <div className="rounded-lg border border-brand-border bg-brand-dark/60 p-4 space-y-3">
            <CheckField
              id="c_public"
              checked={form.is_public}
              onChange={(v) => setForm({ ...form, is_public: v })}
              label="Mostrar este contacto públicamente"
              hint="Aparecerá en tu página de emergencia cuando alguien escanee el QR."
            />
            {form.is_public && (
              <div className="pl-7 space-y-3">
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

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" disabled={saving}>
              <Save size={16} />
              {saving ? 'Guardando...' : editingId ? 'Actualizar contacto' : 'Agregar contacto'}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </div>

      <div className="card-static p-6 lg:p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-brand-text">Lista de contactos</h2>
          {sorted.length > 0 && (
            <span className="text-xs text-brand-textMuted">
              {sorted.length} {sorted.length === 1 ? 'contacto' : 'contactos'}
            </span>
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
            {sorted.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 rounded-lg border border-brand-border hover:border-brand-accent/30 hover:bg-black/[0.03] transition-colors"
              >
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent text-xs font-bold"
                  title="Prioridad"
                >
                  {c.priority_order ?? 0}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-text truncate">{c.name}</p>
                  {c.relationship && <p className="text-xs text-brand-textMuted truncate">{c.relationship}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-textMuted">
                  {c.phone && (
                    <span className="flex items-center gap-1.5">
                      <PhoneIcon size={14} aria-hidden="true" />
                      <span className="truncate max-w-[130px]">{c.phone}</span>
                    </span>
                  )}
                  {c.email && (
                    <span className="flex items-center gap-1.5">
                      <MailIcon size={14} aria-hidden="true" />
                      <span className="truncate max-w-[150px]">{c.email}</span>
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                      c.is_public
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-black/5 text-brand-textMuted border-brand-border'
                    }`}
                  >
                    {c.is_public ? <Eye size={12} /> : <EyeOff size={12} />}
                    {c.is_public ? 'Público' : 'Privado'}
                  </span>
                </div>
                <div className="flex gap-1 ml-auto">
                  <button
                    onClick={() => edit(c)}
                    className="p-2 rounded-lg text-brand-textMuted hover:text-brand-text hover:bg-black/5 transition-colors"
                    aria-label={`Editar ${c.name}`}
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setToDelete(c)}
                    className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                    aria-label={`Eliminar ${c.name}`}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Eliminar contacto">
        <p className="text-sm text-brand-textMuted leading-relaxed mb-6">
          ¿Seguro que deseas eliminar a <span className="text-brand-text font-medium">{toDelete?.name}</span>?
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

