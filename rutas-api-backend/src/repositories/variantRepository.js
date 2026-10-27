import { Variant } from '../models/Variant.js';
import { Route } from '../models/Route.js';
import { createRepository } from './createRepository.js';

export const variantRepository = createRepository(Variant, ["routeId","name","description","sku","price","currency","capacity","minimumAge","includesTransport","slug","status","isActive"], [
  { path: 'routeId', model: Route, match: { deletedAt: null } }
]);
