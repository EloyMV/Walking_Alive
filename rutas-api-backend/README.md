# API REST de Rutas

API RESTful desarrollada con Node.js, Express y MongoDB para la gestión de rutas senderistas, estructurada en arquitectura de capas (`routes` -> `controllers` -> `services` -> `repositories` -> `models`).

## Requisitos Previos

- Node.js (v18 o superior)
- MongoDB ejecutándose localmente o una URI válida de MongoDB Atlas.

## Instalación y Configuración

1. Clonar o descomprimir el proyecto.
2. Instalar las dependencias:
   ```bash
   npm install
   ```
3. Configurar las variables de entorno creando un archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```

## Ejecución

- **Poblar datos de prueba (Seed):**
  ```bash
  npm run seed
  ```

- **Iniciar en modo desarrollo:**
  ```bash
  npm run dev
  ```

- **Iniciar en modo producción:**
  ```bash
  npm start
  ```

## Documentación API

Con el servidor en marcha, la interfaz de **Swagger UI** está disponible en:
`http://localhost:3000/docs`

## Endpoints

- `GET /api/routes`: Listar todas las rutas.
- `GET /api/routes/:id`: Obtener el detalle de una ruta por ID.
- `POST /api/routes`: Crear una nueva ruta.
- `PATCH /api/routes/:id`: Actualizar datos de una ruta existente.
- `DELETE /api/routes/:id`: Eliminar una ruta.

## Repositorios y pruebas

Las ocho entidades del seed tienen repositorio en `src/repositories`. Los nuevos repositorios comparten `createRepository`, basado en el repositorio de rutas, con consultas por ID y slug, creación, actualización, borrado lógico, restauración y cambios de estado/actividad. Las relaciones se cargan excluyendo documentos borrados. Los campos de auditoría no se aceptan como datos de escritura.

En los nuevos repositorios, `findAll(filter)` permite filtrar por referencias, por ejemplo `variantRepository.findAll({ routeId })` o `imageRepository.findAll({ routeId })`. La validación de esquema se ejecuta al guardar; la generación de slugs y la validación de existencia de relaciones pertenecen al servicio.

Ejecuta `npm test` desde `rutas-api-backend`. Las pruebas requieren MongoDB en `127.0.0.1:27017`, o una URI mediante `TEST_MONGODB_URI`. Cada ejecución crea una base temporal independiente y la elimina al terminar. Comprueban los ocho repositorios y la integración con RouteService. Para validar el seed sin modificar la base de datos: `npm run seed -- --dry-run`.
