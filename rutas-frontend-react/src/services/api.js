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
  list: ({ includeDeleted = false } = {}) => request(`/routes${includeDeleted ? '?includeDeleted=true' : ''}`),
  get: (id) => request(`/routes/${id}`),
  create: (data) => request('/routes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/routes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  changeActivation: (id, isActive) => request(`/routes/${id}/is-active`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  changeStatus: (id, status) => request(`/routes/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  restore: (id) => request(`/routes/${id}/restore`, { method: 'PATCH' }),
  remove: (id) => request(`/routes/${id}`, { method: 'DELETE' })
};

export const categoriesApi = { list: () => request('/categories') };
export const locationsApi = { list: () => request('/locations') };
export const guidesApi = { list: () => request('/guides') };
export const usersApi = { list: () => request('/users') };
