import { z } from 'zod';

const routeIdParams = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Formato de ID inválido')
});

const routeBody = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(120),
  location: z.string().trim().min(1, 'La ubicación es obligatoria').max(100).optional(),
  distanceKm: z.number().min(0.1, 'La distancia debe ser de al menos 0.1 km'),
  difficulty: z.enum(['fácil', 'moderada', 'difícil']),
  description: z.string().trim().max(500).optional(),
  categoryId: routeIdParams.shape.id.nullable().optional(),
  locationId: routeIdParams.shape.id.nullable().optional(),
  guideId: routeIdParams.shape.id.nullable().optional(),
  createdByUserId: routeIdParams.shape.id.nullable().optional(),
  durationMinutes: z.number().int().min(0).optional(),
  startAt: z.string().datetime({ offset: true }).optional(),
  recommendedEquipment: z.string().trim().max(5000).optional(),
  minParticipants: z.number().int().min(1).optional(),
  maxParticipants: z.number().int().min(1).optional(),
  status: z.string().trim().min(1).max(50).optional(),
  isActive: z.boolean().optional()
}).strict();

export const getRouteByIdSchema = z.object({
  params: routeIdParams
});

export const getRouteBySlugSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1)
  })
});

export const createRouteSchema = z.object({
  body: routeBody.refine((data) => Boolean(data.location || data.locationId), {
    message: 'Debe proporcionar location o locationId',
    path: ['locationId']
  })
});

export const updateRouteSchema = z.object({
  params: routeIdParams,
  body: routeBody.partial().refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos un campo para actualizar'
  })
});

export const changeIsActiveSchema = z.object({
  params: routeIdParams,
  body: z.object({
    isActive: z.boolean()
  }).strict()
});

export const changeStatusSchema = z.object({
  params: routeIdParams,
  body: z.object({
    status: z.string().trim().min(1, 'El estado es obligatorio').max(50)
  }).strict()
});

export const routeIdSchema = z.object({
  params: routeIdParams
});
