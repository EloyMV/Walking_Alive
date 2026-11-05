import { Category } from '../models/Category.js';
import { createRepository } from './createRepository.js';

export const categoryRepository = createRepository(Category, ["name","description","url_image","slug","status","isActive"], [

]);
