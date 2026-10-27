import mongoose from 'mongoose';
import { imageRepository } from '../repositories/imageRepository.js';
import { generateSlug } from '../utils/slug.util.js';
import { AppError } from '../utils/app-error.js';

// Operaciones comunes; cada servicio declara sus campos, relaciones y reglas propias.
export class EntityService {
  constructor({
    repository, label, fields, relations = [],
    slugSource = (data) => data.name, slugFields = ['name'], slugMaxLength = 300,
    imageEntity = null, sanitize = (plain) => plain, validate = async () => {}
  }) {
    Object.assign(this, {
      repository, label, relations, slugSource, slugFields, slugMaxLength,
      imageEntity, sanitize, validate
    });
    const protectedFields = ['_id', 'id', 'slug', 'deletedAt', 'createdAt', 'updatedAt', '__v'];
    this.fields = fields.filter((field) => !protectedFields.includes(field));
  }

  async create(payload) {
    const data = this.#toPayload(payload);
    await this.#ensureValidRelations(data);
    await this.validate(data, null);
    const reservedSlugs = new Set();
    let created;
    while (!created) {
      const slug = await this.#buildUniqueSlug(data, undefined, reservedSlugs);
      try {
        created = await this.repository.create({ ...data, slug });
      } catch (error) {
        if (!this.#isSlugDuplicate(error)) throw this.#normalizeError(error);
        reservedSlugs.add(slug);
      }
    }
    await this.#syncCoverImage(created, payload);
    return this.#present(created);
  }

  async getAll(filters = {}) {
    this.#validateObject(filters, 'Los filtros deben ser un objeto');
    const allowed = new Set([...this.fields, '_id', 'slug']);
    allowed.delete('passwordHash');
    const filter = {};
    for (const [field, value] of Object.entries(filters)) {
      if (!allowed.has(field)) throw new AppError(`Filtro no permitido: ${field}`, 400);
      if (value === undefined) continue;
      if (field === '_id' || this.relations.some((relation) => relation.field === field)) {
        if (value !== null) this.#validateObjectId(value, `${field} debe ser un ID válido de MongoDB`);
      } else if (value !== null && typeof value === 'object') {
        throw new AppError(`El filtro ${field} debe ser un valor simple`, 400);
      }
      filter[field] = value;
    }
    return this.#presentCollection(await this.repository.findAll(filter));
  }

  async findById(id) {
    this.#validateObjectId(id);
    const document = await this.repository.findById(id);
    if (!document) throw this.#notFound();
    return this.#present(document);
  }

  async getById(id) {
    return this.findById(id);
  }

  async getBySlug(slug) {
    if (typeof slug !== 'string' || !slug.trim()) throw new AppError('El slug es obligatorio', 400);
    const document = await this.repository.findBySlug(slug.trim());
    if (!document) throw this.#notFound();
    return this.#present(document);
  }

  async update(id, payload) {
    const current = await this.#getCurrent(id);
    const data = this.#toPayload(payload);
    if (!Object.keys(data).length && !(this.imageEntity && Object.hasOwn(payload, 'imageUrl'))) {
      throw new AppError('Debe proporcionar al menos un campo para actualizar', 400);
    }
    const effective = { ...current, ...data };
    await this.#ensureValidRelations(effective);
    await this.validate(data, current);
    const rebuildSlug = this.slugFields.some((field) => Object.hasOwn(data, field));
    const reservedSlugs = new Set();
    let updated;
    while (!updated) {
      if (rebuildSlug) data.slug = await this.#buildUniqueSlug(effective, id, reservedSlugs);
      try {
        updated = await this.repository.update(id, data);
        if (!updated) throw this.#notFound();
      } catch (error) {
        if (!rebuildSlug || !this.#isSlugDuplicate(error)) throw this.#normalizeError(error);
        reservedSlugs.add(data.slug);
      }
    }
    await this.#syncCoverImage(updated, payload);
    return this.#present(updated);
  }

  async updateAssociations(id, payload) {
    this.#validateObject(payload);
    const associations = Object.fromEntries(this.relations
      .filter(({ field }) => Object.hasOwn(payload, field))
      .map(({ field }) => [field, payload[field]]));
    return this.update(id, associations);
  }

  async softDelete(id) {
    this.#validateObjectId(id);
    const document = await this.repository.softDelete(id);
    if (!document) throw this.#notFound();
    return this.#present(document);
  }

  async deleteEntity(id) {
    this.#validateObjectId(id);
    const current = await this.repository.findByIdIncludingDeleted(id);
    if (!current) throw this.#notFound();
    if (current.deletedAt) return { alreadyDeleted: true };
    await this.repository.softDelete(id);
    return { alreadyDeleted: false };
  }

  async restoreDelete(id) {
    const current = await this.#getCurrent(id, true);
    if (!current.deletedAt) throw this.#notFound();
    // Restaurar no debe volver a introducir referencias a documentos borrados.
    await this.#ensureValidRelations(current);
    await this.validate({}, current);
    const document = await this.repository.restoreDelete(id);
    if (!document) throw this.#notFound();
    return this.#present(document);
  }

  async changeIsActive(id, isActive) {
    if (typeof isActive !== 'boolean') throw new AppError('isActive debe ser un booleano', 400);
    return this.update(id, { isActive });
  }

  async setActivation(id, isActive) {
    return this.changeIsActive(id, isActive);
  }

  async changeStatus(id, status) {
    if (typeof status !== 'string' || !status.trim() || status.trim().length > 50) {
      throw new AppError('El estado debe tener entre 1 y 50 caracteres', 400);
    }
    return this.update(id, { status: status.trim() });
  }

  #toPayload(payload) {
    this.#validateObject(payload);
    if (this.imageEntity && Object.hasOwn(payload, 'imageUrl') &&
        payload.imageUrl !== null && typeof payload.imageUrl !== 'string') {
      throw new AppError('imageUrl debe ser un texto o null', 400);
    }
    return Object.fromEntries(this.fields
      .filter((field) => Object.hasOwn(payload, field) && payload[field] !== undefined)
      .map((field) => [field, typeof payload[field] === 'string' && field !== 'passwordHash'
        ? payload[field].trim() : payload[field]]));
  }

  #validateObject(value, message = 'El payload debe ser un objeto') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppError(message, 400);
  }

