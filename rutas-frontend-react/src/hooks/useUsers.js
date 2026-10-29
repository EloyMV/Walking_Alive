import { useCallback, useEffect, useRef, useState } from 'react';
import { usersService } from '../services/usersService';

export default function useUsers() {
  const [users, setUsers] = useState([]);
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

    async function loadUsers() {
      try {
        const data = await usersService.loadUsers();
        if (isCurrent()) setUsers(data);
      } catch (err) {
        if (isCurrent()) setError(err.message || 'No se pudieron cargar los usuarios.');
      } finally {
        if (isCurrent()) setLoading(false);
      }
    }

    loadUsers();
    return () => { cancelled = true; };
  }, [loadAttempt]);

  return { users, loading, error, reload };
}
