import { locationsApi } from './api';

export const locationsService = {
  loadLocations: () => locationsApi.list()
};
