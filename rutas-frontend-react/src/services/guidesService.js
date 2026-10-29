import { guidesApi } from './api';

export const guidesService = {
  loadGuides: () => guidesApi.list()
};
