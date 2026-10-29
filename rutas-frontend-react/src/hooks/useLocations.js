import { useCallback, useEffect, useRef, useState } from 'react';
import { locationsService } from '../services/locationsService';

export default function useLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const requestId = useRef(0);

  const reload = useCallback(() => {
    requestId.current += 1;
    setLoading(true);
    setError('');
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const currentRequest = ++requestId.current;
    const isCurrent = () => !cancelled && currentRequest === requestId.current;

    async function loadLocations() {
      try {
        const data = await locationsService.loadLocations();
        if (isCurrent()) setLocations(data);
      } catch (err) {
        if (isCurrent()) setError(err.message || 'No se pudieron cargar las ubicaciones.');
      } finally {
        if (isCurrent()) setLoading(false);
      }
    }

    loadLocations();
    return () => { cancelled = true; };
  }, [loadAttempt]);

  return { locations, loading, error, reload };
}
