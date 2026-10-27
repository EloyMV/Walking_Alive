import { userRepository } from '../repositories/userRepository.js';
import { roleRepository } from '../repositories/roleRepository.js';
import { EntityService } from './entityService.js';

class UserService extends EntityService {
  constructor() {
    super({
      repository: userRepository,
      label: 'Usuario',
      fields: [
        'roleId', 'name', 'lastName', 'email', 'passwordHash', 'phone', 'status', 'isActive'
      ],
      relations: [{ field: 'roleId', repository: roleRepository, label: 'Rol', required: true }],
      slugSource: (data) => `${data.name || ''} ${data.lastName || ''}`,
      slugFields: ['name', 'lastName'],
      sanitize: (plain) => {
        delete plain.passwordHash;
        return plain;
      }
    });
  }

  createUser(payload) { return this.create(payload); }
  getAllUsers(filters) { return this.getAll(filters); }
  getUserById(id) { return this.getById(id); }
  getUserBySlug(slug) { return this.getBySlug(slug); }
  updateUser(id, payload) { return this.update(id, payload); }
  deleteUser(id) { return this.deleteEntity(id); }
}

export const userService = new UserService();
