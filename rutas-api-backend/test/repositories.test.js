import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import { routeService } from '../src/services/routeService.js';

// Base exclusiva de cada ejecución; nunca utiliza la base de la aplicación.
test('Repositorios del seed y servicio de rutas con MongoDB', async (t) => {
  const dbName = 'rutas_repositories_test_' + process.pid + '_' + Date.now();
  await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017', {
    dbName, serverSelectionTimeoutMS: 5000
  });
  try {
    const ids = {};
    const fixtures = {
      role: { name: 'Cliente' },
      user: { name: 'Ana', lastName: 'Test', email: 'ana@example.test', passwordHash: 'test-hash' },
      category: { name: 'Senderismo', url_image: ['https://example.test/category.jpg', 'https://example.test/category-2.jpg'] },
      location: { name: 'Girona', latitude: 41.9, longitude: 2.8 },
      guide: { name: 'Ana Test', email: 'guia@example.test', licenseNumber: 'TEST-001' },
      route: { title: 'Ruta test', distanceKm: 5, difficulty: 'fácil', minParticipants: 2, maxParticipants: 10,
        url_image: ['https://example.test/route.jpg', 'https://example.test/route-2.jpg'] },
      variant: { name: 'Sin transporte', sku: 'TEST-BASE', price: '12.50', currency: 'EUR', capacity: 10,
        url_image: ['https://example.test/variant.jpg'] }
    };
    const refs = {
      user: { roleId: 'role' }, guide: { userId: 'user' },
      route: { categoryId: 'category', locationId: 'location', guideId: 'guide', createdByUserId: 'user' },
      variant: { routeId: 'route' }
    };
    const repos = {};
    for (const [name, fixture] of Object.entries(fixtures)) {
      const repository = (await import('../src/repositories/' + name + 'Repository.js'))[name + 'Repository'];
      repos[name] = repository;
      await t.test(name + ': CRUD, relaciones, validación y borrado lógico', async () => {
        const relations = Object.fromEntries(Object.entries(refs[name] || {}).map(([field, entity]) => [field, ids[entity]]));
        const doc = await repository.create({ ...fixture, ...relations, slug: name + '-test', deletedAt: new Date(0), unknownField: true });
        ids[name] = doc._id;
        assert.equal(doc.deletedAt, null);
        assert.equal(doc.unknownField, undefined);
        assert.ok(await repository.findById(doc._id));
        assert.ok(await repository.findBySlug(doc.slug));
        assert.equal((await repository.findAll()).length, 1);
        for (const [field, entity] of Object.entries(refs[name] || {})) {
          assert.equal(String(doc[field]._id), String(ids[entity]));
          assert.ok(doc[field].slug);
          if (entity === 'user') assert.equal(doc[field].passwordHash, undefined);
        }
        assert.equal(await repository.slugExists(doc.slug), true);
        assert.equal(await repository.slugExists(doc.slug, doc._id), false);
        const updatedStatus = name === 'route' ? 'en curso' : 'updated';
        const updated = await repository.update(doc._id, { status: updatedStatus, deletedAt: new Date(), createdAt: new Date(0) });
        assert.equal(updated.status, updatedStatus);
        assert.equal(updated.deletedAt, null);
        assert.notEqual(updated.createdAt.getTime(), 0);
        await assert.rejects(repository.changeStatus(doc._id, 'x'.repeat(51)), { name: 'ValidationError' });
        assert.equal((await repository.changeIsActive(doc._id, false)).isActive, false);
        const nextStatus = name === 'route' ? 'finalizado' : 'published';
        assert.equal((await repository.changeStatus(doc._id, nextStatus)).status, nextStatus);
        assert.ok((await repository.softDelete(doc._id)).deletedAt);
        assert.equal(await repository.findById(doc._id), null);
        assert.equal(await repository.findBySlug(doc.slug), null);
        assert.equal((await repository.findAll()).length, 0);
        {
          assert.deepEqual(await repository.findAll({ includeDeleted: false }), []);
          const deleted = await repository.findAll({ includeDeleted: true });
          assert.equal(deleted.length, 1);
          assert.equal(String(deleted[0]._id), String(doc._id));
          assert.ok(deleted[0].deletedAt);
          assert.equal(deleted[0].isActive, false);
          for (const [field, entity] of Object.entries(refs[name] || {})) {
            assert.equal(String(deleted[0][field]._id), String(ids[entity]));
            if (entity === 'user') assert.equal(deleted[0][field].passwordHash, undefined);
          }
          if (name === 'user') assert.equal(deleted[0].passwordHash, undefined);
          assert.equal((await repository.findAll({ includeDeleted: true, isActive: false })).length, 1);
          assert.deepEqual(await repository.findAll({ includeDeleted: true, isActive: true }), []);
        }
        assert.equal(await repository.slugExists(doc.slug), true);
        assert.equal(await repository.update(doc._id, { status: 'hidden' }), null);
        assert.equal(await repository.changeStatus(doc._id, 'hidden'), null);
        assert.equal(await repository.changeIsActive(doc._id, true), null);
        assert.equal(await repository.softDelete(doc._id), null);
        const restored = await repository.restoreDelete(doc._id);
        assert.equal(restored.deletedAt, null);
        assert.equal(restored.isActive, true);
        assert.equal(await repository.restoreDelete(doc._id), null);
      });
    }
    await t.test('Service: relaciones, slugs, actualización y errores', async () => {
      const payload = { ...fixtures.route, title: 'Ruta del servicio', categoryId: ids.category, locationId: ids.location, guideId: ids.guide, createdByUserId: ids.user };
      const first = await routeService.createRoute(payload);
      await assert.rejects(routeService.createRoute(payload), { statusCode: 409 });
      const second = await routeService.createRoute({ ...payload, title: 'Ruta del servício' });
      assert.notEqual(first.slug, second.slug);
      assert.equal((await routeService.getRouteBySlug(first.slug)).id, first.id);
      assert.equal((await routeService.updateRoute(first.id, { title: 'Nuevo título' })).title, 'Nuevo título');
      await assert.rejects(routeService.updateRoute(first.id, { maxParticipants: 1 }), { statusCode: 400 });
      await assert.rejects(routeService.createRoute({ ...payload, categoryId: new mongoose.Types.ObjectId() }), { statusCode: 404 });
      await repos.category.softDelete(ids.category);
      await assert.rejects(routeService.createRoute(payload), { statusCode: 404 });
      assert.equal((await repos.route.findById(first.id)).categoryId, null);
      await repos.category.restoreDelete(ids.category);
      await routeService.softDelete(first.id);
      await assert.rejects(routeService.getRouteById(first.id), { statusCode: 404 });
      await routeService.restoreDelete(first.id);
      assert.equal((await routeService.getRouteById(first.id)).id, first.id);
      assert.equal((await repos.user.findById(ids.user)).passwordHash, undefined);
      await assert.rejects(repos.variant.update(ids.variant, { price: '-1' }), { name: 'ValidationError' });
      await assert.rejects(repos.route.update(ids.route, { maxParticipants: 1 }), { name: 'ValidationError' });
    });
    await t.test('Service de rutas: url_image, asociaciones y borrado repetido', async () => {
      const { createRouteSchema, updateRouteSchema } = await import('../src/routes/routeRoutes.js');
      const input = {
        ...fixtures.route, title: 'Ruta con imagen', locationId: String(ids.location),
        url_image: ' https://example.test/cover.jpg '
      };
      const parsed = createRouteSchema.parse({ body: input }).body;
      const route = await routeService.createRoute(parsed);
      assert.deepEqual(route.url_image, ['https://example.test/cover.jpg']);
      const changed = await routeService.updateRoute(route.id, updateRouteSchema.parse({
        params: { id: route.id }, body: { url_image: ['https://example.test/new-cover.jpg'] }
      }).body);
      assert.deepEqual(changed.url_image, ['https://example.test/new-cover.jpg']);
      assert.deepEqual((await routeService.getRouteBySlug(route.slug)).url_image, ['https://example.test/new-cover.jpg']);
      const listing = await routeService.getAllRoutes({ locationId: ids.location });
      assert.deepEqual(listing.find((item) => item.id === route.id).url_image, ['https://example.test/new-cover.jpg']);
      assert.deepEqual(await routeService.getAllRoutes({ status: 'nonexistent' }), []);
      assert.deepEqual((await routeService.updateRoute(route.id, { url_image: [] })).url_image, []);
      assert.deepEqual((await routeService.updateRoute(route.id, { url_image: ['https://example.test/restored.jpg'] })).url_image, ['https://example.test/restored.jpg']);
      assert.equal(createRouteSchema.safeParse({ body: { ...input, url_image: 'ftp://example.test/image.jpg' } }).success, false);
      await assert.rejects(repos.route.update(route.id, { url_image: 'ftp://example.test/image.jpg' }), { name: 'ValidationError' });
      const associated = await routeService.updateAssociations(route.id, { categoryId: ids.category, title: 'Ignorado' });
      assert.equal(associated.title, route.title);
      assert.equal(String(associated.categoryId._id), String(ids.category));
      const removed = await routeService.updateAssociations(route.id, { categoryId: null });
      assert.equal(removed.categoryId, null);
      await assert.rejects(routeService.updateRoute(route.id, { title: 'Nuevo título' }), { statusCode: 409 });
      await assert.rejects(routeService.updateAssociations(route.id, { guideId: 'incorrecto' }), { statusCode: 400 });
      assert.equal((await routeService.setActivation(route.id, false)).isActive, false);
      assert.deepEqual(await routeService.deleteRoute(route.id), { alreadyDeleted: false });
      assert.deepEqual(await routeService.deleteRoute(route.id), { alreadyDeleted: true });
      await assert.rejects(routeService.deleteRoute(new mongoose.Types.ObjectId()), { statusCode: 404 });
    });
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
