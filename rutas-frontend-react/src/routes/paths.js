export const ROUTES = {
  home: '/',
  routes: '/routes',
  routeNew: '/routes/new',
  routeEdit: (id = ':id') => `/routes/${id}/edit`
};
