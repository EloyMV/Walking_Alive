import { variantsService } from '../services/variantsService';
import useEntityCollection from './useEntityCollection';

export default function useVariants(options) {
  const collection = useEntityCollection(variantsService, options);
  return { ...collection, variants: collection.items };
}
