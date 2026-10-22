import { z } from 'zod';

export const routeSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio.').max(120, 'Máximo 120 caracteres.'),
  location: z.string().trim().min(1, 'La ubicación es obligatoria.').max(100, 'Máximo 100 caracteres.'),
  distanceKm: z.preprocess(
    (value) => (value === '' || value === null ? undefined : Number(value)),
    z.number({ error: 'Introduce una distancia válida.' }).min(0.1, 'La distancia debe ser de al menos 0.1 km.')
  ),
  difficulty: z.enum(['fácil', 'moderada', 'difícil'], { error: 'Selecciona una dificultad válida.' }),
  description: z.string().trim().max(500, 'Máximo 500 caracteres.')
});
