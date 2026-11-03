import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCategories, useGuides, useLocations, useRoles, useRoutes, useUsers, useVariants, useEntityRecord } from '../hooks';
import EntityForm from '../features/entities/EntityForm';
import { entityResources } from '../features/entities/entityResources';
import ErrorState from '../components/ErrorState';
import Skeleton from '../components/Skeleton';

export default function EntityEditor({ config, editing = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const resource = entityResources[config.key];
  const useCollection = resource.useCollection;
  const collection = useCollection({ enabled: false });
  const record = useEntityRecord(resource.service, editing ? id : null);
  const requiredRelations = new Set(config.fields.filter(({ type }) => type === 'relation').map(({ relation }) => relation));
  const roles = useRoles({ enabled: requiredRelations.has('roles') });
  const users = useUsers({ enabled: requiredRelations.has('users') });
  const categories = useCategories({ enabled: requiredRelations.has('categories') });
  const locations = useLocations({ enabled: requiredRelations.has('locations') });
  const guides = useGuides({ enabled: requiredRelations.has('guides') });
  const variants = useVariants({ enabled: requiredRelations.has('variants') });
  const routes = useRoutes();
  const states = { roles, users, categories, locations, guides, variants, routes: { items: routes.routes.filter((route) => !route.deletedAt), loading: routes.loading, error: routes.error, reload: routes.loadRoutes } };
  const relationStates = [...requiredRelations].map((key) => ({ key, ...states[key] }));
  const relations = Object.fromEntries(relationStates.map(({ key, items }) => [key, items]));
  const relationsLoading = relationStates.some(({ loading }) => loading);
  const relationErrors = relationStates.filter(({ error }) => error);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function submit(data) {
    setSubmitting(true);
    setSubmitError('');
    try {
      if (editing) await collection.updateItem(id, data);
      else await collection.createItem(data);
      navigate(`/${config.key}`);
    } catch (error) {
      setSubmitError(error.message || 'No se pudo guardar el registro.');
    } finally { setSubmitting(false); }
  }

  if (editing && record.loading) return <Skeleton rows={4} />;
  if (editing && (record.error || !record.item)) return <ErrorState message={record.error || 'Registro no encontrado.'} onRetry={record.reload} action={<Link to={`/${config.key}`}>Volver al listado</Link>} />;

  return <section>
    <Link className="back-link" to={`/${config.key}`}>← Volver a {config.plural.toLowerCase()}</Link>
    <div className="page-header compact"><div><p className="eyebrow">{config.plural.toUpperCase()}</p><h1>{editing ? 'Editar' : 'Crear'} {config.singular}</h1><p className="muted">{config.description}</p></div></div>
    {submitError && <ErrorState message={submitError} />}
    {relationsLoading && <p className="muted" role="status">Cargando opciones relacionadas…</p>}
    {relationErrors.map(({ key, error, reload }) => <ErrorState key={key} message={error} onRetry={reload} />)}
    <EntityForm key={editing ? id : 'new'} config={config} editing={editing} initialValues={editing ? record.item : undefined} relations={relations} relationsLoading={relationsLoading} relationsError={relationErrors.length > 0} onSubmit={submit} submitting={submitting} />
  </section>;
}
