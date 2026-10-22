import { useCallback, useEffect, useState } from 'react';
import { routesService } from '../services/routesService';

export default function useRoute(id) {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoute = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      setRoute(await routesService.loadRoute(id));
    } catch (err) {
      setError(err.message || 'No se pudo cargar la ruta.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  return { route, loading, error, setError, reload: loadRoute };
}
