import { categoriesService } from '../services/categoriesService';
import useEntityCollection from './useEntityCollection';

export default function useCategories(options) {
  const collection = useEntityCollection(categoriesService, options);
  return { ...collection, categories: collection.items };
}
