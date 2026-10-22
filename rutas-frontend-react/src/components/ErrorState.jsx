export default function ErrorState({ message, action, onRetry }) {
  return (
    <div className="alert error" role="alert">
      <span>{message}</span>
      {action || (onRetry && <button className="button button-ghost button-small" onClick={onRetry}>Reintentar</button>)}
    </div>
  );
}
