import { z } from 'zod';

const mongoId = /^[a-fA-F0-9]{24}$/;
const isBlank = (value) => value === '' || value === null || value === undefined;

function booleanSchema(label) {
  return z.preprocess(
    (value) => value === 'true' ? true : value === 'false' ? false : value,
    z.boolean({ error: `Selecciona una opción válida para ${label.toLowerCase()}.` })
  );
}

function fieldSchema(field, editing) {
  const required = field.required && !(editing && field.editOptional);
  if (field.type === 'checkbox') return booleanSchema(field.label).default(field.defaultValue ?? false);

  if (field.type === 'relation') {
    const id = z.string().regex(mongoId, `Selecciona una opción válida para ${field.label.toLowerCase()}.`);
    if (required) return id;
    return z.preprocess((value) => isBlank(value) ? (field.nullable ? null : undefined) : value,
      field.nullable ? id.nullable().optional() : id.optional());
  }

  if (field.type === 'number' && !field.decimal) {
    let number = z.number({ error: `Introduce un número válido para ${field.label.toLowerCase()}.` });
    if (field.integer) number = number.int(`${field.label} debe ser un número entero.`);
    if (field.min !== undefined) number = number.min(field.min, `El mínimo es ${field.min}.`);
    if (field.max !== undefined) number = number.max(field.max, `El máximo es ${field.max}.`);
    const valueSchema = field.nullable ? number.nullable().optional() : required ? number : number.optional();
    return z.preprocess((value) => isBlank(value) ? (field.nullable ? null : undefined) : typeof value === 'string' ? Number(value) : value, valueSchema);
  }

  if (field.decimal) {
    return z.preprocess(
      (value) => typeof value === 'number' && Number.isFinite(value) ? String(value) : value,
      z.string({ error: 'Introduce un precio válido.' }).trim().regex(/^\d+(\.\d+)?$/, 'El precio debe ser un decimal no negativo.')
    );
  }

  let text = z.string({ error: `${field.label} es obligatorio.` });
  if (field.type !== 'password') text = text.trim();
  if (required) text = text.min(field.minLength ?? 1, field.minLength ? `Mínimo ${field.minLength} caracteres.` : `${field.label} es obligatorio.`);
  if (field.maxLength !== undefined) text = text.max(field.maxLength, `Máximo ${field.maxLength} caracteres.`);
  if (field.lowercase) text = text.toLowerCase();
  if (field.uppercase) text = text.toUpperCase();
  if (field.pattern) text = text.regex(new RegExp(field.pattern), `Introduce un valor válido para ${field.label.toLowerCase()}.`);
  if (field.type === 'select' && field.options?.length) {
    const values = field.options.map(({ value }) => value);
    text = text.refine((value) => values.includes(value), 'Selecciona una opción válida.');
  }
  if (!required && field.nullable) return z.preprocess((value) => isBlank(value) || (typeof value === 'string' && !value.trim()) ? null : value, text.nullable().optional());
  if (!required && field.editOptional) return z.preprocess((value) => value === '' ? undefined : value, text.optional());
  return required ? text : text.optional();
}

export function createEntitySchema(config, { editing = false } = {}) {
  const shape = Object.fromEntries(config.fields.map((field) => [field.name, fieldSchema(field, editing)]));
  return z.object({
    ...shape,
    status: z.string().trim().min(1, 'El estado es obligatorio.').max(50, 'Máximo 50 caracteres.'),
    isActive: booleanSchema('Disponibilidad')
  }).transform((data) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)));
}

export function getEntityDefaultValues(config, initialValues = {}) {
  const values = {};
  for (const field of config.fields) {
    let value = initialValues[field.name];
    if (field.type === 'password') value = '';
    if (field.type === 'relation') value = value?._id ?? value ?? '';
    if (field.decimal && value && typeof value === 'object') value = value.$numberDecimal ?? value.toString();
    if (field.name === 'imageUrl' && value === undefined) value = initialValues.images?.find((image) => image.isCover)?.url;
    values[field.name] = value ?? field.defaultValue ?? (field.type === 'checkbox' ? false : '');
  }
  values.status = initialValues.status ?? config.defaultStatus;
  values.isActive = String(initialValues.isActive ?? true);
  return values;
}
