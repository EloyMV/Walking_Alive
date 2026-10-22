import { Router } from 'express';
import { routeController } from '../controllers/routeController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  changeIsActiveSchema,
  changeStatusSchema,
  createRouteSchema,
  getRouteByIdSchema,
  getRouteBySlugSchema,
  routeIdSchema,
  updateRouteSchema
} from '../middlewares/routeSchemas.js';

const router = Router();

router.get('/', routeController.getRoutes);
router.get('/slug/:slug', validateRequest(getRouteBySlugSchema), routeController.getRouteBySlug);
router.get('/:id', validateRequest(getRouteByIdSchema), routeController.getRouteById);
router.post('/', validateRequest(createRouteSchema), routeController.createRoute);
router.patch('/:id', validateRequest(updateRouteSchema), routeController.updateRoute);
router.patch('/:id/is-active', validateRequest(changeIsActiveSchema), routeController.changeIsActive);
router.patch('/:id/status', validateRequest(changeStatusSchema), routeController.changeStatus);
router.patch('/:id/restore', validateRequest(routeIdSchema), routeController.restoreDelete);
router.delete('/:id', validateRequest(routeIdSchema), routeController.softDelete);

export default router;
