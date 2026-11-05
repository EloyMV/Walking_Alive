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
    assert.equal(mongoose.models.Image, undefined);
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
    server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
    assert.equal((await fetch(`${baseUrl}/images`)).status, 404);
    const request = async (method, path, status, payload) => {
      const response = await fetch(baseUrl + path, {
        method,
        headers: payload === undefined ? {} : { 'Content-Type': 'application/json' },
        body: payload === undefined ? undefined : JSON.stringify(payload)
      });
      const text = await response.text();
      assert.equal(response.status, status, `${method} ${path}: estado HTTP inesperado (${text})`);
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
      guide: '/guides', route: '/routes', variant: '/variants'
    };
    const fixtures = {
      role: { name: 'Cliente HTTP', description: 'Prueba de controladores' },
      user: {
        name: 'Ana', lastName: 'HTTP', email: 'ana@http.test',
        passwordHash: 'hash-de-prueba-http', phone: '123456789',
        url_image: ['https://example.test/user-http.jpg', 'https://example.test/user-2-http.jpg']
      },
      category: {
        name: 'Senderismo HTTP',
        url_image: ['https://example.test/category-http.jpg', 'https://example.test/category-2-http.jpg']
      },
      location: {
        name: 'Girona HTTP', latitude: 41.9, longitude: 2.8,
        url_image: ['https://example.test/location-http.jpg', 'https://example.test/location-2-http.jpg']
      },
      guide: {
        name: 'Guía HTTP', email: 'guia@http.test', licenseNumber: 'HTTP-001',
        url_image: ['https://example.test/guide-http.jpg', 'https://example.test/guide-2-http.jpg']
      },
      variant: {
        name: 'Sin transporte HTTP', sku: 'HTTP-BASE', price: '12.50',
        currency: 'EUR', capacity: 10,
        url_image: ['https://example.test/variant-http.jpg', 'https://example.test/variant-2-http.jpg']
      }
    };
    const references = {
      user: { roleId: 'role' }, guide: { userId: 'user' },
      variant: { routeId: 'route' }
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
          guideId: idOf(documents.guide), createdByUserId: idOf(documents.user),
          url_image: ['https://example.test/route-http.jpg', 'https://example.test/route-2-http.jpg']
        });
        assert.deepEqual(documents.route.url_image, ['https://example.test/route-http.jpg', 'https://example.test/route-2-http.jpg']);
        assert.equal(Object.hasOwn(documents.route, 'images'), false);
      }
      await t.test(`${name}: CRUD, consultas, activación, estado y restauración`, async () => {
        const endpoint = endpoints[name];
        const record = await request('POST', endpoint, 201, payloadFor(name));
        documents[name] = record;
        if (Object.hasOwn(fixtures[name], 'url_image')) {
          assert.deepEqual(record.url_image, fixtures[name].url_image);
        }
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
        assert.equal(changed.name, record.name);
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
        assert.ok(!(await request('GET', `${endpoint}?includeDeleted=false`, 200)).some((item) => item._id === record._id));
        const includingDeleted = await request('GET', `${endpoint}?includeDeleted=true`, 200);
        const deleted = includingDeleted.find((item) => item._id === record._id);
        assert.ok(deleted.deletedAt);
        assert.equal(deleted.isActive, false);
        if (Object.hasOwn(fixtures[name], 'url_image')) {
          assert.deepEqual(deleted.url_image, fixtures[name].url_image);
        }
        assert.equal((await request('GET', `${endpoint}?includeDeleted=true&_id=${record._id}`, 200)).length, 1);
        assert.ok((await request('GET', `${endpoint}?includeDeleted=true&isActive=false`, 200)).some((item) => item._id === record._id));
        assert.ok(!(await request('GET', `${endpoint}?includeDeleted=true&isActive=true`, 200)).some((item) => item._id === record._id));
        for (const [field, parent] of Object.entries(references[name] || {})) {
          assert.equal(idOf(deleted[field]), idOf(documents[parent]));
        }
        documents[name] = await request('PATCH', `${path}/restore`, 200);
        assert.equal(documents[name].isActive, true);
        if (Object.hasOwn(fixtures[name], 'url_image')) {
          assert.deepEqual(documents[name].url_image, fixtures[name].url_image);
        }
        assert.equal((await request('GET', `${endpoint}?includeDeleted=true&_id=${record._id}`, 200))[0].deletedAt, null);

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
        await request('GET', `${endpoint}?includeDeleted=incorrecto`, 400);
        await request('GET', `${endpoint}?includeDeleted=1`, 400);
        await request('GET', `${endpoint}?includeDeleted=true&includeDeleted=false`, 400);
        await request('GET', `${endpoint}?includeDeleted%5B%24ne%5D=false`, 400);
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

    await t.test('url_image: contrato HTTP y ausencia del recurso Image', async () => {
      const routePath = `/routes/${documents.route._id}/associations`;
      const route = await request('PATCH', routePath, 200, { categoryId: documents.category._id });
      assert.equal(idOf(route.categoryId), idOf(documents.category));
      await request('PATCH', routePath, 400, { categoryId: 'incorrecto' });
      await request('PATCH', routePath, 400, { title: 'No es una asociación' });
      assert.ok((await request('GET', `/routes?locationId=${documents.location._id}`, 200)).some((item) => item._id === documents.route._id));
      assert.ok((await request('GET', '/variants?capacity=10', 200)).some((item) => item._id === documents.variant._id));

      const noImagePayloads = {
        category: { name: 'Categoría HTTP sin imagen' },
        location: { name: 'Ubicación HTTP sin imagen' },
        guide: {
          userId: documents.user._id, name: 'Guía HTTP sin imagen',
          email: 'guia-sin-imagen@http.test', licenseNumber: 'HTTP-NO-IMAGE'
        },
        route: {
          title: 'Ruta HTTP sin imagen', locationId: documents.location._id,
          distanceKm: 2, difficulty: 'fácil'
        },
        variant: {
          routeId: documents.route._id, name: 'Variante HTTP sin imagen',
          sku: 'HTTP-NO-IMAGE', price: '10.00', currency: 'EUR', capacity: 2
        }
      };
      for (const name of ['category', 'location', 'guide', 'route', 'variant', 'user']) {
        const endpoint = endpoints[name];
        const record = documents[name];
        const path = `${endpoint}/${record._id}`;
        const url = `https://example.test/${name}-updated.jpg`;
        const secondUrl = `https://example.test/${name}-second.jpg`;
        const pair = [url, secondUrl];
        const changed = await request('PATCH', path, 200, { url_image: pair });
        assert.deepEqual(changed.url_image, pair);
        assert.deepEqual((await request('GET', path, 200)).url_image, pair);
        const listed = (await request('GET', endpoint, 200)).find((item) => item._id === record._id);
        assert.deepEqual(listed.url_image, pair);
        assert.equal(Object.hasOwn(listed, 'images'), false);
        for (const invalidUrl of [
          ['not-a-url'], ['ftp://example.test/image.jpg'], [url, '/relative/image.jpg']
        ]) {
          await request('PATCH', path, 400, { url_image: invalidUrl });
        }
        assert.deepEqual((await request('PATCH', path, 200, { url_image: [url] })).url_image, [url]);
        assert.deepEqual((await request('PATCH', path, 200, { url_image: [] })).url_image, []);
        assert.deepEqual((await request('GET', path, 200)).url_image, []);
        assert.deepEqual((await request('PATCH', path, 200, { url_image: url })).url_image, [url]);
        assert.deepEqual((await request('PATCH', path, 200, { url_image: null })).url_image, []);
        const withoutImage = name === 'user'
          ? await request('POST', endpoint, 201, {
            roleId: documents.role._id, name: 'Usuario sin imagen', lastName: 'HTTP',
            email: 'usuario-sin-imagen@http.test', passwordHash: 'hash-sin-imagen'
          })
          : await request('POST', endpoint, 201, noImagePayloads[name]);
        assert.deepEqual(withoutImage.url_image, []);
        assert.equal(Object.hasOwn(withoutImage, 'images'), false);
      }
      await request('PATCH', `/categories/${documents.category._id}`, 400, { imageUrl: 'https://example.test/legacy.jpg' });
      await request('PATCH', `/categories/${documents.category._id}`, 400, { url_image: ['ftp://example.test/legacy.jpg'] });
      assert.equal(Object.hasOwn(documents.role, 'url_image'), false);
      assert.deepEqual(documents.user.url_image, fixtures.user.url_image);

      const legacyUrlId = new mongoose.Types.ObjectId();
      const legacyNullId = new mongoose.Types.ObjectId();
      await mongoose.connection.collection('categories').insertMany([
        {
          _id: legacyUrlId, name: 'Categoría antigua con URL', slug: 'categoria-antigua-url',
          url_image: 'https://example.test/legacy-category.jpg', status: 'published',
          isActive: true, deletedAt: null, createdAt: new Date(), updatedAt: new Date()
        },
        {
          _id: legacyNullId, name: 'Categoría antigua sin URL', slug: 'categoria-antigua-null',
          url_image: null, status: 'published', isActive: true, deletedAt: null,
          createdAt: new Date(), updatedAt: new Date()
        }
      ]);
      assert.deepEqual((await request('GET', `/categories/${legacyUrlId}`, 200)).url_image, [
        'https://example.test/legacy-category.jpg'
      ]);
      assert.deepEqual((await request('GET', `/categories/${legacyNullId}`, 200)).url_image, []);
    });

    await t.test('Conflictos, datos privados y validación de campos de los modelos', async () => {
      await request('POST', '/users', 409, { ...payloadFor('user'), name: 'Otra Ana' });
      await request('POST', '/variants', 409, { ...payloadFor('variant'), name: 'Otra variante' });
      await request('GET', '/users?passwordHash=valor', 400);
      await request('PATCH', `/users/${documents.user._id}`, 200, { passwordHash: 'hash-actualizado-http' });
      await request('PATCH', `/locations/${documents.location._id}`, 400, { latitude: 100 });
      await request('PATCH', `/variants/${documents.variant._id}`, 400, { price: '-1' });
      await request('PATCH', `/variants/${documents.variant._id}`, 400, { capacity: 1.5 });
      await request('PATCH', `/users/${documents.user._id}`, 400, { password: 'no-es-un-campo-del-modelo' });
    });
  } finally {
    if (server) {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
