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
  loadRoutes: (options) => runWithErrorHandling(() => routesApi.list(options), 'No se pudieron cargar las rutas.'),
  loadRoute: (id) => runWithErrorHandling(() => routesApi.get(id), 'No se pudo cargar la ruta.'),
  createRoute: (data) => runWithErrorHandling(() => routesApi.create(data), 'No se pudo crear la ruta.'),
  updateRoute: (id, data) => runWithErrorHandling(() => routesApi.update(id, data), 'No se pudo actualizar la ruta.'),
  changeRouteActivation: (id, isActive) => runWithErrorHandling(() => routesApi.changeActivation(id, isActive), 'No se pudo cambiar la disponibilidad de la ruta.'),
  changeRouteStatus: (id, status) => runWithErrorHandling(() => routesApi.changeStatus(id, status), 'No se pudo cambiar el estado de la ruta.'),
  restoreRoute: (id) => runWithErrorHandling(() => routesApi.restore(id), 'No se pudo restaurar la ruta.'),
  removeRoute: (id) => runWithErrorHandling(() => routesApi.remove(id), 'No se pudo realizar el borrado lógico de la ruta.')
};
