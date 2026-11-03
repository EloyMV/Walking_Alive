import { locationsService } from '../services/locationsService';
import useEntityCollection from './useEntityCollection';

export default function useLocations(options) {
  const collection = useEntityCollection(locationsService, options);
  return { ...collection, locations: collection.items };
}
