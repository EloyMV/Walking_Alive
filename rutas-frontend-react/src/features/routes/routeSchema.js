import { z } from 'zod';
import { ROUTE_STATUS_VALUES } from './routeStatus';

const relationId = z.preprocess(
  (value) => (value === '' || value === undefined ? null : value),
  z.string().regex(/^[a-fA-F0-9]{24}$/, 'Selecciona una opción válida.').nullable()
);

export const routeSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio.').max(120, 'Máximo 120 caracteres.'),
  location: z.string().trim().max(100, 'Máximo 100 caracteres.').optional()
    .transform((value) => value || undefined),
  categoryId: relationId,
  locationId: relationId,
  guideId: relationId,
  createdByUserId: relationId,
  status: z.enum(ROUTE_STATUS_VALUES, { error: 'Selecciona un estado válido.' }),
  isActive: z.preprocess(
    (value) => (value === 'true' ? true : value === 'false' ? false : value),
    z.boolean({ error: 'Selecciona si la ruta está activa.' })
  ),
  distanceKm: z.preprocess(
    (value) => (value === '' || value === null ? undefined : Number(value)),
    z.number({ error: 'Introduce una distancia válida.' }).min(0.1, 'La distancia debe ser de al menos 0.1 km.')
  ),
  difficulty: z.enum(['fácil', 'moderada', 'difícil'], { error: 'Selecciona una dificultad válida.' }),
  description: z.string().trim().max(500, 'Máximo 500 caracteres.')
}).refine((data) => Boolean(data.location || data.locationId), {
  message: 'Selecciona una ubicación o introduce una ubicación en texto.',
  path: ['locationId']
});
