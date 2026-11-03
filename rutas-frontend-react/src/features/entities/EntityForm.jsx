import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEntitySchema, getEntityDefaultValues } from './entitySchema';
import { relationLabel } from './entityResources';

export default function EntityForm({ config, initialValues = {}, editing = false, relations = {}, relationsLoading = false, relationsError = false, onSubmit, submitting = false }) {
  const { control, register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createEntitySchema(config, { editing })),
    defaultValues: getEntityDefaultValues(config, initialValues)
  });
  const blocked = submitting || relationsLoading || relationsError;
  const relationFields = config.fields.filter(({ type }) => type === 'relation');
  const dataFields = config.fields.filter(({ type }) => type !== 'relation');
  const statusOptions = config.statusOptions.some(({ value }) => value === initialValues.status) || !initialValues.status
    ? config.statusOptions : [...config.statusOptions, { value: initialValues.status, label: initialValues.status }];

  function renderField(field) {
    const attributes = { 'aria-invalid': Boolean(errors[field.name]), maxLength: field.maxLength, placeholder: field.placeholder };
    if (field.type === 'relation') {
      const options = relations[field.relation] || [];
      return <Controller name={field.name} control={control} render={({ field: input }) => (
        <select {...input} id={`${config.key}-${field.name}`} aria-required={Boolean(field.required)} aria-invalid={Boolean(errors[field.name])} disabled={blocked}>
          <option value="">{relationsLoading ? 'Cargando…' : field.required ? 'Selecciona una opción' : 'Sin asociación'}</option>
          {input.value && !options.some((option) => option._id === input.value) && (
            <option value={input.value}>{typeof initialValues[field.name] === 'object' && initialValues[field.name] ? relationLabel(initialValues[field.name]) : 'Selección actual'}</option>
          )}
          {options.map((option) => <option key={option._id} value={option._id}>{relationLabel(option)}</option>)}
        </select>
      )} />;
    }
    if (field.type === 'textarea') return <textarea {...register(field.name)} {...attributes} rows={4} />;
    if (field.type === 'checkbox') return <input {...register(field.name)} type="checkbox" aria-invalid={Boolean(errors[field.name])} />;
    if (field.type === 'select') return <select {...register(field.name)} {...attributes}>{field.options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>;
    return <input {...register(field.name)} {...attributes} type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'} min={field.min} max={field.max} step={field.step ?? 'any'} autoComplete={field.type === 'password' ? 'new-password' : undefined} />;
  }

  function renderLabel(field) {
    return <label key={field.name} htmlFor={field.type === 'relation' ? `${config.key}-${field.name}` : undefined} className={field.type === 'textarea' ? 'full-width' : field.type === 'checkbox' ? 'entity-checkbox-field' : ''}>
        <span>{field.label}{field.required && !(editing && field.editOptional) ? ' *' : ''}</span>
        {renderField(field)}
        {field.help && <small className="muted">{field.help}</small>}
        {field.type === 'relation' && !relationsLoading && !relationsError && !(relations[field.relation] || []).length && <small className="muted">No hay opciones disponibles. Crea primero el registro relacionado.</small>}
        {errors[field.name] && <small className="field-error">{errors[field.name].message}</small>}
      </label>;
  }

  return <form className="card form-card" noValidate onSubmit={handleSubmit(onSubmit)}>
    {relationFields.length > 0 && <fieldset className="form-relations">
      <legend>Relaciones</legend>
      <p className="muted">{editing ? 'Puedes cambiar los registros asociados desde estos desplegables.' : 'Selecciona los registros que quieres asociar.'}</p>
      <div className="form-grid">{relationFields.map(renderLabel)}</div>
    </fieldset>}
    <div className="form-grid">
      {dataFields.map(renderLabel)}
      <label><span>Estado *</span><select {...register('status')} aria-invalid={Boolean(errors.status)}>{statusOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>{errors.status && <small className="field-error">{errors.status.message}</small>}</label>
      <label><span>Disponibilidad *</span><select {...register('isActive')} aria-invalid={Boolean(errors.isActive)}><option value="true">Disponible</option><option value="false">No disponible</option></select>{errors.isActive && <small className="field-error">{errors.isActive.message}</small>}</label>
    </div>
    <div className="form-actions"><button className="button" disabled={blocked}>{submitting ? 'Guardando…' : editing ? 'Guardar cambios' : `Crear ${config.singular}`}</button></div>
  </form>;
}
