export default function Skeleton({ rows = 3 }) {
  return (
    <div className="skeleton-list" aria-label="Cargando contenido" aria-busy="true">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row card" key={index}>
          <span className="skeleton-block skeleton-icon" />
          <div className="skeleton-content">
            <span className="skeleton-block skeleton-title" />
            <span className="skeleton-block skeleton-line" />
          </div>
          <span className="skeleton-block skeleton-action" />
        </div>
      ))}
    </div>
  );
}
