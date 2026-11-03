import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../components/DataTable';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';
import { entityResources, entityTitle, displayValue, formatEntityDate } from '../features/entities/entityResources';
import { confirmAction } from '../utils/sweetAlert';

export default function EntityList({ config }) {
  const useCollection = entityResources[config.key].useCollection;
  const collection = useCollection({ includeDeleted: true });
  const { items, loading, error, reload } = collection;
  const [pending, setPending] = useState({});
  const locks = useRef(new Set());
  const [actionError, setActionError] = useState('');
  const visibleFields = config.fields.filter(({ name, type }) => name !== config.titleField && name !== 'description' && type !== 'password' && name !== 'imageUrl');
  const listFields = (config.listFields || []).map((name) => config.fields.find((field) => field.name === name)).filter(Boolean);

  async function perform(item, action) {
    if (locks.current.has(item._id)) return;
    locks.current.add(item._id);
    setPending((current) => ({ ...current, [item._id]: true }));
    setActionError('');
    try { await action(); } catch (error) { setActionError(error.message || 'No se pudo actualizar el registro.'); }
    finally {
      locks.current.delete(item._id);
      setPending((current) => { const next = { ...current }; delete next[item._id]; return next; });
    }
  }

  async function remove(item) {
    if (await confirmAction({ title: '¿Eliminar mediante borrado lógico?', text: `“${entityTitle(config, item)}” quedará deshabilitado. Podrás restaurarlo desde este listado.`, confirmButtonText: 'Eliminar (borrado lógico)' })) {
      await perform(item, () => collection.removeItem(item._id));
    }
  }

  const blocked = (item) => Boolean(item.deletedAt || pending[item._id]);
  const columns = [
    { key: 'title', label: config.singular, render: (item) => <>
      <strong>{entityTitle(config, item)}</strong>
      {config.key === 'images' && <span className="table-subtitle">{item.url}</span>}
      {item.description && !listFields.some(({ name }) => name === 'description') && <p className="route-description">{item.description}</p>}
      <dl className="entity-details">{visibleFields.filter(({ name }) => !listFields.some((field) => field.name === name)).map((field) => <div key={field.name}><dt>{field.label}</dt><dd>{displayValue(item[field.name])}</dd></div>)}</dl>
      <small className="route-meta">ID: {item._id}</small>
    </> },
    ...listFields.map((field) => ({ key: field.name, label: field.label, render: (item) => field.type === 'checkbox'
      ? <label className="availability-control"><input type="checkbox" role="switch" aria-label={`${field.label} de ${entityTitle(config, item)}`} checked={Boolean(item[field.name])} disabled={blocked(item)} onChange={(event) => { const value = event.target.checked; perform(item, () => collection.updateItem(item._id, { [field.name]: value })); }} /><span className="availability-switch" aria-hidden="true" /><span>{item[field.name] ? 'Sí' : 'No'}</span></label>
      : field.type === 'select' ? <select className="route-status" aria-label={`${field.label} de ${entityTitle(config, item)}`} value={item[field.name]} disabled={blocked(item)} onChange={(event) => { const value = event.target.value; perform(item, () => collection.updateItem(item._id, { [field.name]: value })); }}>{field.options.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>
        : displayValue(item[field.name]) })),
    { key: 'status', label: 'Estado', render: (item) => <>
      <select className="route-status entity-status" aria-label={`Estado de ${entityTitle(config, item)}`} value={item.status} disabled={blocked(item)} onChange={(event) => { const status = event.target.value; perform(item, () => collection.changeStatus(item._id, status)); }}>
        {!config.statusOptions.some(({ value }) => value === item.status) && <option value={item.status}>{item.status}</option>}
        {config.statusOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
      </select>
      {item.deletedAt && <span className="route-deleted-label">Eliminado · borrado lógico</span>}
    </> },
    { key: 'isActive', label: 'Disponibilidad', render: (item) => {
      const active = !item.deletedAt && item.isActive !== false;
      return <label className="availability-control"><input type="checkbox" role="switch" aria-label={`Disponibilidad de ${entityTitle(config, item)}`} checked={active} disabled={blocked(item)} onChange={(event) => { const value = event.target.checked; perform(item, () => collection.changeActivation(item._id, value)); }} /><span className="availability-switch" aria-hidden="true" /><span>{active ? 'Disponible' : 'No disponible'}</span></label>;
    } },
    { key: 'createdAt', label: 'Fecha de alta', render: (item) => <>{formatEntityDate(item.createdAt)}<small className="route-meta">Actualizado: {formatEntityDate(item.updatedAt)}</small></> },
    { key: 'actions', label: 'Acciones', render: (item) => item.deletedAt
      ? <button type="button" className="button button-small" disabled={Boolean(pending[item._id])} onClick={() => perform(item, () => collection.restoreItem(item._id))}>{pending[item._id] ? 'Restaurando…' : 'Restaurar'}</button>
      : <div className="card-actions">{pending[item._id] ? <span className="button button-ghost button-small" aria-disabled="true">Editar</span> : <Link className="button button-ghost button-small" to={`/${config.key}/${item._id}/edit`}>Editar</Link>}<button type="button" className="button button-danger button-small" disabled={Boolean(pending[item._id])} onClick={() => remove(item)}>Eliminar (borrado lógico)</button>{pending[item._id] && <small role="status">Guardando…</small>}</div> }
  ];
  const live = items.filter((item) => !item.deletedAt);
  const stats = [{ label: 'Registros', value: items.length }, { label: 'Disponibles', value: live.filter((item) => item.isActive !== false).length }, { label: 'No disponibles', value: live.filter((item) => item.isActive === false).length }, { label: 'Eliminados', value: items.length - live.length }];

  return <section>
    <div className="page-header routes-hero entity-hero"><div><p className="eyebrow">WALKINGALIVE · {config.plural.toUpperCase()}</p><h1>{config.plural}</h1><p className="muted">{config.description}</p></div><Link className="button" to={`/${config.key}/new`}>+ Crear {config.singular}</Link></div>
    <div className="route-stats" aria-label={`Resumen de ${config.plural.toLowerCase()}`}>{stats.map(({ label, value }) => <div className="route-stat" key={label}><small>{label}</small><strong>{loading ? '—' : value}</strong></div>)}</div>
    {error && <ErrorState message={error} onRetry={reload} />}{actionError && <ErrorState message={actionError} />}
    {loading ? <Skeleton rows={4} /> : !error && <><p className="table-scroll-hint">Desliza la tabla para ver todos los campos y acciones →</p><DataTable rows={items} columns={columns} rowKey="_id" rowClassName={(item) => item.deletedAt ? 'route-row-deleted' : ''} emptyMessage={`No hay ${config.plural.toLowerCase()} todavía.`} /></>}
  </section>;
}
