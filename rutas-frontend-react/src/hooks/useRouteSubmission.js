import { useState } from 'react';

export default function useRouteSubmission(onSubmit) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(data) {
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err.message || 'No se pudo guardar la ruta.');
    } finally {
      setSubmitting(false);
    }
  }

  return { error, submitting, submit };
}
