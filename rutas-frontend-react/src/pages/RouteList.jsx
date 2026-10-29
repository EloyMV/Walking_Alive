import { useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../components/DataTable';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';
import { useRoutes } from '../hooks';
import { ROUTES } from '../routes/paths';
import { confirmAction } from '../utils/sweetAlert';
import { getRouteStatus, ROUTE_STATUS_OPTIONS } from '../features/routes/routeStatus';

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function RouteList() {
  const { routes, loading, error, loadRoutes, removeRoute, changeRouteActivation, changeRouteStatus, restoreRoute } = useRoutes();
  const [actionError, setActionError] = useState('');
  const [pendingRoutes, setPendingRoutes] = useState({});
  const liveRoutes = routes.filter((route) => !route.deletedAt);
  const statistics = [
    { label: 'Rutas en el mapa', value: routes.length },
    { label: 'Disponibles', value: liveRoutes.filter((route) => route.isActive !== false).length },
    { label: 'En curso', value: liveRoutes.filter((route) => getRouteStatus(route.status) === 'en curso').length },
    { label: 'Eliminadas', value: routes.length - liveRoutes.length }
  ];

  async function performAction(route, action, fallbackMessage) {
    if (pendingRoutes[route._id]) return;
    setActionError('');
    setPendingRoutes((current) => ({ ...current, [route._id]: true }));
    try {
      await action();
    } catch (err) {
      setActionError(err.message || fallbackMessage);
    } finally {
      setPendingRoutes((current) => {
        const next = { ...current };
        delete next[route._id];
        return next;
      });
    }
  }

  async function remove(route) {
    const confirmed = await confirmAction({
      title: '¿Eliminar la ruta mediante borrado lógico?',
      text: `“${route.title}” quedará deshabilitada. Podrás restaurarla desde este listado.`,
      confirmButtonText: 'Eliminar (borrado lógico)'
    });
    if (!confirmed) return;
    await performAction(route, () => removeRoute(route._id), 'No se pudo eliminar la ruta mediante borrado lógico.');
  }

  const columns = [
    {
      key: 'title',
      label: 'Ruta',
      render: (route) => (
        <>
          <strong>{route.title}</strong>
          <span className="table-subtitle">{route.locationId?.name || route.location}</span>
          <p className="route-description">{route.description || 'Esta ruta no tiene descripción.'}</p>
          <small className="route-meta">ID: {route._id}</small>
        </>
      )
    },
    { key: 'distanceKm', label: 'Distancia', render: (route) => `${route.distanceKm} km` },
    { key: 'difficulty', label: 'Dificultad' },
    {
      key: 'status',
      label: 'Estado',
      render: (route) => {
        const status = getRouteStatus(route.status);
        return (
          <>
            <select
              className={`route-status status-${status.replace(' ', '-')}`}
              aria-label={`Estado de ${route.title}`}
              value={status}
              disabled={Boolean(route.deletedAt || pendingRoutes[route._id])}
              onChange={(event) => {
                const nextStatus = event.target.value;
                performAction(route, () => changeRouteStatus(route._id, nextStatus), 'No se pudo cambiar el estado de la ruta.');
              }}
            >
              {ROUTE_STATUS_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
            {route.deletedAt && <span className="route-deleted-label">Eliminada · borrado lógico</span>}
          </>
        );
      }
    },
    {
      key: 'isActive',
      label: 'Disponibilidad',
      render: (route) => {
        const available = !route.deletedAt && route.isActive !== false;
        return (
          <label className={`availability-control ${available ? 'is-available' : 'is-unavailable'}`}>
            <input
              type="checkbox"
              role="switch"
              aria-label={`Disponibilidad de ${route.title}`}
              aria-checked={available}
              checked={available}
              disabled={Boolean(route.deletedAt || pendingRoutes[route._id])}
              onChange={(event) => {
                const isActive = event.target.checked;
                performAction(route, () => changeRouteActivation(route._id, isActive), 'No se pudo cambiar la disponibilidad de la ruta.');
              }}
            />
            <span className="availability-switch" aria-hidden="true" />
            <span>{available ? 'Disponible' : 'No disponible'}</span>
          </label>
        );
      }
    },
    {
      key: 'createdAt',
      label: 'Fecha de alta',
      render: (route) => (
        <>
          <span>{formatDate(route.createdAt)}</span>
          <small className="route-meta">Actualizada: {formatDate(route.updatedAt)}</small>
        </>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (route) => {
        const pending = Boolean(pendingRoutes[route._id]);
        if (route.deletedAt) {
          return (
            <button
              type="button"
              className="button button-secondary button-small"
              disabled={pending}
              onClick={() => performAction(route, () => restoreRoute(route._id), 'No se pudo restaurar la ruta.')}
            >
              {pending ? 'Restaurando…' : 'Restaurar'}
            </button>
          );
        }
        return (
          <div className="card-actions">
            {pending ? <span className="button button-ghost button-small" aria-disabled="true">Editar</span> : (
              <Link className="button button-ghost button-small" to={ROUTES.routeEdit(route._id)}>Editar</Link>
            )}
            <button type="button" className="button button-danger button-small" disabled={pending} onClick={() => remove(route)}>Eliminar (borrado lógico)</button>
            {pending && <small role="status">Guardando…</small>}
          </div>
        );
      }
    }
  ];

  return (
    <section>
      <div className="page-header routes-hero">
        <div>
          <p className="eyebrow">TU PRÓXIMA AVENTURA</p>
          <h1>El camino empieza aquí.</h1>
          <p className="muted">Organiza tus rutas, marca el ritmo y sigue explorando.</p>
        </div>
        <Link className="button" to={ROUTES.routeNew}>+ Crear ruta</Link>
      </div>
      <div className="route-stats" aria-label="Resumen de rutas">
        {statistics.map(({ label, value }) => (
          <div className="route-stat" key={label}><small>{label}</small><strong>{loading ? '—' : value}</strong></div>
        ))}
      </div>
      <div className="catalog-heading">
        <div><p className="eyebrow">CUADERNO DE RUTAS</p><h2>Todas tus rutas</h2></div>
        <p className="muted">Las rutas eliminadas se conservan y se pueden restaurar.</p>
      </div>
      {error && <ErrorState message={error} onRetry={loadRoutes} />}
      {actionError && <ErrorState message={actionError} />}
      {loading ? <Skeleton rows={5} /> : !error && routes.length === 0 ? (
        <div className="empty card"><h2>No hay rutas todavía</h2><p>Crea la primera ruta para empezar.</p>
        <Link className="button" to={ROUTES.routeNew}>Crear ruta</Link></div>
      ) : !error && (
        <>
          <p className="table-scroll-hint">Desliza la tabla para cambiar el estado, la disponibilidad y ver las acciones →</p>
          <DataTable rows={routes} columns={columns} rowKey="_id" rowClassName={(route) => route.deletedAt ? 'route-row-deleted' : ''} />
        </>
      )}
    </section>
  );
}
