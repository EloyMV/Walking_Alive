import { rolesApi } from './api';
import { createEntityService } from './createEntityService';

const service = createEntityService(rolesApi, { singular: 'el rol', plural: 'los roles' });
export const rolesService = { ...service, loadRoles: service.list };
