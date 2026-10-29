import { Router } from 'express';
import { z } from 'zod';
import { routeController } from '../controllers/routeController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { ROUTE_STATUSES } from '../utils/routeStatus.js';

const routeStatus = z.enum(ROUTE_STATUSES, {
  errorMap: () => ({ message: 'El estado debe ser programado, en curso o finalizado' })
});

const routeIdParams = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Formato de ID inválido')
});

const routeBody = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(120),
  location: z.string().trim().min(1, 'La ubicación es obligatoria').max(100).optional(),
  distanceKm: z.number().min(0.1, 'La distancia debe ser de al menos 0.1 km'),
  difficulty: z.enum(['fácil', 'moderada', 'difícil']),
  imageUrl: z.string().trim().nullable().optional(),
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
  status: routeStatus.optional(),
  isActive: z.boolean().optional()
}).strict();

export const getRouteByIdSchema = z.object({
  params: routeIdParams
});

export const getRoutesSchema = z.object({
  query: z.object({
    categoryId: routeIdParams.shape.id.optional(),
    locationId: routeIdParams.shape.id.optional(),
    guideId: routeIdParams.shape.id.optional(),
    createdByUserId: routeIdParams.shape.id.optional(),
    difficulty: routeBody.shape.difficulty.optional(),
    status: routeBody.shape.status,
    isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
    includeDeleted: z.enum(['true', 'false']).transform((value) => value === 'true').optional()
  }).strict()
});

export const updateRouteAssociationsSchema = z.object({
  params: routeIdParams,
  body: routeBody.pick({
    categoryId: true, locationId: true, guideId: true, createdByUserId: true
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'Debe proporcionar al menos una asociación para actualizar'
  })
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
    status: routeStatus
  }).strict()
});

export const routeIdSchema = z.object({
  params: routeIdParams
});

const router = Router();

router.get('/', validateRequest(getRoutesSchema), routeController.getRoutes);
router.get('/slug/:slug', validateRequest(getRouteBySlugSchema), routeController.getRouteBySlug);
router.get('/:id', validateRequest(getRouteByIdSchema), routeController.getRouteById);
router.post('/', validateRequest(createRouteSchema), routeController.createRoute);
router.patch('/:id', validateRequest(updateRouteSchema), routeController.updateRoute);
router.patch('/:id/associations', validateRequest(updateRouteAssociationsSchema), routeController.updateAssociations);
router.patch('/:id/is-active', validateRequest(changeIsActiveSchema), routeController.changeIsActive);
router.patch('/:id/status', validateRequest(changeStatusSchema), routeController.changeStatus);
router.patch('/:id/restore', validateRequest(routeIdSchema), routeController.restoreDelete);
router.delete('/:id', validateRequest(routeIdSchema), routeController.softDelete);

export default router;
