export const ROUTE_STATUS_OPTIONS = [
  { value: 'programado', label: 'Programado' },
  { value: 'en curso', label: 'En curso' },
  { value: 'finalizado', label: 'Finalizado' }
];

export const ROUTE_STATUS_VALUES = ROUTE_STATUS_OPTIONS.map(({ value }) => value);

export function getRouteStatus(value) {
  return ROUTE_STATUS_VALUES.includes(value) ? value : 'programado';
}
