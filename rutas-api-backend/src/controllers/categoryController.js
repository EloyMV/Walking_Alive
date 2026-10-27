import { categoryService } from '../services/categoryService.js';
import { createEntityController } from './createEntityController.js';

export const categoryController = createEntityController(categoryService);
