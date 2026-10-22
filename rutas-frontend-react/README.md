# Rutas — Frontend React

Frontend React + Vite conectado a la API REST de rutas.

## Requisitos
- Node.js 18+
- API ejecutándose en `http://localhost:3000`

## Instalación

```bash
npm install
copy .env.example .env
npm run dev
```

La aplicación queda disponible en `http://localhost:4200`.

## API

Por defecto:

```env
VITE_API_URL=http://localhost:3000/api
```

## Estructura

```text
src/
  components/   # DataTable, ErrorBoundary, ErrorState, Skeleton
  context/
  features/
    routes/     # Formulario reutilizable y esquema Zod
  hooks/
  pages/
  routes/
  services/     # API y servicios por dominio
  utils/        # Gestión de errores y SweetAlert
```

El router carga las páginas de forma diferida. El formulario de rutas se comparte entre creación y edición y valida los datos con Zod.
