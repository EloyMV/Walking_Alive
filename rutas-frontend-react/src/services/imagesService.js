import { imagesApi } from './api';
import { createEntityService } from './createEntityService';

const service = createEntityService(imagesApi, { singular: 'la imagen', plural: 'las imágenes' });
export const imagesService = { ...service, loadImages: service.list };
