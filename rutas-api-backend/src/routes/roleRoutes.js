import { Router } from 'express';
import { z } from 'zod';
import { roleController } from '../controllers/roleController.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();
const mongoId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Formato de ID inválido');
const idParams = z.object({ id: mongoId });
const status = z.string().trim().min(1).max(50);
const body = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().trim().max(10000).optional(),
  status: status.optional(),
  isActive: z.boolean().optional()
}).strict();

const queryShape = {
  _id: mongoId.optional(),
  slug: z.string().trim().min(1).max(300).optional()
};
// Validar filtros simples y convertir los booleanos de la query explícitamente.
for (const [field, schema] of Object.entries(body.shape)) {
  if (field === 'imageUrl') continue;
  let input = z.string().trim();
  if (field === 'isActive') input = z.enum(['true', 'false']).transform((value) => value === 'true');
  queryShape[field] = input.pipe(schema).optional();
}

const schemas = {
  list: z.object({ query: z.object(queryShape).strict() }),
  getById: z.object({ params: idParams }),
  getBySlug: z.object({ params: z.object({ slug: z.string().trim().min(1) }) }),
  create: z.object({ body }),
  update: z.object({
    params: idParams,
    body: body.partial().refine((data) => Object.keys(data).length > 0, {
      message: 'Debe proporcionar al menos un campo para actualizar'
    })
  }),
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

router.get('/', validateRequest(schemas.list), roleController.getAll);
router.get('/slug/:slug', validateRequest(schemas.getBySlug), roleController.getBySlug);
router.get('/:id', validateRequest(schemas.getById), roleController.getById);
router.post('/', validateRequest(schemas.create), roleController.create);
router.patch('/:id', validateRequest(schemas.update), roleController.update);
router.patch('/:id/is-active', validateRequest(schemas.changeIsActive), roleController.changeIsActive);
router.patch('/:id/status', validateRequest(schemas.changeStatus), roleController.changeStatus);
router.patch('/:id/restore', validateRequest(schemas.id), roleController.restoreDelete);
router.delete('/:id', validateRequest(schemas.id), roleController.softDelete);

export default router;
