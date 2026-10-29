# WalkingAlive

Proyecto para gestionar rutas senderistas y turísticas, con una API REST en Node.js y una interfaz en React.

## Estructura

- `rutas-api-backend/`: API con Express, Mongoose, validación con Zod y documentación Swagger.
- `rutas-frontend-react/`: aplicación React con Vite, React Router y formularios con React Hook Form.
- `mongodb_rutas_json/`: ejemplos de las ocho colecciones en formato MongoDB Extended JSON.

## Puesta en marcha

Necesitas Node.js compatible con la versión instalada de Vite y una instancia de MongoDB local o Atlas.

### Backend

```powershell
cd rutas-api-backend
npm install
Copy-Item .env.example .env
npm run dev
```

Configura `MONGODB_URI` en `.env`. La API se ejecuta por defecto en `http://localhost:3000` y Swagger está disponible en `http://localhost:3000/docs`.

### Frontend

En otra terminal:

```powershell
cd rutas-frontend-react
npm install
Copy-Item .env.example .env
npm run dev
```

La aplicación está disponible en `http://localhost:4200`. La variable `VITE_API_URL` apunta por defecto a `http://localhost:3000/api`.

Para generar la versión de producción: `npm run build` desde la carpeta del frontend.

## Datos de ejemplo

El backend incluye un script de datos de prueba que se ejecuta con `npm run seed`. Revisa `seed.js` antes de ejecutarlo: puede sustituir datos existentes.

Los archivos de `mongodb_rutas_json/` se pueden importar desde MongoDB Compass siguiendo `LEEME.txt`. Los identificadores, fechas e importes usan ObjectId, Date y Decimal128. Las contraseñas y las rutas de imágenes son ejemplos.

## API de rutas

| Método | Ruta | Operación |
| --- | --- | --- |
| GET | `/api/routes` | Listar rutas |
| GET | `/api/routes?includeDeleted=true` | Listar rutas, incluidas las eliminadas mediante borrado lógico |
| GET | `/api/routes/:id` | Consultar una ruta |
| POST | `/api/routes` | Crear una ruta |
| PATCH | `/api/routes/:id` | Actualizar una ruta |
| PATCH | `/api/routes/:id/is-active` | Activar o desactivar una ruta con `{ "isActive": true/false }` |
| PATCH | `/api/routes/:id/status` | Cambiar el estado a `programado`, `en curso` o `finalizado` |
| DELETE | `/api/routes/:id` | Eliminar una ruta mediante borrado lógico |
| PATCH | `/api/routes/:id/restore` | Restaurar y activar una ruta eliminada |

El listado del frontend permite cambiar el estado y la disponibilidad (`isActive`) directamente, y muestra descripción y fechas. Las rutas eliminadas permanecen visibles en gris y ofrecen la acción de restaurar. La creación y edición vuelven al listado al guardar.

Las dependencias, los archivos `.env` y las compilaciones locales quedan excluidos del repositorio. Los archivos `.env.example` documentan la configuración necesaria.
