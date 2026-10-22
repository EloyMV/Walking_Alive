export const ROUTES = {
  home: '/',
  routes: '/routes',
  routeNew: '/routes/new',
  routeDetails: (id = ':id') => `/routes/${id}`,
  routeEdit: (id = ':id') => `/routes/${id}/edit`
};
