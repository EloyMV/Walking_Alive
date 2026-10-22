import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../routes/paths';

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container nav-wrap">
          <NavLink to={ROUTES.routes} className="brand">Rutas</NavLink>
          <nav className="nav-links">
            <NavLink to={ROUTES.routes}>Rutas</NavLink>
            <NavLink to={ROUTES.routeNew} className="button button-small">+ Nueva</NavLink>
          </nav>
        </div>
      </header>
      <main className="container main-content">
        <Outlet />
      </main>
    </div>
  );
}
