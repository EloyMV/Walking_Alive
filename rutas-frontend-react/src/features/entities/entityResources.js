import { useCategories, useGuides, useImages, useLocations, useRoles, useUsers, useVariants } from '../../hooks';
import { categoriesService } from '../../services/categoriesService';
import { guidesService } from '../../services/guidesService';
import { imagesService } from '../../services/imagesService';
import { locationsService } from '../../services/locationsService';
import { rolesService } from '../../services/rolesService';
import { usersService } from '../../services/usersService';
import { variantsService } from '../../services/variantsService';

export const entityResources = {
  categories: { useCollection: useCategories, service: categoriesService },
  guides: { useCollection: useGuides, service: guidesService },
  images: { useCollection: useImages, service: imagesService },
  locations: { useCollection: useLocations, service: locationsService },
  roles: { useCollection: useRoles, service: rolesService },
  users: { useCollection: useUsers, service: usersService },
  variants: { useCollection: useVariants, service: variantsService }
};

export function entityTitle(config, item) {
  if (config.key === 'images') return item.altText || item.url || 'Imagen';
  return [item[config.titleField], config.key === 'users' ? item.lastName : ''].filter(Boolean).join(' ') || config.singular;
}

export function relationLabel(item) {
  const name = [item.name || item.title || item.altText || item.url, item.lastName].filter(Boolean).join(' ');
  return `${name || 'Selección actual'}${item.email ? ` (${item.email})` : ''}${item.isActive === false ? ' · inactivo/a' : ''}${item.deletedAt ? ' · eliminado/a' : ''}`;
}

export function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return value.$numberDecimal ?? relationLabel(value);
  return String(value);
}

export function formatEntityDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha';
}
