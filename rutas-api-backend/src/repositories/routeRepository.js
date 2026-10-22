import { Route } from '../models/Route.js';
import { Category } from '../models/Category.js';
import { Location } from '../models/Location.js';
import { Guide } from '../models/Guide.js';
import { User } from '../models/User.js';

const routePopulate = [
  { path: 'categoryId', model: Category, match: { deletedAt: null } },
  { path: 'locationId', model: Location, match: { deletedAt: null } },
  { path: 'guideId', model: Guide, match: { deletedAt: null } },
  {
    path: 'createdByUserId',
    model: User,
    match: { deletedAt: null },
    select: 'name lastName email slug status isActive'
  }
];

const writableFields = [
  'title', 'slug', 'location', 'distanceKm', 'difficulty', 'description',
  'categoryId', 'locationId', 'guideId', 'createdByUserId',
  'durationMinutes', 'startAt', 'recommendedEquipment',
  'minParticipants', 'maxParticipants', 'status', 'isActive'
];
const getWritableData = (data) =>
  Object.fromEntries(
    writableFields
      .filter((field) => data && typeof data === 'object' && Object.hasOwn(data, field))
      .map((field) => [field, data[field]])
  );

export const routeRepository = {
  findAll: async () => {
    const routes = await Route.find({ deletedAt: null }).sort({ createdAt: -1 }).populate(routePopulate);
    return routes;
  },

  findById: async (id) => {
    const route = await Route.findOne({ _id: id, deletedAt: null }).populate(routePopulate);
    return route;
  },

  findBySlug: async (slug) => {
    const route = await Route.findOne({ slug, deletedAt: null }).populate(routePopulate);
    return route;
  },

  create: async (data) => {
    const route = await Route.create(getWritableData(data));
    return route.populate(routePopulate);
  },

  update: async (id, data) => {
    const route = await Route.findOne({ _id: id, deletedAt: null });
    if (!route) {
      return null;
    }

    const writableData = getWritableData(data);
    Object.assign(route, writableData);
    await route.save();
    return route.populate(routePopulate);
  },

  softDelete: async (id) => {
    const route = await Route.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), isActive: false } },
      { new: true }
    ).populate(routePopulate);
    return route;
  },

  changeIsActive: async (id, isActive) => {
    const route = await Route.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { isActive } },
      { new: true, runValidators: true }
    ).populate(routePopulate);
    return route;
  },

  changeStatus: async (id, status) => {
    const route = await Route.findOne({ _id: id, deletedAt: null });
    if (!route) {
      return null;
    }
    route.status = status;
    await route.save();
    return route.populate(routePopulate);
  },

  slugExists: async (slug, excludeId) => {
    const filter = { slug };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const route = await Route.findOne(filter).select('_id').setOptions({ includeDeleted: true });
    return Boolean(route);
  },

  restoreDelete: async (id) => {
    const route = await Route.findOneAndUpdate(
      { _id: id, deletedAt: { $ne: null } },
      { $set: { deletedAt: null, isActive: true } },
      { new: true, runValidators: true, includeDeleted: true }
    ).populate(routePopulate);
    return route;
  }
};
