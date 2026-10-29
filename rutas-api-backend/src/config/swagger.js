import swaggerUi from 'swagger-ui-express';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import { Category } from '../models/Category.js';
import { Location } from '../models/Location.js';
import { Guide } from '../models/Guide.js';
import { Route } from '../models/Route.js';
import { Variant } from '../models/Variant.js';
import { Image } from '../models/Image.js';

const resources = [
  { path: 'roles', model: Role },
  { path: 'users', model: User, associations: ['roleId'] },
  { path: 'categories', model: Category, images: true },
  { path: 'locations', model: Location, images: true },
  { path: 'guides', model: Guide, associations: ['userId'], images: true },
  {
    path: 'routes', model: Route, images: true,
    associations: ['categoryId', 'locationId', 'guideId', 'createdByUserId'],
    filters: ['categoryId', 'locationId', 'guideId', 'createdByUserId', 'difficulty', 'status', 'isActive']
  },
  { path: 'variants', model: Variant, associations: ['routeId'], images: true },
  { path: 'images', model: Image, associations: ['routeId', 'variantId', 'categoryId', 'locationId', 'guideId'] }
];
const protectedFields = new Set(['_id', 'id', 'slug', 'deletedAt', 'createdAt', 'updatedAt', '__v']);
const limit = (value) => Array.isArray(value) ? value[0] : value;

// Documentar los campos de los modelos sin exponer campos de auditoría como entradas.
const propertyFor = (path) => {
  const options = path.options;
  let schema;
  switch (path.instance) {
    case 'ObjectId': schema = { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }; break;
    case 'Boolean': schema = { type: 'boolean' }; break;
    case 'Number':
      schema = { type: path.validators.some(({ validator }) => validator === Number.isInteger) ? 'integer' : 'number' };
      if (options.min !== undefined) schema.minimum = limit(options.min);
      if (options.max !== undefined) schema.maximum = limit(options.max);
      break;
    case 'Decimal128':
      schema = { oneOf: [{ type: 'string', pattern: '^\\d+(\\.\\d+)?$' }, { type: 'number', minimum: 0 }], example: '12.50' };
      break;
    case 'Date': schema = { type: 'string', format: 'date-time' }; break;
    default:
      schema = { type: 'string' };
      if (options.minlength !== undefined) schema.minLength = limit(options.minlength);
      if (options.maxlength !== undefined) schema.maxLength = limit(options.maxlength);
      if (path.enumValues?.length) schema.enum = path.enumValues;
      if (options.match) schema.pattern = options.match.source;
  }
  if (options.default === null) schema.nullable = true;
  else if (options.default !== undefined && typeof options.default !== 'function') schema.default = options.default;
  if (path.path === 'passwordHash') {
    schema.writeOnly = true;
    schema.description = 'Hash ya calculado; nunca se devuelve en las respuestas.';
  }
  return schema;
};
const jsonBody = (schema) => ({ required: true, content: { 'application/json': { schema } } });
const idParameter = { name: 'id', in: 'path', required: true, schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' } };
const responses = (status) => ({
  [status]: { description: status === 204 ? 'Borrado lógico completado, incluso si ya estaba borrado' : 'Operación completada' },
  400: { description: 'Petición inválida' },
  404: { description: 'Documento o relación no encontrados' },
  409: { description: 'Conflicto con un campo único' }
});
export const swaggerDocument = {
  openapi: '3.0.0',
  info: { title: 'Rutas API', version: '1.0.0', description: 'Gestión de rutas y entidades relacionadas' },
  servers: [{ url: 'http://localhost:3000/api', description: 'Servidor local' }],
  paths: {},
  components: { schemas: {} }
};

for (const resource of resources) {
  const { path, model, associations, images } = resource;
  const properties = {};
  const required = [];
  model.schema.eachPath((name, schemaPath) => {
    if (protectedFields.has(name)) return;
    properties[name] = propertyFor(schemaPath);
    // El estado tiene un default y los cuerpos HTTP permiten omitirlo.
    if (name !== 'status' && schemaPath.options.required && typeof schemaPath.options.required !== 'function') required.push(name);
  });
  if (model === Route) {
    for (const field of associations) properties[field].nullable = true;
  }
  if (images) properties.imageUrl = { type: 'string', nullable: true, description: 'Portada; null o texto vacío la desactiva.' };
  const input = { type: 'object', additionalProperties: false, properties, required };
  if (model === Route) input.anyOf = [{ required: ['location'] }, { required: ['locationId'] }];
  swaggerDocument.components.schemas[`${model.modelName}Input`] = input;
  swaggerDocument.components.schemas[`${model.modelName}Update`] = {
    type: 'object', additionalProperties: false, properties, minProperties: 1
  };
  const ref = (suffix) => ({ $ref: `#/components/schemas/${model.modelName}${suffix}` });
  const operation = (summary, status, extra = {}) => ({ tags: [path], summary, responses: responses(status), ...extra });
  const queryProperties = { ...properties, _id: idParameter.schema, slug: { type: 'string' } };
  const filters = resource.filters || Object.keys(queryProperties).filter((key) => !['passwordHash', 'imageUrl'].includes(key));
  swaggerDocument.paths[`/${path}`] = {
    get: operation('Listar y filtrar', 200, {
      parameters: filters.map((name) => {
        const schema = { ...queryProperties[name] };
        delete schema.default;
        delete schema.nullable;
        return { name, in: 'query', schema };
      })
    }),
    post: operation('Crear', 201, { requestBody: jsonBody(ref('Input')) })
  };
  swaggerDocument.paths[`/${path}/slug/{slug}`] = {
    get: operation('Consultar por slug', 200, { parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }] })
  };
  swaggerDocument.paths[`/${path}/{id}`] = {
    parameters: [idParameter],
    get: operation('Consultar por ID', 200),
    patch: operation('Actualizar campos', 200, { requestBody: jsonBody(ref('Update')) }),
    delete: operation('Borrar lógicamente', 204)
  };
  for (const [suffix, field, schema] of [
    ['is-active', 'isActive', { type: 'boolean' }],
    ['status', 'status', model === Route ? properties.status : { type: 'string', minLength: 1, maxLength: 50 }]
  ]) {
    swaggerDocument.paths[`/${path}/{id}/${suffix}`] = {
      parameters: [idParameter],
      patch: operation(`Cambiar ${field}`, 200, { requestBody: jsonBody({ type: 'object', additionalProperties: false, properties: { [field]: schema }, required: [field] }) })
    };
  }
  swaggerDocument.paths[`/${path}/{id}/restore`] = { parameters: [idParameter], patch: operation('Restaurar un documento borrado', 200) };
  if (associations) {
    const associationProperties = Object.fromEntries(associations.map((field) => [field, { ...properties[field], nullable: model === Route || model === Image }]));
    swaggerDocument.paths[`/${path}/{id}/associations`] = {
      parameters: [idParameter],
      patch: operation('Actualizar asociaciones', 200, {
        requestBody: jsonBody({ type: 'object', additionalProperties: false, minProperties: 1, properties: associationProperties })
      })
    };
  }
}

export const setupSwagger = (app) => {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};
