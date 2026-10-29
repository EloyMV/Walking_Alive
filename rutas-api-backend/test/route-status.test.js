import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { Route } from '../src/models/Route.js';
import { routeService } from '../src/services/routeService.js';
import { changeStatusSchema, createRouteSchema, getRoutesSchema, updateRouteSchema } from '../src/routes/routeRoutes.js';

const statuses = ['programado', 'en curso', 'finalizado'];
const id = '507f1f77bcf86cd799439011';
const payload = { title: 'Ruta de estados', location: 'Asturias', distanceKm: 8, difficulty: 'moderada' };

test('Los esquemas de rutas solo admiten los tres estados de la actividad', async () => {
  for (const status of statuses) {
    assert.ok(createRouteSchema.safeParse({ body: { ...payload, status } }).success);
    assert.ok(updateRouteSchema.safeParse({ params: { id }, body: { status } }).success);
    assert.ok(changeStatusSchema.safeParse({ params: { id }, body: { status } }).success);
    assert.ok(getRoutesSchema.safeParse({ query: { status } }).success);
  }
  for (const status of ['active', 'published', 'draft', 'otro', '', null, true]) {
    assert.equal(createRouteSchema.safeParse({ body: { ...payload, status } }).success, false);
    assert.equal(updateRouteSchema.safeParse({ params: { id }, body: { status } }).success, false);
    assert.equal(changeStatusSchema.safeParse({ params: { id }, body: { status } }).success, false);
    assert.equal(getRoutesSchema.safeParse({ query: { status } }).success, false);
    await assert.rejects(new Route({ ...payload, slug: 'invalid-status', status }).validate(), { name: 'ValidationError' });
  }
});

test('Estados de rutas con MongoDB: persistencia, disponibilidad independiente y compatibilidad heredada', async (t) => {
  const dbName = `rutas_status_test_${process.pid}_${Date.now()}`;
  await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017', { dbName, serverSelectionTimeoutMS: 5000 });
  let server;
  try {
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/routes`;
    const request = async (method, path, expected, body) => {
      const response = await fetch(baseUrl + path, {
        method, headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      assert.equal(response.status, expected, `${method} ${path}`);
      return expected === 204 ? null : response.json();
    };
    const created = await request('POST', '', 201, payload);
    assert.equal(created.status, 'programado');
    const path = `/${created._id}`;
    await t.test('Cambiar el estado conserva isActive y cambiar isActive conserva el estado', async () => {
      await request('PATCH', `${path}/is-active`, 200, { isActive: false });
      for (const status of statuses) {
        const changed = await request('PATCH', `${path}/status`, 200, { status });
        assert.equal(changed.status, status);
        assert.equal(changed.isActive, false);
        const reloaded = await request('GET', path, 200);
        assert.equal(reloaded.status, status);
        assert.equal(reloaded.isActive, false);
      }
      const activated = await request('PATCH', `${path}/is-active`, 200, { isActive: true });
      assert.equal(activated.status, 'finalizado');
      assert.equal(activated.isActive, true);
      await request('DELETE', path, 204);
      const restored = await request('PATCH', `${path}/restore`, 200);
      assert.equal(restored.status, 'finalizado');
      assert.equal(restored.isActive, true);
    });
    await t.test('Las escrituras y consultas nuevas rechazan estados desconocidos', async () => {
      for (const status of ['active', 'published', 'otro']) {
        await request('PATCH', `${path}/status`, 400, { status });
        await request('PATCH', path, 400, { status });
        await request('POST', '', 400, { ...payload, title: `Estado inválido ${status}`, status });
        await request('GET', `?status=${status}`, 400);
        await assert.rejects(routeService.changeStatus(created._id, status), { statusCode: 400 });
        await assert.rejects(routeService.createRoute({ ...payload, status }), { statusCode: 400 });
        await assert.rejects(routeService.updateRoute(created._id, { status }), { statusCode: 400 });
      }
    });
    await t.test('Los datos antiguos se leen como programado sin reescribir la base y se pueden editar/restaurar', async () => {
      const legacyStatuses = ['active', 'published', 'draft'];
      const legacyIds = [];
      for (const [index, status] of legacyStatuses.entries()) {
        const _id = new mongoose.Types.ObjectId();
        legacyIds.push(_id);
        await Route.collection.insertOne({ ...payload, _id, title: `Ruta antigua ${index}`, slug: `ruta-antigua-${index}`, status, isActive: false, deletedAt: null, createdAt: new Date(), updatedAt: new Date() });
      }
      const listed = await request('GET', '', 200);
      const planned = await request('GET', '?status=programado', 200);
      for (const [index, _id] of legacyIds.entries()) {
        assert.equal(listed.find((route) => route._id === String(_id)).status, 'programado');
        assert.ok(planned.some((route) => route._id === String(_id)));
        assert.equal((await Route.collection.findOne({ _id })).status, legacyStatuses[index]);
        const active = await request('PATCH', `/${_id}/is-active`, 200, { isActive: true });
        assert.equal(active.status, 'programado');
        await request('DELETE', `/${_id}`, 204);
        const restored = await request('PATCH', `/${_id}/restore`, 200);
        assert.equal(restored.status, 'programado');
        assert.equal(restored.deletedAt, null);
        const edited = await request('PATCH', `/${_id}`, 200, { description: 'Editada sin cambiar el estado' });
        assert.equal(edited.status, 'programado');
        assert.equal((await Route.collection.findOne({ _id })).status, 'programado');
      }
    });
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
