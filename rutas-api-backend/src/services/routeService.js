import { routeRepository } from '../repositories/routeRepository.js';
import mongoose from 'mongoose';
import { generateSlug } from '../utils/slug.util.js';
import { ServiceError } from '../utils/serviceError.js';

export const routeService = {
  getAllRoutes: async () => {
    return await routeRepository.findAll();
  },

  getRouteById: async (id) => {
    validateObjectId(id);
    const route = await routeRepository.findById(id);
    if (!route) {
      throw createNotFoundError();
    }
    return route;
  },

  createRoute: async (data) => {
    const reservedSlugs = new Set();
    while (true) {
      const slug = await buildUniqueSlug(data?.title, undefined, reservedSlugs);
      try {
        return await routeRepository.create({ ...data, slug });
      } catch (error) {
        if (!isSlugDuplicate(error)) {
          throw error;
        }
        reservedSlugs.add(slug);
      }
    }
  },

  getRouteBySlug: async (slug) => {
    const route = await routeRepository.findBySlug(slug);
    if (!route) {
      throw createNotFoundError();
    }
    return route;
  },

  updateRoute: async (id, data) => {
    validateObjectId(id);

    if (!data || typeof data !== 'object' || !Object.hasOwn(data, 'title')) {
      const route = await routeRepository.update(id, data);
      if (!route) {
        throw createNotFoundError();
      }
      return route;
    }

    const reservedSlugs = new Set();
    while (true) {
      const slug = await buildUniqueSlug(data.title, id, reservedSlugs);
      try {
        const route = await routeRepository.update(id, { ...data, slug });
        if (!route) {
          throw createNotFoundError();
        }
        return route;
      } catch (error) {
        if (!isSlugDuplicate(error)) {
          throw error;
        }
        reservedSlugs.add(slug);
      }
    }
  },

  softDelete: async (id) => {
    validateObjectId(id);
    const route = await routeRepository.softDelete(id);
    if (!route) {
      throw createNotFoundError();
    }
    return route;
  },

  changeIsActive: async (id, isActive) => {
    validateObjectId(id);
    if (typeof isActive !== 'boolean') {
      throw new ServiceError('isActive debe ser un booleano', 400);
    }

    const route = await routeRepository.changeIsActive(id, isActive);
    if (!route) {
      throw createNotFoundError();
    }
    return route;
  },

  changeStatus: async (id, status) => {
    validateObjectId(id);
    if (typeof status !== 'string' || !status.trim()) {
      throw new ServiceError('El estado es obligatorio', 400);
    }

    const route = await routeRepository.changeStatus(id, status.trim());
    if (!route) {
      throw createNotFoundError();
    }
    return route;
  },

  restoreDelete: async (id) => {
    validateObjectId(id);
    const route = await routeRepository.restoreDelete(id);
    if (!route) {
      throw createNotFoundError();
    }
    return route;
  }
};

const buildUniqueSlug = async (title, excludeId, reservedSlugs) => {
  const baseSlug = generateSlug(title);
  for (let suffix = 0; ; suffix += 1) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix}`;
    if (reservedSlugs.has(candidate)) {
      continue;
    }
    if (!(await routeRepository.slugExists(candidate, excludeId))) {
      return candidate;
    }
  }
};

const isSlugDuplicate = (error) =>
  error.code === 11000 && (error.keyPattern?.slug || error.keyValue?.slug);

const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ServiceError('Formato de ID inválido', 400);
  }
};

const createNotFoundError = () => new ServiceError('Ruta no encontrada', 404);
