import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import api from '../../api/client';
import { useToast } from '../../components/useToast';
import { Input, Label, Textarea } from '../../components/ui';
import { PageTitle, CheckField } from '../../components/DashPage';
import { User, Users, Dog, ArrowLeft, ArrowRight, AlertTriangle, Check, Loader2 } from 'lucide-react';

const PROFILES_PATH = '/panel/perfiles';
const panel = 'rounded-2xl border border-border bg-white shadow-[0_12px_40px_-20px_rgba(159,18,57,0.25)]';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const TYPE_OPTIONS = [
  { value: 'person', label: 'Persona', icon: User, desc: 'Para ti o para otro adulto que usa su propio QR.' },
  { value: 'pet', label: 'Mascota', icon: Dog, desc: 'Para tu perro, gato u otro animal.' },
  { value: 'managed_person', label: 'Persona a mi cargo', icon: Users, desc: 'Un hijo, un adulto mayor o alguien que necesita que lo asistas.' },
];

const STEPS = ['Tipo', 'Lo esencial', 'Detalles'];

/**
 * Campos por tipo de perfil. Para agregar un dato: súmalo aquí y en el backend.
 *  - essential: se pide en el paso 2; el resto va en el paso 3 (opcional).
 *  - none: muestra el atajo "No tengo".
 *  - showIf: solo aparece si se cumple la condición.
 */
const PERSON_FIELDS = [
  { key: 'blood_type', label: 'Tipo de sangre', input: 'select', options: BLOOD_TYPES, essential: true },
  { key: 'allergies', label: 'Alergias', input: 'textarea', placeholder: 'Ej.: penicilina, mariscos', essential: true, none: true, wide: true },
  { key: 'medical_conditions', label: 'Condiciones médicas', input: 'textarea', placeholder: 'Ej.: asma, diabetes, epilepsia', essential: true, none: true, wide: true },
  { key: 'medications', label: 'Medicamentos', input: 'textarea', placeholder: 'Ej.: insulina cada 12 horas', essential: true, none: true, wide: true },
  { key: 'emergency_note', label: 'Nota de emergencia', input: 'textarea', placeholder: 'Lo primero que debe leer quien lo auxilie', essential: true, wide: true },
  { key: 'date_of_birth', label: 'Fecha de nacimiento', input: 'date' },
  { key: 'document_number', label: 'Documento', input: 'text', placeholder: 'Cédula, tarjeta de identidad o pasaporte' },
  { key: 'height_cm', label: 'Estatura (cm)', input: 'number', placeholder: '170' },
  { key: 'weight_kg', label: 'Peso (kg)', input: 'number', placeholder: '70' },
  { key: 'medical_devices', label: 'Dispositivos o implantes', input: 'textarea', placeholder: 'Ej.: marcapasos', wide: true },
  { key: 'primary_doctor_name', label: 'Médico tratante', input: 'text', placeholder: 'Nombre del médico' },
  { key: 'primary_doctor_phone', label: 'Teléfono del médico', input: 'tel', placeholder: '+57 300 000 0000' },
  { key: 'insurance_company', label: 'EPS o aseguradora', input: 'text', placeholder: 'Nombre de la EPS o seguro' },
  { key: 'insurance_policy_number', label: 'Afiliación o póliza', input: 'text', placeholder: 'Número de carnet o póliza' },
  { key: 'is_organ_donor', label: 'Donante de órganos', input: 'checkbox', checkLabel: 'Es donante de órganos' },
  { key: 'is_pregnant', label: 'Embarazo', input: 'checkbox', checkLabel: 'Hay un embarazo en curso' },
  { key: 'additional_info', label: 'Algo más que deban saber', input: 'textarea', placeholder: 'Cualquier dato útil en una emergencia', wide: true },
];

