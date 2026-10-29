import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../components/Layout';
import Skeleton from '../components/Skeleton';
import { ROUTES } from './paths';

const RouteList = lazy(() => import('../pages/RouteList'));
const RouteCreate = lazy(() => import('../pages/RouteCreate'));
const RouteEdit = lazy(() => import('../pages/RouteEdit'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<main className="container main-content"><Skeleton rows={4} /></main>}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to={ROUTES.routes} replace />} />
          <Route path={ROUTES.routes} element={<RouteList />} />
          <Route path={ROUTES.routeNew} element={<RouteCreate />} />
          <Route path={ROUTES.routeEdit()} element={<RouteEdit />} />
          <Route path="*" element={<Navigate to={ROUTES.routes} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
