import { Component } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error no controlado en la interfaz:', error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="container main-content">
          <div className="alert error" role="alert">
            <span>{getErrorMessage(this.state.error, 'La aplicación no pudo mostrar esta página.')}</span>
            <button className="button button-ghost button-small" onClick={() => window.location.reload()}>
              Recargar aplicación
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