const PET_FIELDS = [
  { key: 'pet_species', label: 'Especie', input: 'select', options: ['Perro', 'Gato', 'Otro'], essential: true, required: true },
  { key: 'pet_breed', label: 'Raza', input: 'text', placeholder: 'Labrador, siamés, criollo…', essential: true },
  { key: 'pet_sex', label: 'Sexo', input: 'select', options: [{ value: 'macho', label: 'Macho' }, { value: 'hembra', label: 'Hembra' }, { value: 'no_especificado', label: 'No especificado' }], essential: true, noEmpty: true },
  { key: 'pet_color', label: 'Color', input: 'text', placeholder: 'Café con blanco', essential: true },
  { key: 'pet_characteristics', label: 'Señas y carácter', input: 'textarea', placeholder: 'Mancha en la oreja, es tímido, no muerde…', essential: true, wide: true },
  { key: 'pet_owner_name', label: 'Nombre del dueño', input: 'text', placeholder: 'Tu nombre', essential: true },
  { key: 'pet_owner_phone', label: 'Teléfono del dueño', input: 'tel', placeholder: '+57 300 000 0000', essential: true, required: true },
  { key: 'pet_microchip', label: 'Microchip', input: 'text', placeholder: 'Número de microchip', essential: true },
  { key: 'pet_age', label: 'Edad', input: 'text', placeholder: '3 años' },
  { key: 'pet_weight', label: 'Peso (kg)', input: 'number', placeholder: '12' },
  { key: 'pet_sterilized', label: 'Esterilización', input: 'checkbox', checkLabel: 'Está esterilizado/a' },
  { key: 'pet_vaccines', label: 'Vacunas', input: 'textarea', placeholder: 'Ej.: rabia al día (marzo 2026)', wide: true },
  { key: 'pet_allergies', label: 'Alergias', input: 'textarea', placeholder: 'Ej.: pollo', wide: true, none: true },
  { key: 'pet_medications', label: 'Medicamentos', input: 'textarea', placeholder: 'Ej.: antiinflamatorio cada 12 horas', wide: true, none: true },
  { key: 'pet_conditions', label: 'Condiciones de salud', input: 'textarea', placeholder: 'Ej.: displasia de cadera', wide: true, none: true },
  { key: 'pet_vet_name', label: 'Veterinario', input: 'text', placeholder: 'Nombre o clínica' },
  { key: 'pet_vet_phone', label: 'Teléfono del veterinario', input: 'tel', placeholder: '+57 300 000 0000' },
  { key: 'pet_alternate_contacts', label: 'Otros contactos', input: 'textarea', placeholder: 'Otra persona que pueda recibirlo si no contestas', wide: true },
  { key: 'pet_care_instructions', label: 'Instrucciones de cuidado', input: 'textarea', placeholder: 'Alimentación, medicación, paseos', wide: true },
  { key: 'pet_lost', label: 'Modo perdido', input: 'checkbox', checkLabel: 'Está perdido ahora mismo' },
  { key: 'pet_reward', label: 'Recompensa (opcional)', input: 'text', placeholder: 'Ej.: $100.000', showIf: (f) => f.pet_lost },
];

const buildInitial = (ownerName) => {
  const base = { display_name: '', relationship: '', consent_accepted: false, pet_owner_name: ownerName || '', pet_sex: 'no_especificado' };
  [...PERSON_FIELDS, ...PET_FIELDS].forEach((f) => {
    if (base[f.key] === undefined) base[f.key] = f.input === 'checkbox' ? false : '';
  });
  return base;
};

/* ───────── Campo genérico ───────── */
const Field = ({ f, value, error, onValue }) => {
  const id = `cp_${f.key}`;
  const empty = String(value ?? '').trim() === '';

  if (f.input === 'checkbox') {
    return (
      <div className="sm:col-span-2">
        <div className="rounded-xl border border-border bg-white p-3.5">
          <CheckField id={id} checked={Boolean(value)} onChange={onValue} label={f.checkLabel} />
        </div>
      </div>
    );
  }

  return (
    <div className={f.wide ? 'sm:col-span-2' : ''}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label htmlFor={id} className="!mb-0">
          {f.label}
          {f.required && <span className="ml-1 text-brand-500" aria-hidden="true">*</span>}
        </Label>
        {f.none && empty && (
          <button
            type="button"
            onClick={() => onValue('Ninguna')}
            className="focus-ring rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-text-secondary transition-colors hover:border-brand-500/40 hover:text-neutral-900"
          >
            No tiene
          </button>
        )}
      </div>

      {f.input === 'textarea' ? (
        <Textarea id={id} rows={3} value={value} onChange={(e) => onValue(e.target.value)} placeholder={f.placeholder} className="text-base sm:text-sm" />
      ) : f.input === 'select' ? (
        <select id={id} value={value} onChange={(e) => onValue(e.target.value)} aria-invalid={error ? 'true' : undefined} className="input h-11">
          {!f.noEmpty && <option value="">Elige una opción</option>}
          {f.options.map((o) => {
            const opt = typeof o === 'string' ? { value: o, label: o } : o;
            return <option key={opt.value} value={opt.value}>{opt.label}</option>;
          })}
        </select>
      ) : (
        <Input
          id={id}
          type={f.input}
          value={value}
          onChange={(e) => onValue(e.target.value)}
          placeholder={f.placeholder}
          aria-invalid={error ? 'true' : undefined}
          className="h-11 text-base sm:text-sm"
        />
      )}
      {error && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{error}</p>}
    </div>
  );
};

