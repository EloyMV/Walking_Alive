import { usersService } from '../services/usersService';
import useEntityCollection from './useEntityCollection';

export default function useUsers(options) {
  const collection = useEntityCollection(usersService, options);
  return { ...collection, users: collection.items };
}
