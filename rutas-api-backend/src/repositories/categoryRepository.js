import { Category } from '../models/Category.js';
import { createRepository } from './createRepository.js';

export const categoryRepository = createRepository(Category, ["name","description","slug","status","isActive"], [

]);