const Stepper = ({ current }) => (
  <ol className={`${panel} flex items-center gap-2 p-4 sm:px-6`} aria-label="Pasos para crear el perfil">
    {STEPS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <li key={label} className={`flex items-center gap-2 ${i < STEPS.length - 1 ? 'flex-1' : ''}`} aria-current={active ? 'step' : undefined}>
          <span
            className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold ring-1 ${
              done ? 'bg-brand-500 text-white ring-brand-500' : active ? 'bg-brand-500/10 text-brand-500 ring-2 ring-brand-500/50' : 'bg-white text-text-secondary ring-border'
            }`}
          >
            {done ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : i + 1}
          </span>
          <span className={`hidden text-sm font-semibold sm:inline ${done || active ? 'text-neutral-900' : 'text-text-secondary'}`}>{label}</span>
          {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded-full ${done ? 'bg-brand-500' : 'bg-border'}`} aria-hidden="true" />}
        </li>
      );
    })}
  </ol>
);

const CreateProfilePage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [type, setType] = useState('person');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState(() => buildInitial(user?.name));

  const isPet = type === 'pet';
  const isManaged = type === 'managed_person';
  const typeCfg = TYPE_OPTIONS.find((t) => t.value === type);
  const fields = (isPet ? PET_FIELDS : PERSON_FIELDS).filter((f) => !f.showIf || f.showIf(form));
  const essentials = fields.filter((f) => f.essential);
  const extras = fields.filter((f) => !f.essential);

  const setValue = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (forStep) => {
    const next = {};
    if (forStep === 1) {
      if (!form.display_name.trim()) next.display_name = isPet ? 'Escribe el nombre de la mascota.' : 'Escribe el nombre de la persona.';
      fields.filter((f) => f.essential && f.required).forEach((f) => {
        if (!String(form[f.key] ?? '').trim()) next[f.key] = 'Este dato es obligatorio.';
      });
    }
    if (forStep === 2 && isManaged && !form.consent_accepted) {
      next.consent_accepted = 'Debes confirmar que tienes autorización.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validate(1)) return;
    setStep((s) => Math.min(2, s + 1));
  };

  const submit = async () => {
    if (!validate(1)) { setStep(1); return; }
    if (!validate(2)) { setStep(2); return; }

    /* Solo se envían los campos del tipo elegido, con vacíos como null */
    const payload = {
      profile_type: type,
      display_name: form.display_name.trim(),
      relationship: isPet ? null : form.relationship.trim() || null,
      is_managed_by_third_party: isManaged,
      consent_accepted: isManaged ? form.consent_accepted : false,
    };
    (isPet ? PET_FIELDS : PERSON_FIELDS).forEach((f) => {
      const v = form[f.key];
      payload[f.key] = typeof v === 'boolean' ? v : String(v ?? '').trim() === '' ? null : v;
    });

    setSaving(true);
    try {
      await api.post('/profiles/me/profiles', payload);
      toast.success(`Perfil de ${typeCfg.label.toLowerCase()} creado`);
      navigate(PROFILES_PATH);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'No se pudo crear el perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-5 lg:space-y-6">
      <PageTitle title="Agregar perfil" description="Cada perfil tiene su propio QR. Empieza por lo esencial: el resto lo puedes completar después." />

      <Link to={PROFILES_PATH} className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-neutral-900">
        <ArrowLeft size={16} aria-hidden="true" /> Mis perfiles
      </Link>

      <Stepper current={step} />

      {/* ───── Paso 1: tipo ───── */}
      {step === 0 && (
        <section className={`${panel} p-5 sm:p-6`} aria-labelledby="type-title">
          <h2 id="type-title" className="mb-4 text-base font-semibold text-neutral-900">¿Para quién es este QR?</h2>
          <div role="radiogroup" aria-label="Tipo de perfil" className="grid gap-3 sm:grid-cols-3">
            {TYPE_OPTIONS.map((t) => {
              const active = type === t.value;
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setType(t.value)}
                  className={`focus-ring flex flex-col items-center gap-2 rounded-xl border p-5 text-center transition-colors ${
                    active ? 'border-brand-500 bg-brand-50' : 'border-border bg-white hover:border-brand-500/40'
                  }`}
                >
                  <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${active ? 'bg-brand-500 text-white' : 'bg-brand-500/10 text-brand-500'}`}>
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="font-semibold text-neutral-900">{t.label}</span>
                  <span className="text-xs leading-relaxed text-text-secondary">{t.desc}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={goNext} className="btn-primary px-6 py-2.5 text-sm">
              Continuar <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* ───── Paso 2: lo esencial ───── */}
      {step === 1 && (
        <section className={`${panel} p-5 sm:p-6`} aria-labelledby="essential-title">
          <h2 id="essential-title" className="mb-4 text-base font-semibold text-neutral-900">
            {isPet ? 'Datos de tu mascota' : isManaged ? 'Datos de la persona a tu cargo' : 'Datos de la persona'}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className={isPet ? 'sm:col-span-2' : ''}>
              <Label htmlFor="cp_display_name">
                Nombre<span className="ml-1 text-brand-500" aria-hidden="true">*</span>
              </Label>
              <Input
                id="cp_display_name"
                value={form.display_name}
                onChange={(e) => setValue('display_name')(e.target.value)}
                placeholder={isPet ? 'Ej.: Firulais' : 'Ej.: María Gómez'}
                aria-invalid={errors.display_name ? 'true' : undefined}
                className="h-11 text-base sm:text-sm"
                autoFocus
              />
              {errors.display_name && <p role="alert" className="mt-1.5 text-xs font-medium text-rose-700">{errors.display_name}</p>}
            </div>
            {!isPet && (
              <div>
                <Label htmlFor="cp_relationship">Relación contigo</Label>
                <Input
                  id="cp_relationship"
                  value={form.relationship}
                  onChange={(e) => setValue('relationship')(e.target.value)}
                  placeholder="Ej.: esposa, hijo, mamá"
                  className="h-11 text-base sm:text-sm"
                />
              </div>
            )}
            {essentials.map((f) => (
              <Field key={f.key} f={f} value={form[f.key]} error={errors[f.key]} onValue={setValue(f.key)} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setStep(0)} className="btn-ghost px-4 py-2 text-sm">
              <ArrowLeft size={16} aria-hidden="true" /> Atrás
            </button>
            <div className="flex flex-wrap items-center gap-3">
              {!isManaged && (
                <button type="button" onClick={submit} disabled={saving} className="btn-ghost px-4 py-2 text-sm">
                  Crear sin más detalles
                </button>
              )}
              <button type="button" onClick={goNext} className="btn-primary px-6 py-2.5 text-sm">
                Continuar <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ───── Paso 3: detalles opcionales ───── */}
      {step === 2 && (
        <div className="space-y-5">
          <section className={`${panel} p-5 sm:p-6`} aria-labelledby="extras-title">
            <h2 id="extras-title" className="text-base font-semibold text-neutral-900">Más detalles <span className="text-sm font-normal text-text-secondary">(opcional)</span></h2>
            <p className="mb-4 mt-1 text-sm text-text-secondary">Completa lo que quieras. Qué se muestra al escanear lo decides después.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {extras.map((f) => (
                <Field key={f.key} f={f} value={form[f.key]} error={errors[f.key]} onValue={setValue(f.key)} />
              ))}
            </div>
          </section>

          {isManaged && (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="consent-title">
              <h2 id="consent-title" className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <AlertTriangle size={16} aria-hidden="true" /> Autorización para gestionar datos de otra persona
              </h2>
              <p className="mb-3 mt-2 text-sm leading-relaxed text-amber-800">
                Al crear este perfil declaras que tienes autorización para administrar estos datos. El consentimiento queda registrado con fecha y responsable.
              </p>
              <CheckField
                id="cp_consent"
                checked={form.consent_accepted}
                onChange={setValue('consent_accepted')}
                label="Declaro tener autorización para gestionar los datos de esta persona."
              />
              {errors.consent_accepted && <p role="alert" className="mt-2 text-xs font-medium text-rose-700">{errors.consent_accepted}</p>}
            </section>
          )}

          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={() => setStep(1)} disabled={saving} className="btn-ghost px-4 py-2 text-sm">
              <ArrowLeft size={16} aria-hidden="true" /> Atrás
            </button>
            <button type="button" onClick={submit} disabled={saving} className="btn-primary px-6 py-2.5 text-sm">
              {saving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {saving ? 'Creando…' : 'Crear perfil'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProfilePage;