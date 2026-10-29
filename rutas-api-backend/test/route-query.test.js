import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRoutesSchema } from '../src/routes/routeRoutes.js';

test('El listado de rutas convierte includeDeleted sin activar el borrado lógico por defecto', () => {
  assert.equal(getRoutesSchema.parse({ query: {} }).query.includeDeleted, undefined);
  assert.equal(getRoutesSchema.parse({ query: { includeDeleted: 'true' } }).query.includeDeleted, true);
  assert.equal(getRoutesSchema.parse({ query: { includeDeleted: 'false' } }).query.includeDeleted, false);
  const parsed = getRoutesSchema.parse({ query: { includeDeleted: 'true', isActive: 'false', difficulty: 'fácil' } });
  assert.deepEqual(parsed.query, { includeDeleted: true, isActive: false, difficulty: 'fácil' });
});

test('El listado de rutas rechaza valores inválidos e inyección en includeDeleted', () => {
  for (const includeDeleted of ['1', 'yes', '', true, ['true'], { $ne: 'false' }]) {
    assert.equal(getRoutesSchema.safeParse({ query: { includeDeleted } }).success, false);
  }
});
