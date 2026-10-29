import { Link, useNavigate, useParams } from 'react-router-dom';
import RouteForm from '../features/routes/RouteForm';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';
import { useCategories, useGuides, useLocations, useRoute, useRoutes, useRouteSubmission, useUsers } from '../hooks';
import { ROUTES } from '../routes/paths';

export default function RouteEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { route, loading, error } = useRoute(id);
  const { updateRoute } = useRoutes();
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
  const submission = useRouteSubmission(async (data) => {
    await updateRoute(id, data);
    navigate(ROUTES.routes);
  });

  if (loading) return <Skeleton rows={4} />;
  if (!route) return <ErrorState message={error || 'Ruta no encontrada.'} action={<Link to={ROUTES.routes}>Volver</Link>} />;

  return <section>
    <Link className="back-link" to={ROUTES.routes}>← Volver al listado</Link>
    <div className="page-header compact"><div>
      <p className="eyebrow">EDITAR</p><h1>Editar ruta</h1><p className="muted">Actualiza los datos y guarda los cambios.</p>
    </div></div>
    {error && <div className="alert error">{error}</div>}
    {submission.error && <div className="alert error">{submission.error}</div>}
    {loadingRelations && <p className="muted" role="status">Cargando categorías, ubicaciones, guías y usuarios…</p>}
    {relationErrors.map(({ label, error, reload }) => (
      <ErrorState key={label} message={`${label}: ${error}`} onRetry={reload} />
    ))}
    <RouteForm
      initialValues={route}
      categories={categories}
      locations={locations}
      guides={guides}
      users={users}
      loadingRelations={loadingRelations}
      relationsError={relationErrors.length > 0}
      onSubmit={submission.submit}
      submitLabel="Guardar cambios"
      submitting={submission.submitting}
    />
  </section>;
}
