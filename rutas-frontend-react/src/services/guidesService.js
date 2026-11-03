import { guidesApi } from './api';
import { createEntityService } from './createEntityService';

const service = createEntityService(guidesApi, { singular: 'el guía', plural: 'los guías' });
export const guidesService = { ...service, loadGuides: service.list };
