import { EntityService } from './entityService.js';
import { imageRepository } from '../repositories/imageRepository.js';
import { routeRepository } from '../repositories/routeRepository.js';
import { variantRepository } from '../repositories/variantRepository.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { locationRepository } from '../repositories/locationRepository.js';
import { guideRepository } from '../repositories/guideRepository.js';

class ImageService extends EntityService {
  constructor() {
    super({
      repository: imageRepository,
      label: 'Imagen',
      fields: [
        'routeId', 'variantId', 'categoryId', 'locationId', 'guideId',
        'url', 'altText', 'position', 'isCover', 'source', 'author', 'status', 'isActive'
      ],
      relations: [
        { field: 'routeId', repository: routeRepository, label: 'Ruta' },
        { field: 'variantId', repository: variantRepository, label: 'Variante' },
        { field: 'categoryId', repository: categoryRepository, label: 'Categoría' },
        { field: 'locationId', repository: locationRepository, label: 'Ubicación' },
        { field: 'guideId', repository: guideRepository, label: 'Guía' }
      ],
      slugSource: (data) => data.altText || data.url || 'imagen',
      slugFields: ['altText', 'url']
    });
  }

  async createImage(payload) { return this.create(payload); }
  async getAllImages(filters) { return this.getAll(filters); }
  async getImageById(id) { return this.getById(id); }
  async getImageBySlug(slug) { return this.getBySlug(slug); }
  async updateImage(id, payload) { return this.update(id, payload); }
  async deleteImage(id) { return this.deleteEntity(id); }
}

export const imageService = new ImageService();
