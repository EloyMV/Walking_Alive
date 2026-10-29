export const ROUTE_STATUSES = ['programado', 'en curso', 'finalizado'];
export const DEFAULT_ROUTE_STATUS = 'programado';

// Las rutas antiguas usaban estados de publicación en lugar de estados de la actividad.
export const normalizeLegacyRouteStatus = (status) => (
  ROUTE_STATUSES.includes(status) ? status : DEFAULT_ROUTE_STATUS
);
