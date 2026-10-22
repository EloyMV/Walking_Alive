import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Rutas API',
    version: '1.0.0',
    description: 'API REST para la gestión de rutas senderistas y de montaña'
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor Local'
    }
  ],
  paths: {
    '/routes': {
      get: {
        summary: 'Obtener todas las rutas',
        responses: {
          200: { description: 'Lista de rutas recuperada con éxito' }
        }
      },
      post: {
        summary: 'Crear una nueva ruta',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RouteInput' }
            }
          }
        },
        responses: {
          201: { description: 'Ruta creada con éxito' },
          400: { description: 'Datos de entrada inválidos' }
        }
      }
    },
    '/routes/{id}': {
      get: {
        summary: 'Obtener una ruta por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Ruta encontrada' },
          404: { description: 'Ruta no encontrada' }
        }
      },
      patch: {
        summary: 'Actualizar una ruta',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RouteInput' }
            }
          }
        },
        responses: {
          200: { description: 'Ruta actualizada' },
          404: { description: 'Ruta no encontrada' }
        }
      },
      delete: {
        summary: 'Eliminar una ruta',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Ruta eliminada' },
          404: { description: 'Ruta no encontrada' }
        }
      }
    }
  },
  components: {
    schemas: {
      RouteInput: {
        type: 'object',
        required: ['title', 'location', 'distanceKm', 'difficulty'],
        properties: {
          title: { type: 'string', example: 'Ruta del Cares' },
          location: { type: 'string', example: 'Picos de Europa, Asturias' },
          distanceKm: { type: 'number', example: 12.5 },
          difficulty: { type: 'string', enum: ['fácil', 'moderada', 'difícil'], example: 'moderada' },
          description: { type: 'string', example: 'Espectacular ruta por la garganta del río Cares.' }
        }
      }
    }
  }
};

export const setupSwagger = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
