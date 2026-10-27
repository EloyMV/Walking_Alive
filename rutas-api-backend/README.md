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

Los recursos disponibles son `/api/roles`, `/api/users`, `/api/categories`, `/api/locations`, `/api/guides`, `/api/routes`, `/api/variants` y `/api/images`.

Todos ofrecen estas operaciones (sustituye `:recurso` por el nombre correspondiente):

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/api/:recurso` | Listado con filtros por query, respuesta 200 |
| GET | `/api/:recurso/slug/:slug` | Consulta por slug, respuesta 200 |
| GET | `/api/:recurso/:id` | Consulta por ID, respuesta 200 |
| POST | `/api/:recurso` | Creación, respuesta 201 |
| PATCH | `/api/:recurso/:id` | Actualización parcial, respuesta 200 |
| PATCH | `/api/:recurso/:id/is-active` | Activación mediante `{ "isActive": true }` |
| PATCH | `/api/:recurso/:id/status` | Cambio de estado mediante `{ "status": "published" }` |
| PATCH | `/api/:recurso/:id/restore` | Restauración, respuesta 200 |
| DELETE | `/api/:recurso/:id` | Borrado lógico, respuesta 204 sin cuerpo; puede repetirse |

Usuarios, guías, rutas, variantes e imágenes también ofrecen `PATCH /api/:recurso/:id/associations`. Acepta únicamente los campos de relación de la entidad, por ejemplo `{ "roleId": "<ObjectId>" }` para usuarios. Las referencias obligatorias no admiten `null`; las opcionales permiten desvincular con `null`.

Los cuerpos y filtros se validan antes de llegar al servicio. Los IDs o datos inválidos devuelven 400, los documentos o relaciones inexistentes 404 y los conflictos de unicidad 409. Los campos desconocidos, `slug` y los campos de auditoría se rechazan en los cuerpos HTTP.

Cada archivo `src/routes/*Routes.js` importa `z` de `zod`, define sus esquemas de parámetros, cuerpos y filtros y los aplica a cada endpoint con `validateRequest(schema)`. El middleware usa `safeParse` y entrega al controlador los datos ya validados y transformados. Las reglas de validación HTTP se mantienen dentro del archivo de rutas de su entidad.

Ejemplos de filtros: `/api/variants?routeId=<ObjectId>&includesTransport=false`, `/api/images?categoryId=<ObjectId>` y `/api/locations?isActive=true`. Los booleanos de las consultas deben ser `true` o `false`. Swagger en `/docs` contiene las operaciones, campos y filtros de cada recurso.

## Repositorios y pruebas

Las ocho entidades del seed tienen repositorio en `src/repositories`. Los nuevos repositorios comparten `createRepository`, basado en el repositorio de rutas, con consultas por ID y slug, creación, actualización, borrado lógico, restauración y cambios de estado/actividad. Las relaciones se cargan excluyendo documentos borrados. Los campos de auditoría no se aceptan como datos de escritura.

En los nuevos repositorios, `findAll(filter)` permite filtrar por referencias, por ejemplo `variantRepository.findAll({ routeId })` o `imageRepository.findAll({ routeId })`. La validación de esquema se ejecuta al guardar; la generación de slugs y la validación de existencia de relaciones pertenecen al servicio.

Ejecuta `npm test` desde `rutas-api-backend`. Las pruebas requieren MongoDB en `127.0.0.1:27017`, o una URI mediante `TEST_MONGODB_URI`. Cada ejecución crea una base temporal independiente y la elimina al terminar. Comprueban los ocho repositorios y la integración con RouteService. Para validar el seed sin modificar la base de datos: `npm run seed -- --dry-run`.

## Servicios

Cada entidad tiene un servicio exportado desde `src/services/<entidad>Service.js`. Los siete nuevos servicios comparten `EntityService` para mantener las validaciones y las operaciones comunes.

| Servicio | Relaciones que valida |
| --- | --- |
| `roleService` | Sin referencias directas |
| `userService` | `roleId` obligatorio hacia un rol existente |
| `categoryService` | Imágenes mediante `categoryId` |
| `locationService` | Imágenes mediante `locationId` |
| `guideService` | `userId` obligatorio hacia un usuario existente; imágenes mediante `guideId` |
| `variantService` | `routeId` obligatorio hacia una ruta existente; imágenes mediante `variantId` |
| `imageService` | Referencias opcionales `routeId`, `variantId`, `categoryId`, `locationId` y `guideId` |

Los métodos siguen el patrón de rutas: `createUser`, `getAllUsers`, `getUserById`, `getUserBySlug`, `updateUser` y `deleteUser`, con los nombres correspondientes en cada servicio. También ofrecen `updateAssociations`, `changeStatus`, `changeIsActive`, `softDelete` y `restoreDelete`. Los slugs se generan automáticamente; los campos de auditoría se ignoran en los payloads. Los conflictos de email y SKU devuelven un error 409.

Las referencias enviadas deben apuntar a documentos no borrados. Al actualizar o restaurar se comprueban las referencias efectivas, incluidas las que ya estaban guardadas. El borrado es lógico y no se propaga a otras entidades; `deleteUser` y sus equivalentes informan si el documento ya estaba borrado.

Categorías, ubicaciones, guías y variantes admiten `imageUrl` al crear o actualizar y devuelven sus imágenes activas en `images`. Enviar `null` o un texto vacío desactiva la portada. `imageService` permite gestionar las imágenes directamente con los campos del modelo, incluido `url`.

`userService` recibe `passwordHash` ya calculado y lo excluye de todas sus respuestas. Las pruebas cubren repositorios, servicios y peticiones HTTP reales a los ocho recursos, con una base temporal independiente por archivo de pruebas.
