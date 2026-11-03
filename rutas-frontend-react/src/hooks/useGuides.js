import { guidesService } from '../services/guidesService';
import useEntityCollection from './useEntityCollection';

export default function useGuides(options) {
  const collection = useEntityCollection(guidesService, options);
  return { ...collection, guides: collection.items };
}
