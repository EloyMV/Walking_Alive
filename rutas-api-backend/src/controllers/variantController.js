import { variantService } from '../services/variantService.js';
import { createEntityController } from './createEntityController.js';

export const variantController = createEntityController(variantService);
