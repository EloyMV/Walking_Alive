import { User } from '../models/User.js';
import { Role } from '../models/Role.js';
import { createRepository } from './createRepository.js';

export const userRepository = createRepository(User, ["roleId","name","lastName","email","passwordHash","phone","slug","status","isActive"], [
  { path: 'roleId', model: Role, match: { deletedAt: null } }
]);
