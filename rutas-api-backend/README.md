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
