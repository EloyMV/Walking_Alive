import { useCallback, useEffect, useRef, useState } from 'react';
import { categoriesService } from '../services/categoriesService';

export default function useCategories() {
  const [categories, setCategories] = useState([]);
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

    async function loadCategories() {
      try {
        const data = await categoriesService.loadCategories();
        if (isCurrent()) setCategories(data);
      } catch (err) {
        if (isCurrent()) setError(err.message || 'No se pudieron cargar las categorías.');
      } finally {
        if (isCurrent()) setLoading(false);
      }
    }

    loadCategories();
    return () => { cancelled = true; };
  }, [loadAttempt]);

  return { categories, loading, error, reload };
}
