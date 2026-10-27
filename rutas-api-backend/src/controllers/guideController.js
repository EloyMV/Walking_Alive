import { guideService } from '../services/guideService.js';
import { createEntityController } from './createEntityController.js';

export const guideController = createEntityController(guideService);
