import { roleRepository } from '../repositories/roleRepository.js';
import { EntityService } from './entityService.js';

class RoleService extends EntityService {
  constructor() {
    super({
      repository: roleRepository,
      label: 'Rol',
      fields: ['name', 'description', 'status', 'isActive']
    });
  }

  createRole(payload) { return this.create(payload); }
  getAllRoles(filters) { return this.getAll(filters); }
  getRoleById(id) { return this.getById(id); }
  getRoleBySlug(slug) { return this.getBySlug(slug); }
  updateRole(id, payload) { return this.update(id, payload); }
  deleteRole(id) { return this.deleteEntity(id); }
}

export const roleService = new RoleService();
