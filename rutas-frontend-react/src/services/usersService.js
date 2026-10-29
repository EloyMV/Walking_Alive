import { usersApi } from './api';

export const usersService = {
  loadUsers: () => usersApi.list()
};
