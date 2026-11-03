import { categoriesApi } from './api';
import { createEntityService } from './createEntityService';

const service = createEntityService(categoriesApi, { singular: 'la categoría', plural: 'las categorías' });
export const categoriesService = { ...service, loadCategories: service.list };
