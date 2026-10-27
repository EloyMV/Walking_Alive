import { Image } from '../models/Image.js';
import { Route } from '../models/Route.js';
import { Variant } from '../models/Variant.js';
import { Category } from '../models/Category.js';
import { Location } from '../models/Location.js';
import { Guide } from '../models/Guide.js';
import { createRepository } from './createRepository.js';

export const imageRepository = createRepository(Image, ["routeId","variantId","categoryId","locationId","guideId","url","altText","position","isCover","source","author","slug","status","isActive"], [
  { path: 'routeId', model: Route, match: { deletedAt: null } },
  { path: 'variantId', model: Variant, match: { deletedAt: null } },
  { path: 'categoryId', model: Category, match: { deletedAt: null } },
  { path: 'locationId', model: Location, match: { deletedAt: null } },
  { path: 'guideId', model: Guide, match: { deletedAt: null } }
]);
