import { Router } from 'express';
import { z } from 'zod';
import { imageController } from '../controllers/imageController.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();
const mongoId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Formato de ID inválido');
const idParams = z.object({ id: mongoId });
const status = z.string().trim().min(1).max(50);
const body = z.object({
  routeId: mongoId.nullable().optional(),
  variantId: mongoId.nullable().optional(),
  categoryId: mongoId.nullable().optional(),
  locationId: mongoId.nullable().optional(),
  guideId: mongoId.nullable().optional(),
  url: z.string().trim().min(1),
  altText: z.string().trim().max(255).optional(),
  position: z.number().int().min(0).optional(),
  isCover: z.boolean().optional(),
  source: z.string().trim().min(1).max(50),
  author: z.string().trim().max(150).nullable().optional(),
  status: status.optional(),
  isActive: z.boolean().optional()
}).strict();

const queryShape = {
  _id: mongoId.optional(),
  slug: z.string().trim().min(1).max(300).optional()
};
const numericFields = new Set(['position']);
const booleanFields = new Set(['isCover', 'isActive']);
// Las query strings se convierten y después se validan con las reglas de cada campo.
for (const [field, schema] of Object.entries(body.shape)) {
  let input = z.string().trim();
  if (numericFields.has(field)) input = input.min(1).transform(Number);
  if (booleanFields.has(field)) input = z.enum(['true', 'false']).transform((value) => value === 'true');
  queryShape[field] = input.pipe(schema).optional();
}

const nonEmpty = (schema) => schema.refine((data) => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});
const schemas = {
  list: z.object({ query: z.object(queryShape).strict() }),
  getById: z.object({ params: idParams }),
  getBySlug: z.object({ params: z.object({ slug: z.string().trim().min(1) }) }),
  create: z.object({ body }),
  update: z.object({ params: idParams, body: nonEmpty(body.partial()) }),
  associations: z.object({ params: idParams, body: nonEmpty(body.pick({
    routeId: true,
    variantId: true,
    categoryId: true,
    locationId: true,
    guideId: true
  }).partial()) }),
  changeIsActive: z.object({
    params: idParams,
    body: z.object({ isActive: z.boolean() }).strict()
  }),
  changeStatus: z.object({
    params: idParams,
    body: z.object({ status }).strict()
  }),
  id: z.object({ params: idParams })
};

router.get('/', validateRequest(schemas.list), imageController.getAll);
router.get('/slug/:slug', validateRequest(schemas.getBySlug), imageController.getBySlug);
router.get('/:id', validateRequest(schemas.getById), imageController.getById);
router.post('/', validateRequest(schemas.create), imageController.create);
router.patch('/:id', validateRequest(schemas.update), imageController.update);
router.patch('/:id/associations', validateRequest(schemas.associations), imageController.updateAssociations);
router.patch('/:id/is-active', validateRequest(schemas.changeIsActive), imageController.changeIsActive);
router.patch('/:id/status', validateRequest(schemas.changeStatus), imageController.changeStatus);
router.patch('/:id/restore', validateRequest(schemas.id), imageController.restoreDelete);
router.delete('/:id', validateRequest(schemas.id), imageController.softDelete);

export default router;
