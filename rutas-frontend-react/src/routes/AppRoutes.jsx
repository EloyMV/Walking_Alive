import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout';
import Skeleton from '../components/Skeleton';
import { ROUTES } from './paths';
import { entityConfigs } from '../features/entities/entityConfigs';

const RouteList = lazy(() => import('../pages/RouteList'));
const RouteCreate = lazy(() => import('../pages/RouteCreate'));
const RouteEdit = lazy(() => import('../pages/RouteEdit'));
const EntityList = lazy(() => import('../pages/EntityList'));
const EntityEditor = lazy(() => import('../pages/EntityEditor'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<main className="container main-content"><Skeleton rows={4} /></main>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to={ROUTES.routes} replace />} />
          <Route path={ROUTES.routes} element={<RouteList />} />
          <Route path={ROUTES.routeNew} element={<RouteCreate />} />
          <Route path={ROUTES.routeEdit()} element={<RouteEdit />} />
          {entityConfigs.map((config) => <Route key={config.key} path={`/${config.key}`} element={<EntityList key={config.key} config={config} />} />)}
          {entityConfigs.map((config) => <Route key={`${config.key}-new`} path={`/${config.key}/new`} element={<EntityEditor key={`${config.key}-new`} config={config} />} />)}
          {entityConfigs.map((config) => <Route key={`${config.key}-edit`} path={`/${config.key}/:id/edit`} element={<EntityEditor key={`${config.key}-edit`} config={config} editing />} />)}
          <Route path="*" element={<Navigate to={ROUTES.routes} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
