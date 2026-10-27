import { imageService } from '../services/imageService.js';
import { createEntityController } from './createEntityController.js';

export const imageController = createEntityController(imageService);
