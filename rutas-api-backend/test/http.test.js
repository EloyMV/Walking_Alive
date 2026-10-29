import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import app from '../src/app.js';

const idOf = (value) => String(value?._id ?? value);
const assertNoPasswordHash = (value) => {
  if (!value || typeof value !== 'object') return;
  assert.equal(Object.hasOwn(value, 'passwordHash'), false, 'La respuesta contiene un campo privado');
  for (const child of Object.values(value)) assertNoPasswordHash(child);
};

test('Controladores y rutas HTTP con MongoDB', async (t) => {
  // Cada ejecución usa una base propia y un puerto asignado por el sistema.
  const dbName = `rutas_http_test_${process.pid}_${Date.now()}`;
  await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017', {
    dbName, serverSelectionTimeoutMS: 5000
  });
  let server;
  try {
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
    const request = async (method, path, status, payload) => {
      const response = await fetch(baseUrl + path, {
        method,
        headers: payload === undefined ? {} : { 'Content-Type': 'application/json' },
        body: payload === undefined ? undefined : JSON.stringify(payload)
      });
      const text = await response.text();
      assert.equal(response.status, status, `${method} ${path}: estado HTTP inesperado`);
      if (status === 204) {
        assert.equal(text, '');
        return null;
      }
      assert.match(response.headers.get('content-type') || '', /application\/json/);
      const data = JSON.parse(text);
      // Ningún controlador debe incluir el hash del usuario, tampoco en relaciones.
      assertNoPasswordHash(data);
      return data;
    };
    const documents = {};
    const endpoints = {
      role: '/roles', user: '/users', category: '/categories', location: '/locations',
      guide: '/guides', route: '/routes', variant: '/variants', image: '/images'
    };
    const fixtures = {
      role: { name: 'Cliente HTTP', description: 'Prueba de controladores' },
      user: { name: 'Ana', lastName: 'HTTP', email: 'ana@http.test', passwordHash: 'hash-de-prueba-http', phone: '123456789' },
      category: { name: 'Senderismo HTTP', imageUrl: '/category-http.jpg' },
      location: { name: 'Girona HTTP', latitude: 41.9, longitude: 2.8, imageUrl: '/location-http.jpg' },
      guide: { name: 'Guía HTTP', email: 'guia@http.test', licenseNumber: 'HTTP-001', imageUrl: '/guide-http.jpg' },
      variant: { name: 'Sin transporte HTTP', sku: 'HTTP-BASE', price: '12.50', currency: 'EUR', capacity: 10, imageUrl: '/variant-http.jpg' },
      image: { url: '/http-gallery.jpg', source: 'example', altText: 'Galería HTTP', position: 2 }
    };
    const references = {
      user: { roleId: 'role' }, guide: { userId: 'user' },
      variant: { routeId: 'route' }, image: { variantId: 'variant' }
    };
    const payloadFor = (name) => ({
      ...fixtures[name],
      ...Object.fromEntries(Object.entries(references[name] || {}).map(([field, entity]) => [field, idOf(documents[entity])]))
    });

    for (const name of Object.keys(fixtures)) {
      if (name === 'variant') {
        documents.route = await request('POST', endpoints.route, 201, {
          title: 'Ruta HTTP', distanceKm: 5, difficulty: 'fácil',
          categoryId: idOf(documents.category), locationId: idOf(documents.location),
          guideId: idOf(documents.guide), createdByUserId: idOf(documents.user)
        });
      }
      await t.test(`${name}: CRUD, consultas, activación, estado y restauración`, async () => {
        const endpoint = endpoints[name];
        const record = await request('POST', endpoint, 201, payloadFor(name));
        documents[name] = record;
        const path = `${endpoint}/${record._id}`;
        assert.equal((await request('GET', path, 200))._id, record._id);
        assert.equal((await request('GET', `${endpoint}/slug/${record.slug}`, 200))._id, record._id);
        assert.ok((await request('GET', endpoint, 200)).some((item) => item._id === record._id));
        for (const [field, parent] of Object.entries(references[name] || {})) {
          assert.equal(idOf(record[field]), idOf(documents[parent]));
          assert.ok(record[field].slug);
        }

        const changed = await request('PATCH', path, 200, { status: 'edited' });
        assert.equal(changed.status, 'edited');
        assert.equal(changed[name === 'image' ? 'url' : 'name'], record[name === 'image' ? 'url' : 'name']);
        assert.equal((await request('PATCH', `${path}/status`, 200, { status: 'published' })).status, 'published');
        assert.equal((await request('PATCH', `${path}/is-active`, 200, { isActive: false })).isActive, false);
        const inactive = await request('GET', `${endpoint}?isActive=false`, 200);
        assert.ok(inactive.some((item) => item._id === record._id));
        assert.ok(inactive.every((item) => item.isActive === false));
        assert.ok(!(await request('GET', `${endpoint}?isActive=true`, 200)).some((item) => item._id === record._id));

        await request('DELETE', path, 204);
        await request('DELETE', path, 204);
        await request('GET', path, 404);
        await request('GET', `${endpoint}/slug/${record.slug}`, 404);
        assert.ok(!(await request('GET', endpoint, 200)).some((item) => item._id === record._id));
        documents[name] = await request('PATCH', `${path}/restore`, 200);
        assert.equal(documents[name].isActive, true);

        await request('GET', `${endpoint}/incorrecto`, 400);
        await request('GET', `${endpoint}/${new mongoose.Types.ObjectId()}`, 404);
        await request('POST', endpoint, 400, {});
        await request('PATCH', path, 400, {});
        await request('PATCH', path, 400, { slug: 'slug-del-cliente' });
        await request('PATCH', path, 400, { deletedAt: null });
        await request('PATCH', `${path}/is-active`, 400, { isActive: 'false' });
        await request('PATCH', `${path}/status`, 400, { status: '' });
        await request('GET', `${endpoint}?unknownField=1`, 400);
        await request('GET', `${endpoint}?isActive=incorrecto`, 400);
        await request('GET', `${endpoint}?isActive%5B%24ne%5D=true`, 400);
      });
    }

    await t.test('Rutas: listado con borrado lógico y restauración persistente', async () => {
      const deleted = await request('POST', '/routes', 201, {
        title: 'Ruta HTTP con borrado lógico', distanceKm: 7, difficulty: 'difícil',
        locationId: documents.location._id
      });
      const path = `/routes/${deleted._id}`;
      await request('DELETE', path, 204);
      assert.ok(!(await request('GET', '/routes', 200)).some((route) => route._id === deleted._id));
      assert.ok(!(await request('GET', '/routes?includeDeleted=false', 200)).some((route) => route._id === deleted._id));
      const all = await request('GET', '/routes?includeDeleted=true', 200);
      assert.ok(all.some((route) => route._id === documents.route._id && !route.deletedAt));
      const listed = all.find((route) => route._id === deleted._id);
      assert.ok(listed.deletedAt);
      assert.equal(listed.isActive, false);
      assert.equal(idOf(listed.locationId), documents.location._id);
      const inactive = await request('GET', '/routes?includeDeleted=true&isActive=false&difficulty=dif%C3%ADcil', 200);
      assert.ok(inactive.some((route) => route._id === deleted._id));
      assert.ok(inactive.every((route) => route.isActive === false && route.difficulty === 'difícil'));
      await request('GET', path, 404);
      await request('PATCH', `${path}/is-active`, 404, { isActive: true });
      await request('GET', '/routes?includeDeleted=incorrecto', 400);
      await request('GET', '/routes?includeDeleted%5B%24ne%5D=false', 400);
      const restored = await request('PATCH', `${path}/restore`, 200);
      assert.equal(restored.deletedAt, null);
      assert.equal(restored.isActive, true);
      assert.ok((await request('GET', '/routes', 200)).some((route) => route._id === deleted._id));
      const reloaded = (await request('GET', '/routes?includeDeleted=true', 200)).find((route) => route._id === deleted._id);
      assert.equal(reloaded.deletedAt, null);
      assert.equal(reloaded.isActive, true);
    });

    await t.test('Relaciones obligatorias y endpoint de asociaciones', async () => {
      for (const [name, field, parent] of [['user', 'roleId', 'role'], ['guide', 'userId', 'user'], ['variant', 'routeId', 'route']]) {
        const endpoint = endpoints[name];
        const path = `${endpoint}/${documents[name]._id}/associations`;
        const changed = await request('PATCH', path, 200, { [field]: documents[parent]._id });
        assert.equal(idOf(changed[field]), idOf(documents[parent]));
        await request('PATCH', path, 400, { [field]: null });
        await request('PATCH', path, 400, { [field]: 'incorrecto' });
        await request('PATCH', path, 404, { [field]: String(new mongoose.Types.ObjectId()) });
        await request('PATCH', path, 400, {});
        await request('PATCH', path, 400, { name: 'Campo ajeno a las asociaciones' });
        await request('POST', endpoint, 400, { ...payloadFor(name), [field]: null });
        await request('POST', endpoint, 404, { ...payloadFor(name), [field]: String(new mongoose.Types.ObjectId()) });

        const childPath = `${endpoint}/${documents[name]._id}`;
        const parentPath = `${endpoints[parent]}/${documents[parent]._id}`;
        await request('DELETE', childPath, 204);
        await request('DELETE', parentPath, 204);
        try {
          await request('PATCH', `${childPath}/restore`, 404);
          await request('POST', endpoint, 404, payloadFor(name));
        } finally {
          await request('PATCH', `${parentPath}/restore`, 200);
          await request('PATCH', `${childPath}/restore`, 200);
        }
      }
    });

    await t.test('Imagen: referencias opcionales, filtros y asociaciones de ruta', async () => {
      const path = `/images/${documents.image._id}/associations`;
      for (const [field, parent] of Object.entries({ routeId: 'route', variantId: 'variant', categoryId: 'category', locationId: 'location', guideId: 'guide' })) {
        const changed = await request('PATCH', path, 200, { [field]: documents[parent]._id });
        assert.equal(idOf(changed[field]), idOf(documents[parent]));
        const filtered = await request('GET', `/images?${field}=${documents[parent]._id}`, 200);
        assert.ok(filtered.some((image) => image._id === documents.image._id));
        await request('PATCH', path, 404, { [field]: String(new mongoose.Types.ObjectId()) });
        assert.equal((await request('PATCH', path, 200, { [field]: null }))[field], null);
      }
      const routePath = `/routes/${documents.route._id}/associations`;
      const route = await request('PATCH', routePath, 200, { categoryId: documents.category._id });
      assert.equal(idOf(route.categoryId), idOf(documents.category));
      await request('PATCH', routePath, 400, { categoryId: 'incorrecto' });
      await request('PATCH', routePath, 400, { title: 'No es una asociación' });
      assert.ok((await request('GET', `/routes?locationId=${documents.location._id}`, 200)).some((item) => item._id === documents.route._id));
      await request('GET', '/images?position=incorrecto', 400);
      assert.ok((await request('GET', '/variants?capacity=10', 200)).some((item) => item._id === documents.variant._id));
    });

    await t.test('Conflictos, datos privados y validación de campos de los modelos', async () => {
      await request('POST', '/users', 409, { ...payloadFor('user'), name: 'Otra Ana' });
      await request('POST', '/variants', 409, { ...payloadFor('variant'), name: 'Otra variante' });
      await request('GET', '/users?passwordHash=valor', 400);
      await request('PATCH', `/users/${documents.user._id}`, 200, { passwordHash: 'hash-actualizado-http' });
      await request('PATCH', `/locations/${documents.location._id}`, 400, { latitude: 100 });
      await request('PATCH', `/variants/${documents.variant._id}`, 400, { price: '-1' });
      await request('PATCH', `/variants/${documents.variant._id}`, 400, { capacity: 1.5 });
      await request('PATCH', `/images/${documents.image._id}`, 400, { position: -1 });
      await request('PATCH', `/users/${documents.user._id}`, 400, { password: 'no-es-un-campo-del-modelo' });
    });

    await t.test('Portadas: creación, actualización, listado y desactivación', async () => {
      for (const name of ['category', 'location', 'guide', 'variant']) {
        const endpoint = endpoints[name];
        const record = documents[name];
        const original = await request('GET', `${endpoint}/${record._id}`, 200);
        const cover = original.images.find((image) => image.isCover);
        assert.equal(cover.url, `/${name}-http.jpg`);
        const changed = await request('PATCH', `${endpoint}/${record._id}`, 200, { imageUrl: `/${name}-updated.jpg` });
        assert.equal(changed.images.find((image) => image.isCover)._id, cover._id);
        assert.equal(changed.images.find((image) => image.isCover).url, `/${name}-updated.jpg`);
        const listed = (await request('GET', endpoint, 200)).find((item) => item._id === record._id);
        assert.ok(listed.images.some((image) => image._id === cover._id));
        const route = await request('GET', `/routes/${documents.route._id}`, 200);
        assert.ok(!route.images.some((image) => image._id === cover._id));
        const deactivated = await request('PATCH', `${endpoint}/${record._id}`, 200, { imageUrl: null });
        assert.ok(!deactivated.images.some((image) => image._id === cover._id));
        await request('PATCH', `${endpoint}/${record._id}`, 400, { imageUrl: 123 });
      }
    });
  } finally {
    if (server) {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
