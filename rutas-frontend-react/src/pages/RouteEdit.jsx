import { Link, useNavigate, useParams } from 'react-router-dom';
import RouteForm from '../features/routes/RouteForm';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';
import { useRoute, useRoutes, useRouteSubmission } from '../hooks';
import { ROUTES } from '../routes/paths';

export default function RouteEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { route, loading, error } = useRoute(id);
  const { updateRoute } = useRoutes();
  const submission = useRouteSubmission(async (data) => {
    await updateRoute(id, data);
    navigate(ROUTES.routeDetails(id));
  });

  if (loading) return <Skeleton rows={4} />;
  if (!route) return <ErrorState message={error || 'Ruta no encontrada.'} action={<Link to={ROUTES.routes}>Volver</Link>} />;

  return <section>
    <Link className="back-link" to={ROUTES.routeDetails(id)}>← Volver al detalle</Link>
    <div className="page-header compact"><div>
      <p className="eyebrow">EDITAR</p><h1>Editar ruta</h1><p className="muted">Actualiza los datos y guarda los cambios.</p>
    </div></div>
    {error && <div className="alert error">{error}</div>}
    {submission.error && <div className="alert error">{submission.error}</div>}
    <RouteForm initialValues={route} onSubmit={submission.submit} submitLabel="Guardar cambios" submitting={submission.submitting} />
  </section>;
}
