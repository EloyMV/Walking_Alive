import { useCallback, useEffect, useRef, useState } from 'react';
import { guidesService } from '../services/guidesService';

export default function useGuides() {
  const [guides, setGuides] = useState([]);
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

    async function loadGuides() {
      try {
        const data = await guidesService.loadGuides();
        if (isCurrent()) setGuides(data);
      } catch (err) {
        if (isCurrent()) setError(err.message || 'No se pudieron cargar los guías.');
      } finally {
        if (isCurrent()) setLoading(false);
      }
    }

    loadGuides();
    return () => { cancelled = true; };
  }, [loadAttempt]);

  return { guides, loading, error, reload };
}
