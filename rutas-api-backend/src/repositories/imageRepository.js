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

// Consultas en lote: conservan routeId como ID para agrupar sin cargar la ruta.
imageRepository.findActiveByRouteIds = async (routeIds) =>
  Image.find({ routeId: { $in: routeIds }, deletedAt: null, isActive: true })
    .sort({ position: 1, _id: 1 });

imageRepository.deactivateCoverByRoute = async (routeId) =>
  Image.updateMany({ routeId, isCover: true, deletedAt: null }, { $set: { isActive: false } });

imageRepository.upsertCoverByRoute = async (routeId, url, altText) => {
  const cover = await Image.findOne({ routeId, isCover: true, deletedAt: null }).sort({ createdAt: 1, _id: 1 });
  if (cover) {
    cover.url = url;
    cover.altText = altText;
    cover.isActive = true;
    await cover.save();
    await Image.updateMany(
      { routeId, isCover: true, deletedAt: null, _id: { $ne: cover._id } },
      { $set: { isActive: false } }
    );
    return cover;
  }
  const image = new Image({ routeId, url, altText, position: 0, isCover: true, source: 'manual' });
  image.slug = 'portada-' + image._id;
  return image.save();
};
