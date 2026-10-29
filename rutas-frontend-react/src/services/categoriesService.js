import { categoriesApi } from './api';

export const categoriesService = {
  loadCategories: () => categoriesApi.list()
};
