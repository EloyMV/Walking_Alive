import { Router } from 'express';
import { z } from 'zod';
import { guideController } from '../controllers/guideController.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();
const mongoId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Formato de ID inválido');
const idParams = z.object({ id: mongoId });
const status = z.string().trim().min(1).max(50);
const body = z.object({
  userId: mongoId,
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(10000).optional(),
  email: z.string().trim().min(1).max(150).toLowerCase(),
  phone: z.string().trim().max(30).nullable().optional(),
  licenseNumber: z.string().trim().min(1).max(100),
  specialty: z.string().trim().max(150).optional(),
  imageUrl: z.string().trim().nullable().optional(),
  status: status.optional(),
  isActive: z.boolean().optional()
}).strict();

const queryShape = {
  _id: mongoId.optional(),
  slug: z.string().trim().min(1).max(300).optional()
};
const numericFields = new Set([]);
const booleanFields = new Set(["isActive"]);
// Las query strings se convierten y después se validan con las reglas de cada campo.
for (const [field, schema] of Object.entries(body.shape)) {
  if (field === 'imageUrl') continue;
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
    userId: true
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

router.get('/', validateRequest(schemas.list), guideController.getAll);
router.get('/slug/:slug', validateRequest(schemas.getBySlug), guideController.getBySlug);
router.get('/:id', validateRequest(schemas.getById), guideController.getById);
router.post('/', validateRequest(schemas.create), guideController.create);
router.patch('/:id', validateRequest(schemas.update), guideController.update);
router.patch('/:id/associations', validateRequest(schemas.associations), guideController.updateAssociations);
router.patch('/:id/is-active', validateRequest(schemas.changeIsActive), guideController.changeIsActive);
router.patch('/:id/status', validateRequest(schemas.changeStatus), guideController.changeStatus);
router.patch('/:id/restore', validateRequest(schemas.id), guideController.restoreDelete);
router.delete('/:id', validateRequest(schemas.id), guideController.softDelete);

export default router;
