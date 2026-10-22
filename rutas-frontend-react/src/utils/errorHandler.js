import { showErrorAlert } from './sweetAlert';

export function getErrorMessage(error, fallbackMessage = 'Ha ocurrido un error.') {
  if (typeof error === 'string' && error.trim()) return error;
  if (error instanceof Error && error.message) return error.message;
  return fallbackMessage;
}

export async function handleApiError(error, fallbackMessage) {
  const message = getErrorMessage(error, fallbackMessage);
  await showErrorAlert(message);
  return new Error(message, { cause: error });
}
