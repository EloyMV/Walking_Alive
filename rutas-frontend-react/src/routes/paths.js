export const ROUTES = {
  home: '/',
  routes: '/routes',
  routeNew: '/routes/new',
  routeEdit: (id = ':id') => `/routes/${id}/edit`,
  entityList: (entity) => `/${entity}`,
  entityNew: (entity) => `/${entity}/new`,
  entityEdit: (entity, id = ':id') => `/${entity}/${id}/edit`
};
