import { usersApi } from './api';
import { createEntityService } from './createEntityService';

const service = createEntityService(usersApi, { singular: 'el usuario', plural: 'los usuarios' });
export const usersService = { ...service, loadUsers: service.list };
