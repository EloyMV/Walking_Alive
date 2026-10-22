const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const responseBody = await response.text();
    let message = `Error ${response.status}`;
    if (responseBody) {
      try {
        const body = JSON.parse(responseBody);
        message = body.message || message;
      } catch {
        message = responseBody;
      }
    }
    throw new Error(message, { cause: response.status });
  }

  if (response.status === 204) return null;
  return response.json();
}

export const routesApi = {
  list: () => request('/routes'),
  get: (id) => request(`/routes/${id}`),
  create: (data) => request('/routes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/routes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id) => request(`/routes/${id}`, { method: 'DELETE' })
};
