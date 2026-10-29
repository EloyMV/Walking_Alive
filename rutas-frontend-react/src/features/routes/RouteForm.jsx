import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { routeSchema } from './routeSchema';
import { getRouteStatus, ROUTE_STATUS_OPTIONS } from './routeStatus';

const relationFields = [
  { name: 'categoryId', label: 'Categoría', collection: 'categories', empty: 'Sin categoría' },
  { name: 'locationId', label: 'Ubicación', collection: 'locations', empty: 'Sin ubicación seleccionada' },
  { name: 'guideId', label: 'Guía', collection: 'guides', empty: 'Sin guía' },
  { name: 'createdByUserId', label: 'Usuario creador', collection: 'users', empty: 'Sin usuario creador' }
];

const getRelationId = (value) => value?._id ?? value ?? '';

function getRelationLabel(value) {
  const name = [value?.name, value?.lastName].filter(Boolean).join(' ');
  const email = value?.email ? ` (${value.email})` : '';
  const inactive = value?.isActive === false ? ' (inactivo/a)' : '';
  return `${name || 'Selección actual'}${email}${inactive}`;
}

export default function RouteForm({
  initialValues = {},
  categories = [],
  locations = [],
  guides = [],
  users = [],
  loadingRelations = false,
  relationsError = false,
  onSubmit,
  submitLabel = 'Guardar',
  submitting = false
}) {
  const relations = { categories, locations, guides, users };
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      title: initialValues.title ?? '',
      location: initialValues.location ?? '',
      categoryId: getRelationId(initialValues.categoryId),
      locationId: getRelationId(initialValues.locationId),
      guideId: getRelationId(initialValues.guideId),
      createdByUserId: getRelationId(initialValues.createdByUserId),
      status: getRouteStatus(initialValues.status),
      isActive: String(initialValues.isActive ?? true),
      distanceKm: initialValues.distanceKm ?? '',
      difficulty: initialValues.difficulty ?? 'moderada',
      description: initialValues.description ?? ''
    }
  });
  const description = watch('description') || '';
  const relationsDisabled = submitting || loadingRelations || Boolean(relationsError);

  return (
    <form className="card form-card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-grid">
        <label>
          <span>Título *</span>
          <input {...register('title')} maxLength={120} placeholder="Ruta del Cares" aria-invalid={Boolean(errors.title)} />
          {errors.title && <small className="field-error">{errors.title.message}</small>}
        </label>
        {relationFields.map(({ name, label, collection, empty }) => {
          const options = relations[collection] || [];
          return (
            <label key={name}>
              <span>{label}</span>
              <Controller
                name={name}
                control={control}
                render={({ field }) => (
                  <select {...field} disabled={relationsDisabled} aria-invalid={Boolean(errors[name])}>
                    <option value="">{loadingRelations ? 'Cargando…' : empty}</option>
                    {field.value && !options.some((option) => option._id === field.value) && (
                      <option value={field.value}>{getRelationLabel(initialValues[name])}</option>
                    )}
                    {options.map((option) => (
                      <option key={option._id} value={option._id}>{getRelationLabel(option)}</option>
                    ))}
                  </select>
                )}
              />
              {!loadingRelations && !relationsError && options.length === 0 && <small className="muted">No hay opciones disponibles.</small>}
              {errors[name] && <small className="field-error">{errors[name].message}</small>}
            </label>
          );
        })}
        <label>
          <span>Ubicación en texto</span>
          <input {...register('location')} maxLength={100} placeholder="Picos de Europa" aria-invalid={Boolean(errors.location)} />
          <small className="muted">Obligatoria si no seleccionas una ubicación del desplegable.</small>
          {errors.location && <small className="field-error">{errors.location.message}</small>}
        </label>
        <label>
          <span>Distancia (km) *</span>
          <input {...register('distanceKm')} type="number" min="0.1" step="0.1" placeholder="12" aria-invalid={Boolean(errors.distanceKm)} />
          {errors.distanceKm && <small className="field-error">{errors.distanceKm.message}</small>}
        </label>
        <label>
          <span>Dificultad *</span>
          <select {...register('difficulty')} aria-invalid={Boolean(errors.difficulty)}>
            <option value="fácil">fácil</option>
            <option value="moderada">moderada</option>
            <option value="difícil">difícil</option>
          </select>
          {errors.difficulty && <small className="field-error">{errors.difficulty.message}</small>}
        </label>
        <label>
          <span>Estado *</span>
          <select {...register('status')} aria-invalid={Boolean(errors.status)}>
            {ROUTE_STATUS_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
          {errors.status && <small className="field-error">{errors.status.message}</small>}
        </label>
        <label>
          <span>Disponibilidad *</span>
          <select {...register('isActive')} aria-invalid={Boolean(errors.isActive)}>
            <option value="true">Disponible</option>
            <option value="false">No disponible</option>
          </select>
          {errors.isActive && <small className="field-error">{errors.isActive.message}</small>}
        </label>
        <label className="full-width">
          <span>Descripción</span>
          <textarea {...register('description')} maxLength={500} rows="6" placeholder="Describe la ruta..." aria-invalid={Boolean(errors.description)} />
          <small className="counter">{description.length}/500</small>
          {errors.description && <small className="field-error">{errors.description.message}</small>}
        </label>
      </div>
      <div className="form-actions">
        <button className="button" disabled={relationsDisabled}>{submitting ? 'Guardando…' : submitLabel}</button>
      </div>
    </form>
  );
}
