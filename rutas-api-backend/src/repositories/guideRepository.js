import { Guide } from '../models/Guide.js';
import { User } from '../models/User.js';
import { createRepository } from './createRepository.js';

export const guideRepository = createRepository(Guide, ["userId","name","description","email","phone","licenseNumber","specialty","slug","status","isActive"], [
  { path: 'userId', model: User, match: { deletedAt: null }, select: 'name lastName email slug status isActive' }
]);
