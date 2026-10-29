import { createContext, useCallback, useEffect, useState } from 'react';
import { routesService } from '../services/routesService';

export const RoutesContext = createContext(null);

export function RoutesProvider({ children }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await routesService.loadRoutes({ includeDeleted: true });
      setRoutes(data);
      return data;
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las rutas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const createRoute = useCallback(async (data) => {
    const created = await routesService.createRoute(data);
    setRoutes((current) => [...current, created]);
    return created;
  }, []);

  const updateRoute = useCallback(async (id, data) => {
    const updated = await routesService.updateRoute(id, data);
    setRoutes((current) => current.map((route) => (route._id === id ? updated : route)));
    return updated;
  }, []);

  const removeRoute = useCallback(async (id) => {
    await routesService.removeRoute(id);
    const deletedAt = new Date().toISOString();
    setRoutes((current) => current.map((route) => (
      route._id === id ? { ...route, deletedAt, isActive: false } : route
    )));
  }, []);

  const changeRouteActivation = useCallback(async (id, isActive) => {
    const updated = await routesService.changeRouteActivation(id, isActive);
    setRoutes((current) => current.map((route) => (route._id === id ? updated : route)));
    return updated;
  }, []);

  const changeRouteStatus = useCallback(async (id, status) => {
    const updated = await routesService.changeRouteStatus(id, status);
    setRoutes((current) => current.map((route) => (route._id === id ? updated : route)));
    return updated;
  }, []);

  const restoreRoute = useCallback(async (id) => {
    const restored = await routesService.restoreRoute(id);
    setRoutes((current) => current.map((route) => (route._id === id ? restored : route)));
    return restored;
  }, []);

  const value = {
    routes,
    loading,
    error,
    loadRoutes,
    createRoute,
    updateRoute,
    removeRoute,
    changeRouteActivation,
    changeRouteStatus,
    restoreRoute
  };

  return <RoutesContext.Provider value={value}>{children}</RoutesContext.Provider>;
}