  #validateObjectId(id, message = 'Formato de ID inválido') {
    if (!mongoose.isObjectIdOrHexString(id)) throw new AppError(message, 400);
  }

  async #getCurrent(id, includeDeleted = false) {
    this.#validateObjectId(id);
    // Se leen las referencias sin populate: un padre borrado conserva su ID real.
    const current = await this.repository.findByIdIncludingDeleted(id);
    if (!current || (!includeDeleted && current.deletedAt)) throw this.#notFound();
    return this.#toPlain(current);
  }

  async #ensureValidRelations(data) {
    for (const { field, repository, label, required = false } of this.relations) {
      const id = data[field];
      if (id === null || id === undefined) {
        if (required) throw new AppError(`${field} es obligatorio`, 400);
        continue;
      }
      this.#validateObjectId(id, `${field} debe ser un ID válido de MongoDB`);
      if (!await repository.findById(id)) throw new AppError(`${label} asociado no encontrado`, 404);
    }
  }

  async #buildUniqueSlug(data, excludeId, reservedSlugs) {
    const source = this.slugSource(data);
    if (typeof source !== 'string' || !source.trim()) throw new AppError('El nombre para generar el slug es obligatorio', 400);
    const base = generateSlug(source).slice(0, this.slugMaxLength);
    for (let suffix = 0; ; suffix += 1) {
      const ending = suffix ? `-${suffix}` : '';
      const candidate = base.slice(0, this.slugMaxLength - ending.length) + ending;
      if (!reservedSlugs.has(candidate) && !await this.repository.slugExists(candidate, excludeId)) return candidate;
    }
  }

  #isSlugDuplicate(error) {
    return error.code === 11000 && Boolean(error.keyPattern?.slug || error.keyValue?.slug);
  }

  #normalizeError(error) {
    if (error.code !== 11000) return error;
    const fields = Object.keys(error.keyPattern || error.keyValue || {});
    return new AppError(`Ya existe un registro con el mismo valor de ${fields.join(', ') || 'un campo único'}`, 409);
  }

  async #syncCoverImage(document, payload) {
    if (!this.imageEntity || !Object.hasOwn(payload, 'imageUrl')) return;
    const url = payload.imageUrl;
    if (typeof url !== 'string' || !url.trim()) {
      await imageRepository.deactivateCoverByEntity(this.imageEntity, document._id);
    } else {
      const title = document.title || document.name || '';
      await imageRepository.upsertCoverByEntity(this.imageEntity, document._id, url.trim(), `Portada: ${title}`);
    }
  }

  #toPlain(document) {
    return typeof document.toObject === 'function' ? document.toObject({ virtuals: true }) : { ...document };
  }

  async #present(document) {
    const [plain] = await this.#presentCollection([document]);
    return plain;
  }

  async #presentCollection(documents) {
    const result = documents.map((document) => this.sanitize(this.#toPlain(document)));
    if (!this.imageEntity || !result.length) return result;
    const images = await imageRepository.findActiveByEntityIds(this.imageEntity, result.map((document) => document._id));
    const grouped = new Map();
    for (const image of images) {
      const key = String(image[`${this.imageEntity}Id`]);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({
        _id: String(image._id), url: image.url, altText: image.altText,
        position: image.position, isCover: image.isCover
      });
    }
    for (const document of result) document.images = grouped.get(String(document._id)) || [];
    return result;
  }

  #notFound() {
    return new AppError(`${this.label} no encontrado`, 404);
  }
}
