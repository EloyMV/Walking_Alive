import { locationsApi } from './api';
import { createEntityService } from './createEntityService';

const service = createEntityService(locationsApi, { singular: 'la ubicación', plural: 'las ubicaciones' });
export const locationsService = { ...service, loadLocations: service.list };
