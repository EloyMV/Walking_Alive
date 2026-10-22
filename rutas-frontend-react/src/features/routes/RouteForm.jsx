import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { routeSchema } from './routeSchema';

export default function RouteForm({
  initialValues = {},
  onSubmit,
  submitLabel = 'Guardar',
  submitting = false
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      title: initialValues.title ?? '',
      location: initialValues.location ?? '',
      distanceKm: initialValues.distanceKm ?? '',
      difficulty: initialValues.difficulty ?? 'moderada',
      description: initialValues.description ?? ''
    }
  });
  const description = watch('description') || '';

  return (
    <form className="card form-card" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-grid">
        <label>
          <span>Título *</span>
          <input {...register('title')} maxLength={120} placeholder="Ruta del Cares" aria-invalid={Boolean(errors.title)} />
          {errors.title && <small className="field-error">{errors.title.message}</small>}
        </label>
        <label>
          <span>Ubicación *</span>
          <input {...register('location')} maxLength={100} placeholder="Picos de Europa" aria-invalid={Boolean(errors.location)} />
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
        <label className="full-width">
          <span>Descripción</span>
          <textarea {...register('description')} maxLength={500} rows="6" placeholder="Describe la ruta..." aria-invalid={Boolean(errors.description)} />
          <small className="counter">{description.length}/500</small>
          {errors.description && <small className="field-error">{errors.description.message}</small>}
        </label>
      </div>
      <div className="form-actions">
        <button className="button" disabled={submitting}>{submitting ? 'Guardando…' : submitLabel}</button>
      </div>
    </form>
  );
}
