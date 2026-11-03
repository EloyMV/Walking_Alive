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

export function createEntityApi(endpoint) {
  const path = `/${endpoint.replace(/^\/+|\/+$/g, '')}`;
  const recordPath = (id) => `${path}/${encodeURIComponent(id)}`;

  return {
    list: ({ includeDeleted = false } = {}) => request(`${path}${includeDeleted ? '?includeDeleted=true' : ''}`),
    get: (id) => request(recordPath(id)),
    create: (data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(recordPath(id), { method: 'PATCH', body: JSON.stringify(data) }),
    changeActivation: (id, isActive) => request(`${recordPath(id)}/is-active`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
    changeStatus: (id, status) => request(`${recordPath(id)}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    restore: (id) => request(`${recordPath(id)}/restore`, { method: 'PATCH' }),
    remove: (id) => request(recordPath(id), { method: 'DELETE' })
  };
}

export const routesApi = createEntityApi('routes');
export const rolesApi = createEntityApi('roles');
export const categoriesApi = createEntityApi('categories');
export const locationsApi = createEntityApi('locations');
export const guidesApi = createEntityApi('guides');
export const usersApi = createEntityApi('users');
export const variantsApi = createEntityApi('variants');
export const imagesApi = createEntityApi('images');
