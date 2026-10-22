import { Link, useNavigate, useParams } from 'react-router-dom';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';
import { useRoute, useRoutes } from '../hooks';
import { ROUTES } from '../routes/paths';
import { confirmAction } from '../utils/sweetAlert';

export default function RoutePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { route, loading, error, setError } = useRoute(id);
  const { removeRoute } = useRoutes();

  async function remove() {
    const confirmed = await confirmAction({
      title: '¿Eliminar esta ruta?',
      text: 'Esta acción no se puede deshacer.',
      confirmButtonText: 'Eliminar'
    });
    if (!confirmed) return;
    try {
      await removeRoute(id);
      navigate(ROUTES.routes);
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la ruta.');
    }
  }

  if (loading) return <Skeleton rows={4} />;
  if (error) return <ErrorState message={error} action={<Link to={ROUTES.routes}>Volver al listado</Link>} />;
  if (!route) return <ErrorState message="Ruta no encontrada." action={<Link to={ROUTES.routes}>Volver al listado</Link>} />;

  return (
    <section className="detail-page">
      <Link className="back-link" to={ROUTES.routes}>← Volver a rutas</Link>
      <div className="detail-hero card">
        <div className="detail-icon">✦</div>
        <div><span className="city">{route.location}</span>
        <h1>{route.title}</h1>
        <div className="price">{route.distanceKm} km · {route.difficulty}</div></div>
      </div>
      <div className="card detail-body">
        <h2>Descripción</h2><p>{route.description || 'Esta ruta no tiene descripción.'}</p>
        <dl className="metadata">
          <div><dt>ID</dt><dd>{route._id}</dd></div>
          <div><dt>Creada</dt><dd>{new Date(route.createdAt).toLocaleString('es-ES')}</dd></div>
          <div><dt>Última actualización</dt><dd>{new Date(route.updatedAt).toLocaleString('es-ES')}</dd></div>
        </dl>
        <div className="form-actions">
          <Link className="button" to={ROUTES.routeEdit(id)}>Editar</Link>
          <button className="button button-danger" onClick={remove}>Eliminar</button>
        </div>
      </div>
    </section>
  );
}
