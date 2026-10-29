import { NavLink, Outlet } from 'react-router-dom';
import { ROUTES } from '../routes/paths';

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="container nav-wrap">
          <NavLink to={ROUTES.routes} className="brand" aria-label="WalkingAlive, inicio">
            <span className="brand-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none">
                <path d="M3 23 12 8l6 10 4-7 7 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m9 13 3 2 3-2M14 27c7-1 10-4 3-6-4-2-2-4 1-5" stroke="#e7a663" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="brand-wordmark">
              <span className="brand-name">Walking<em>Alive</em></span>
              <span className="brand-tagline">Más caminos. Más vida.</span>
            </span>
          </NavLink>
          <nav className="nav-links" aria-label="Navegación principal">
            <NavLink to={ROUTES.routes} end>Explorar rutas</NavLink>
            <NavLink to={ROUTES.routeNew} className="button button-small">+ Nueva ruta</NavLink>
          </nav>
        </div>
      </header>
      <main className="container main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-wrap">
          <strong>WalkingAlive</strong>
          <span>Deja que el camino te sorprenda.</span>
          <span>Hecho para salir ahí fuera.</span>
        </div>
      </footer>
    </div>
  );
}
