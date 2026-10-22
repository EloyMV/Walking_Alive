import { useState } from 'react';
import { Link } from 'react-router-dom';
import DataTable from '../components/DataTable';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';
import { useRoutes } from '../hooks';
import { ROUTES } from '../routes/paths';
import { confirmAction } from '../utils/sweetAlert';

export default function RouteList() {
  const { routes, loading, error, loadRoutes, removeRoute } = useRoutes();
  const [deleteError, setDeleteError] = useState('');

  async function remove(route) {
    const confirmed = await confirmAction({
      title: '¿Eliminar esta ruta?',
      text: `Se eliminará “${route.title}”.`,
      confirmButtonText: 'Eliminar'
    });
    if (!confirmed) return;
    setDeleteError('');
    try {
      await removeRoute(route._id);
    } catch (err) {
      setDeleteError(err.message || 'No se pudo eliminar la ruta.');
    }
  }

  const columns = [
    {
      key: 'title',
      label: 'Ruta',
      render: (route) => <><strong>{route.title}</strong><span className="table-subtitle">{route.location}</span></>
    },
    { key: 'distanceKm', label: 'Distancia', render: (route) => `${route.distanceKm} km` },
    { key: 'difficulty', label: 'Dificultad' },
    {
      key: 'actions',
      label: 'Acciones',
      render: (route) => (
        <div className="card-actions">
          <Link className="button button-secondary button-small" to={ROUTES.routeDetails(route._id)}>Ver</Link>
          <Link className="button button-ghost button-small" to={ROUTES.routeEdit(route._id)}>Editar</Link>
          <button className="button button-danger button-small" onClick={() => remove(route)}>Eliminar</button>
        </div>
      )
    }
  ];

  return (
    <section>
      <div className="page-header">
        <div><p className="eyebrow">CATÁLOGO</p><h1>Rutas</h1><p className="muted">Gestiona las rutas disponibles.</p></div>
        <Link className="button" to={ROUTES.routeNew}>+ Crear ruta</Link>
      </div>
      {error && <ErrorState message={error} onRetry={loadRoutes} />}
      {deleteError && <ErrorState message={deleteError} />}
      {loading ? <Skeleton rows={5} /> : !error && routes.length === 0 ? (
        <div className="empty card"><h2>No hay rutas todavía</h2><p>Crea la primera ruta para empezar.</p>
        <Link className="button" to={ROUTES.routeNew}>Crear ruta</Link></div>
      ) : !error && <DataTable rows={routes} columns={columns} rowKey="_id" />}
    </section>
  );
}
