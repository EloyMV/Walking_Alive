import { Route } from '../models/Route.js';

const writableFields = ['title', 'location', 'distanceKm', 'difficulty', 'description', 'status', 'isActive'];
const getWritableData = (data) =>
  Object.fromEntries(
    writableFields
      .filter((field) => data && typeof data === 'object' && Object.hasOwn(data, field))
      .map((field) => [field, data[field]])
  );

export const routeRepository = {
  findAll: async () => {
    const routes = await Route.find({ deletedAt: null }).sort({ createdAt: -1 });
    return routes;
  },

  findById: async (id) => {
    const route = await Route.findOne({ _id: id, deletedAt: null });
    return route;
  },

  findBySlug: async (slug) => {
    const route = await Route.findOne({ slug, deletedAt: null });
    return route;
  },

  create: async (data) => {
    const route = await Route.create(getWritableData(data));
    return route;
  },

  update: async (id, data) => {
    const route = await Route.findOne({ _id: id, deletedAt: null });
    if (!route) {
      return null;
    }

    const writableData = getWritableData(data);
    Object.assign(route, writableData);
    if (Object.hasOwn(writableData, 'title')) {
      route.slug = data.slug;
    }
    return await route.save();
  },

  softDelete: async (id) => {
    const route = await Route.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), isActive: false } },
      { new: true }
    );
    return route;
  },

  changeIsActive: async (id, isActive) => {
    const route = await Route.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { isActive } },
      { new: true, runValidators: true }
    );
    return route;
  },

  changeStatus: async (id, status) => {
    const route = await Route.findOne({ _id: id, deletedAt: null });
    if (!route) {
      return null;
    }
    route.status = status;
    return await route.save();
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
    );
    return route;
  }
};
