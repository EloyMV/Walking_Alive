import { userService } from '../services/userService.js';
import { createEntityController } from './createEntityController.js';

export const userController = createEntityController(userService);
