import { imagesService } from '../services/imagesService';
import useEntityCollection from './useEntityCollection';

export default function useImages(options) {
  const collection = useEntityCollection(imagesService, options);
  return { ...collection, images: collection.items };
}
