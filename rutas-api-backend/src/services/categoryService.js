import { categoryRepository } from '../repositories/categoryRepository.js';
import { EntityService } from './entityService.js';

class CategoryService extends EntityService {
  constructor() {
    super({
      repository: categoryRepository,
      label: 'Categoría',
      fields: ['name', 'description', 'url_image', 'status', 'isActive'],
      slugMaxLength: 150
    });
  }

  createCategory(payload) { return this.create(payload); }
  getAllCategories(filters) { return this.getAll(filters); }
  getCategoryById(id) { return this.getById(id); }
  getCategoryBySlug(slug) { return this.getBySlug(slug); }
  updateCategory(id, payload) { return this.update(id, payload); }
  deleteCategory(id) { return this.deleteEntity(id); }
}

export const categoryService = new CategoryService();
