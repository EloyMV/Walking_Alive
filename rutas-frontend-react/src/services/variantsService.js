import { variantsApi } from './api';
import { createEntityService } from './createEntityService';

const service = createEntityService(variantsApi, { singular: 'la variante', plural: 'las variantes' });
export const variantsService = { ...service, loadVariants: service.list };
