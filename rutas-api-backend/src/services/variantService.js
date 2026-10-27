import { EntityService } from './entityService.js';
import { variantRepository } from '../repositories/variantRepository.js';
import { routeRepository } from '../repositories/routeRepository.js';

class VariantService extends EntityService {
  constructor() {
    super({
      repository: variantRepository,
      label: 'Variante',
      fields: [
        'routeId', 'name', 'description', 'sku', 'price', 'currency',
        'capacity', 'minimumAge', 'includesTransport', 'status', 'isActive'
      ],
      relations: [
        { field: 'routeId', repository: routeRepository, label: 'Ruta', required: true }
      ],
      imageEntity: 'variant'
    });
  }

  async createVariant(payload) { return this.create(payload); }
  async getAllVariants(filters) { return this.getAll(filters); }
  async getVariantById(id) { return this.getById(id); }
  async getVariantBySlug(slug) { return this.getBySlug(slug); }
  async updateVariant(id, payload) { return this.update(id, payload); }
  async deleteVariant(id) { return this.deleteEntity(id); }
}

export const variantService = new VariantService();
