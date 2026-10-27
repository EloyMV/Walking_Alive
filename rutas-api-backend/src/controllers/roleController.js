import { roleService } from '../services/roleService.js';
import { createEntityController } from './createEntityController.js';

export const roleController = createEntityController(roleService);
