import { Link, useNavigate } from 'react-router-dom';
import RouteForm from '../features/routes/RouteForm';
import ErrorState from '../components/ErrorState';
import { useCategories, useGuides, useLocations, useRoutes, useRouteSubmission, useUsers } from '../hooks';
import { ROUTES } from '../routes/paths';

export default function RouteCreate() {
  const navigate = useNavigate();
  const { createRoute } = useRoutes();
  const { categories, loading: loadingCategories, error: categoriesError, reload: reloadCategories } = useCategories();
  const { locations, loading: loadingLocations, error: locationsError, reload: reloadLocations } = useLocations();
  const { guides, loading: loadingGuides, error: guidesError, reload: reloadGuides } = useGuides();
  const { users, loading: loadingUsers, error: usersError, reload: reloadUsers } = useUsers();
  const loadingRelations = loadingCategories || loadingLocations || loadingGuides || loadingUsers;
  const relationErrors = [
    { label: 'Categorías', error: categoriesError, reload: reloadCategories },
    { label: 'Ubicaciones', error: locationsError, reload: reloadLocations },
    { label: 'Guías', error: guidesError, reload: reloadGuides },
    { label: 'Usuarios', error: usersError, reload: reloadUsers }
  ].filter(({ error }) => error);
  const { error, submitting, submit } = useRouteSubmission(async (data) => {
    await createRoute(data);
    navigate(ROUTES.routes);
  });

  return <section>
    <Link className="back-link" to={ROUTES.routes}>← Volver</Link>
    <div className="page-header compact"><div>
      <p className="eyebrow">NUEVA</p><h1>Crear ruta</h1><p className="muted">Añade una ruta al catálogo.</p>
    </div></div>
    {error && <div className="alert error">{error}</div>}
    {loadingRelations && <p className="muted" role="status">Cargando categorías, ubicaciones, guías y usuarios…</p>}
    {relationErrors.map(({ label, error, reload }) => (
      <ErrorState key={label} message={`${label}: ${error}`} onRetry={reload} />
    ))}
    <RouteForm
      categories={categories}
      locations={locations}
      guides={guides}
      users={users}
      loadingRelations={loadingRelations}
      relationsError={relationErrors.length > 0}
      onSubmit={submit}
      submitLabel="Crear ruta"
      submitting={submitting}
    />
  </section>;
}
