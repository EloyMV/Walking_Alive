import { locationService } from '../services/locationService.js';
import { createEntityController } from './createEntityController.js';

export const locationController = createEntityController(locationService);
