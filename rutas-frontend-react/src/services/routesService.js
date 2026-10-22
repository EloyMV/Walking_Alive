import { routesApi } from './api';
import { handleApiError } from '../utils/errorHandler';

async function runWithErrorHandling(action, fallbackMessage) {
  try {
    return await action();
  } catch (error) {
    throw await handleApiError(error, fallbackMessage);
  }
}

export const routesService = {
  loadRoutes: () => runWithErrorHandling(() => routesApi.list(), 'No se pudieron cargar las rutas.'),
  loadRoute: (id) => runWithErrorHandling(() => routesApi.get(id), 'No se pudo cargar la ruta.'),
  createRoute: (data) => runWithErrorHandling(() => routesApi.create(data), 'No se pudo crear la ruta.'),
  updateRoute: (id, data) => runWithErrorHandling(() => routesApi.update(id, data), 'No se pudo actualizar la ruta.'),
  removeRoute: (id) => runWithErrorHandling(() => routesApi.remove(id), 'No se pudo eliminar la ruta.')
};
