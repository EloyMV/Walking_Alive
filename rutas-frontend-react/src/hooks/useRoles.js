import { rolesService } from '../services/rolesService';
import useEntityCollection from './useEntityCollection';

export default function useRoles(options) {
  const collection = useEntityCollection(rolesService, options);
  return { ...collection, roles: collection.items };
}
