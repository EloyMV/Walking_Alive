export function relationName(value, fallback = '') {
  if (!value) return fallback || 'Sin asignar';
  if (typeof value === 'object') {
    const name = value.title || [value.name, value.lastName].filter(Boolean).join(' ');
    return name || fallback || 'No disponible';
  }
  if (typeof value === 'string' && !/^[a-fA-F0-9]{24}$/.test(value)) return value;
  return fallback || 'No disponible';
}

export default function RelationBadge({ value, fallback = '', emptyLabel = 'Sin asignar' }) {
  const missing = !value && !fallback;
  const name = missing ? emptyLabel : relationName(value, fallback);
  return <span className={`relation-badge${missing || name === 'No disponible' ? ' relation-badge-empty' : ''}`} title={name}>{name}</span>;
}
