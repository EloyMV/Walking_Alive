import { useCallback, useEffect, useRef, useState } from 'react';

export default function useEntityCollection(service, { includeDeleted = false, enabled = true } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const requestId = useRef(0);
  const mounted = useRef(false);
  const scope = useRef({ service, includeDeleted, enabled });
  scope.current = { service, includeDeleted, enabled };

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const reload = useCallback(() => {
    requestId.current += 1;
    setError('');
    setLoading(enabled);
    if (enabled) setLoadAttempt((attempt) => attempt + 1);
  }, [enabled]);

  useEffect(() => {
    let cancelled = false;
    const currentRequest = ++requestId.current;
    const isCurrent = () => !cancelled && currentRequest === requestId.current;
    setError('');

    if (!enabled) {
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    service.list({ includeDeleted })
      .then((data) => { if (isCurrent()) setItems(data); })
      .catch((err) => { if (isCurrent()) setError(err?.message || 'No se pudieron cargar los registros.'); })
      .finally(() => { if (isCurrent()) setLoading(false); });

    return () => { cancelled = true; };
  }, [service, includeDeleted, enabled, loadAttempt]);

  const applyMutation = useCallback((update) => {
    const current = scope.current;
    if (!mounted.current || current.service !== service || current.includeDeleted !== includeDeleted || current.enabled !== enabled) return;
    // Una respuesta antigua del listado no debe deshacer una modificación ya guardada.
    requestId.current += 1;
    setLoading(false);
    setItems(update);
  }, [service, includeDeleted, enabled]);

  const replaceItem = useCallback((item) => {
    applyMutation((current) => current.some((entry) => entry._id === item._id)
      ? current.map((entry) => entry._id === item._id ? item : entry)
      : [item, ...current]);
    return item;
  }, [applyMutation]);

  const createItem = useCallback(async (data) => replaceItem(await service.create(data)), [service, replaceItem]);
  const updateItem = useCallback(async (id, data) => replaceItem(await service.update(id, data)), [service, replaceItem]);
  const changeActivation = useCallback(async (id, isActive) => replaceItem(await service.changeActivation(id, isActive)), [service, replaceItem]);
  const changeStatus = useCallback(async (id, status) => replaceItem(await service.changeStatus(id, status)), [service, replaceItem]);
  const restoreItem = useCallback(async (id) => replaceItem(await service.restore(id)), [service, replaceItem]);
  const removeItem = useCallback(async (id) => {
    await service.remove(id);
    const deletedAt = new Date().toISOString();
    applyMutation((current) => current.map((item) => item._id === id
      ? { ...item, deletedAt, updatedAt: deletedAt, isActive: false }
      : item));
  }, [service, applyMutation]);

  return {
    items, loading: enabled && loading, error: enabled ? error : '', reload,
    createItem, updateItem, changeActivation, changeStatus, removeItem, restoreItem
  };
}
