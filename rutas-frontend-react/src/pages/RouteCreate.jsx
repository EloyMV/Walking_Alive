import { Link, useNavigate } from 'react-router-dom';
import RouteForm from '../features/routes/RouteForm';
import { useRoutes, useRouteSubmission } from '../hooks';
import { ROUTES } from '../routes/paths';

export default function RouteCreate() {
  const navigate = useNavigate();
  const { createRoute } = useRoutes();
  const { error, submitting, submit } = useRouteSubmission(async (data) => {
    const created = await createRoute(data);
    navigate(ROUTES.routeDetails(created._id));
  });

  return <section>
    <Link className="back-link" to={ROUTES.routes}>← Volver</Link>
    <div className="page-header compact"><div>
      <p className="eyebrow">NUEVA</p><h1>Crear ruta</h1><p className="muted">Añade una ruta al catálogo.</p>
    </div></div>
    {error && <div className="alert error">{error}</div>}
    <RouteForm onSubmit={submit} submitLabel="Crear ruta" submitting={submitting} />
  </section>;
}
