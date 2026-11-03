import { useCallback, useEffect, useRef, useState } from 'react';

export default function useEntityRecord(service, id) {
  const [item, setItem] = useState(null);
  const [loadedId, setLoadedId] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const requestId = useRef(0);

  const reload = useCallback(() => {
    requestId.current += 1;
    setError('');
    setLoading(Boolean(id));
    if (id) setLoadAttempt((attempt) => attempt + 1);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const currentRequest = ++requestId.current;
    const isCurrent = () => !cancelled && currentRequest === requestId.current;
    setItem(null);
    setLoadedId(null);
    setError('');

    if (!id) {
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    service.get(id)
      .then((data) => {
        if (isCurrent()) {
          setItem(data);
          setLoadedId(id);
        }
      })
      .catch((err) => {
        if (isCurrent()) {
          setError(err?.message || 'No se pudo cargar el registro.');
          setLoadedId(id);
        }
      })
      .finally(() => { if (isCurrent()) setLoading(false); });

    return () => { cancelled = true; };
  }, [service, id, loadAttempt]);

  const matchesId = loadedId === id;
  return {
    item: id && matchesId ? item : null,
    loading: Boolean(id) && (loading || !matchesId),
    error: id && matchesId ? error : '',
    reload
  };
}
