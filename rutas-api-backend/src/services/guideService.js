import { EntityService } from './entityService.js';
import { guideRepository } from '../repositories/guideRepository.js';
import { userRepository } from '../repositories/userRepository.js';

class GuideService extends EntityService {
  constructor() {
    super({
      repository: guideRepository,
      label: 'Guía',
      fields: [
        'userId', 'name', 'description', 'email', 'phone', 'licenseNumber',
        'specialty', 'status', 'isActive'
      ],
      relations: [
        { field: 'userId', repository: userRepository, label: 'Usuario', required: true }
      ],
      imageEntity: 'guide'
    });
  }

  async createGuide(payload) { return this.create(payload); }
  async getAllGuides(filters) { return this.getAll(filters); }
  async getGuideById(id) { return this.getById(id); }
  async getGuideBySlug(slug) { return this.getBySlug(slug); }
  async updateGuide(id, payload) { return this.update(id, payload); }
  async deleteGuide(id) { return this.deleteEntity(id); }
}

export const guideService = new GuideService();
