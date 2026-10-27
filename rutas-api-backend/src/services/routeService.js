import mongoose from 'mongoose';
import { routeRepository } from '../repositories/routeRepository.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { locationRepository } from '../repositories/locationRepository.js';
import { guideRepository } from '../repositories/guideRepository.js';
import { userRepository } from '../repositories/userRepository.js';
import { generateSlug } from '../utils/slug.util.js';
import { AppError } from '../utils/app-error.js';

class RouteService {
  async createRoute(payload) {
    const data = this.#toRoutePayload(payload);
    this.#validateTitle(data.title);
    if (data.minParticipants === undefined) data.minParticipants = 1;
    if (data.maxParticipants === undefined) data.maxParticipants = 20;
    this.#validateParticipants(data.minParticipants, data.maxParticipants);
    await this.#validate_relations(data);

    const reservedSlugs = new Set();
    while (true) {
      const slug = await this.#buildUniqueSlug(data.title, undefined, reservedSlugs);
      try {
        return await routeRepository.create({ ...data, slug });
      } catch (error) {
        if (!this.#isSlugDuplicate(error)) throw error;
        reservedSlugs.add(slug);
      }
    }
  }

  async getAllRoutes() {
    return routeRepository.findAll();
  }

  async findById(id) {
    this.#validateObjectId(id);
    const route = await routeRepository.findById(id);
    if (!route) throw new AppError('Ruta no encontrada', 404);
    return route;
  }

  async getRouteById(id) {
    return this.findById(id);
  }

  async getRouteBySlug(slug) {
    if (typeof slug !== 'string' || !slug.trim()) {
      throw new AppError('El slug es obligatorio', 400);
    }
    const route = await routeRepository.findBySlug(slug.trim());
    if (!route) throw new AppError('Ruta no encontrada', 404);
    return route;
  }

  async updateRoute(id, payload) {
    const current = await this.findById(id);
    const data = this.#toRoutePayload(payload);
    if (Object.keys(data).length === 0) {
      throw new AppError('Debe proporcionar al menos un campo para actualizar', 400);
    }

    if (Object.hasOwn(data, 'title')) this.#validateTitle(data.title);
    const minParticipants = Object.hasOwn(data, 'minParticipants') ? data.minParticipants : (current.minParticipants ?? 1);
    const maxParticipants = Object.hasOwn(data, 'maxParticipants') ? data.maxParticipants : (current.maxParticipants ?? 20);
    this.#validateParticipants(minParticipants, maxParticipants);
    await this.#validate_relations(data);

    // Si cambia solo uno de los límites, se compara con el valor ya guardado.
    const reservedSlugs = new Set();
    while (true) {
      if (Object.hasOwn(data, 'title')) {
        data.slug = await this.#buildUniqueSlug(data.title, id, reservedSlugs);
      }
      try {
        const updated = await routeRepository.update(id, data);
        if (!updated) throw new AppError('Ruta no encontrada', 404);
        return updated;
      } catch (error) {
        if (!data.slug || !this.#isSlugDuplicate(error)) throw error;
        reservedSlugs.add(data.slug);
      }
    }
  }

  async softDelete(id) {
    this.#validateObjectId(id);
    const route = await routeRepository.softDelete(id);
    if (!route) throw new AppError('Ruta no encontrada', 404);
    return route;
  }

  async changeIsActive(id, isActive) {
    this.#validateObjectId(id);
    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive debe ser un booleano', 400);
    }
    const route = await routeRepository.changeIsActive(id, isActive);
    if (!route) throw new AppError('Ruta no encontrada', 404);
    return route;
  }

  async changeStatus(id, status) {
    this.#validateObjectId(id);
    if (typeof status !== 'string' || !status.trim() || status.trim().length > 50) {
      throw new AppError('El estado debe tener entre 1 y 50 caracteres', 400);
    }
    const route = await routeRepository.changeStatus(id, status.trim());
    if (!route) throw new AppError('Ruta no encontrada', 404);
    return route;
  }

  async restoreDelete(id) {
    this.#validateObjectId(id);
    const route = await routeRepository.restoreDelete(id);
    if (!route) throw new AppError('Ruta no encontrada', 404);
    return route;
  }

  async #validate_relations(payload) {
    const relations = [
      ['categoryId', categoryRepository, 'Categoría'],
      ['locationId', locationRepository, 'Ubicación'],
      ['guideId', guideRepository, 'Guía'],
      ['createdByUserId', userRepository, 'Usuario creador']
    ];
    for (const [field, repository, label] of relations) {
      if (!Object.hasOwn(payload, field) || payload[field] === null) continue;
      this.#validateObjectId(payload[field], `${field} debe ser un ID válido de MongoDB`);
      const exists = await repository.findById(payload[field]);
      if (!exists) throw new AppError(`${label} asociado no encontrado`, 404);
    }
  }

  #validateObjectId(id, message = 'Formato de ID inválido') {
    if (!mongoose.isObjectIdOrHexString(id)) {
      throw new AppError(message, 400);
    }
  }

  #validateTitle(title) {
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 120) {
      throw new AppError('El título debe tener entre 1 y 120 caracteres', 400);
    }
  }

  #validateParticipants(minParticipants, maxParticipants) {
    if (!Number.isInteger(minParticipants) || minParticipants < 1 ||
        !Number.isInteger(maxParticipants) || maxParticipants < 1) {
      throw new AppError('minParticipants y maxParticipants deben ser enteros mayores que cero', 400);
    }
    if (minParticipants > maxParticipants) {
      throw new AppError('minParticipants no puede superar maxParticipants', 400);
    }
  }

  #toRoutePayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new AppError('El payload de la ruta debe ser un objeto', 400);
    }
    // _id, slug, deletedAt y las fechas de auditoría no se reciben del cliente.
    const fields = [
      'title', 'description', 'location', 'distanceKm', 'difficulty',
      'categoryId', 'locationId', 'guideId', 'createdByUserId',
      'durationMinutes', 'startAt', 'recommendedEquipment',
      'minParticipants', 'maxParticipants', 'status', 'isActive'
    ];
    return Object.fromEntries(fields
      .filter((field) => Object.hasOwn(payload, field) && payload[field] !== undefined)
      .map((field) => [field, typeof payload[field] === 'string' ? payload[field].trim() : payload[field]]));
  }

  async #buildUniqueSlug(title, excludeId, reservedSlugs) {
    const baseSlug = generateSlug(title);
    for (let suffix = 0; ; suffix += 1) {
      const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix}`;
      if (!reservedSlugs.has(candidate) && !(await routeRepository.slugExists(candidate, excludeId))) {
        return candidate;
      }
    }
  }

  #isSlugDuplicate(error) {
    return error.code === 11000 && (error.keyPattern?.slug || error.keyValue?.slug);
  }
}

export const routeService = new RouteService();
