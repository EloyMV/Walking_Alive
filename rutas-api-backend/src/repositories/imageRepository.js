import { Image } from '../models/Image.js';
import { Route } from '../models/Route.js';
import { Variant } from '../models/Variant.js';
import { Category } from '../models/Category.js';
import { Location } from '../models/Location.js';
import { Guide } from '../models/Guide.js';
import { createRepository } from './createRepository.js';
import { AppError } from '../utils/app-error.js';

export const imageRepository = createRepository(Image, ["routeId","variantId","categoryId","locationId","guideId","url","altText","position","isCover","source","author","slug","status","isActive"], [
  { path: 'routeId', model: Route, match: { deletedAt: null } },
  { path: 'variantId', model: Variant, match: { deletedAt: null } },
  { path: 'categoryId', model: Category, match: { deletedAt: null } },
  { path: 'locationId', model: Location, match: { deletedAt: null } },
  { path: 'guideId', model: Guide, match: { deletedAt: null } }
]);

const entityFields = {
  route: 'routeId',
  variant: 'variantId',
  category: 'categoryId',
  location: 'locationId',
  guide: 'guideId'
};

const getEntityField = (entity) => {
  if (!Object.hasOwn(entityFields, entity)) {
    throw new AppError('Entidad de imagen no válida', 400);
  }
  return entityFields[entity];
};

// Mantiene los IDs sin populate para agrupar imágenes de cualquier entidad en lote.
imageRepository.findActiveByEntityIds = async (entity, ids) => {
  const field = getEntityField(entity);
  return Image.find({ [field]: { $in: ids }, deletedAt: null, isActive: true })
    .sort({ position: 1, _id: 1 });
};

imageRepository.deactivateCoverByEntity = async (entity, id) => {
  const field = getEntityField(entity);
  return Image.updateMany({ [field]: id, isCover: true, deletedAt: null }, { $set: { isActive: false } });
};

imageRepository.upsertCoverByEntity = async (entity, id, url, altText) => {
  const field = getEntityField(entity);
  const cover = await Image.findOne({ [field]: id, isCover: true, deletedAt: null }).sort({ createdAt: 1, _id: 1 });
  if (cover) {
    cover.url = url;
    cover.altText = altText;
    cover.isActive = true;
    await cover.save();
    await Image.updateMany(
      { [field]: id, isCover: true, deletedAt: null, _id: { $ne: cover._id } },
      { $set: { isActive: false } }
    );
    return cover;
  }
  const image = new Image({ [field]: id, url, altText, position: 0, isCover: true, source: 'manual' });
  image.slug = 'portada-' + image._id;
  return image.save();
};

// Conserva el contrato utilizado por RouteService.
imageRepository.findActiveByRouteIds = async (routeIds) =>
  imageRepository.findActiveByEntityIds('route', routeIds);

imageRepository.deactivateCoverByRoute = async (routeId) =>
  imageRepository.deactivateCoverByEntity('route', routeId);

imageRepository.upsertCoverByRoute = async (routeId, url, altText) =>
  imageRepository.upsertCoverByEntity('route', routeId, url, altText);
