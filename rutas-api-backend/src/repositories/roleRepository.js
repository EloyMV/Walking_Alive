import { Role } from '../models/Role.js';
import { createRepository } from './createRepository.js';

export const roleRepository = createRepository(Role, ["name","description","slug","status","isActive"], [

]);
