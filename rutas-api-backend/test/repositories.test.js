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
      category: { name: 'Senderismo' },
      location: { name: 'Girona', latitude: 41.9, longitude: 2.8 },
      guide: { name: 'Ana Test', email: 'guia@example.test', licenseNumber: 'TEST-001' },
      route: { title: 'Ruta test', distanceKm: 5, difficulty: 'fácil', minParticipants: 2, maxParticipants: 10 },
      variant: { name: 'Sin transporte', sku: 'TEST-BASE', price: '12.50', currency: 'EUR', capacity: 10 },
      image: { url: '/test.jpg', source: 'example', position: 1, isCover: true }
    };
    const refs = {
      user: { roleId: 'role' }, guide: { userId: 'user' },
      route: { categoryId: 'category', locationId: 'location', guideId: 'guide', createdByUserId: 'user' },
      variant: { routeId: 'route' }, image: { variantId: 'variant' }
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
        const updated = await repository.update(doc._id, { status: 'updated', deletedAt: new Date(), createdAt: new Date(0) });
        assert.equal(updated.status, 'updated');
        assert.equal(updated.deletedAt, null);
        assert.notEqual(updated.createdAt.getTime(), 0);
        await assert.rejects(repository.changeStatus(doc._id, 'x'.repeat(51)), { name: 'ValidationError' });
        assert.equal((await repository.changeIsActive(doc._id, false)).isActive, false);
        assert.equal((await repository.changeStatus(doc._id, 'published')).status, 'published');
        assert.ok((await repository.softDelete(doc._id)).deletedAt);
        assert.equal(await repository.findById(doc._id), null);
        assert.equal(await repository.findBySlug(doc.slug), null);
        assert.equal((await repository.findAll()).length, 0);
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
    await t.test('Service de referencia: portadas, imágenes, asociaciones y borrado repetido', async () => {
      const { createRouteSchema, updateRouteSchema } = await import('../src/routes/routeRoutes.js');
      const input = { ...fixtures.route, title: 'Ruta con imágenes', locationId: String(ids.location), imageUrl: ' /cover.jpg ' };
      const parsed = createRouteSchema.parse({ body: input }).body;
      const route = await routeService.createRoute(parsed);
      assert.equal(route.images.length, 1);
      assert.equal(route.images[0].url, '/cover.jpg');
      const coverId = route.images[0]._id;
      const gallery = await repos.image.create({ routeId: route._id, url: '/gallery.jpg', source: 'example', slug: 'gallery', position: 2 });
      const changed = await routeService.updateRoute(route.id, updateRouteSchema.parse({ params: { id: route.id }, body: { imageUrl: '/new-cover.jpg' } }).body);
      assert.equal(changed.images.length, 2);
      assert.equal(changed.images[0]._id, coverId);
      assert.equal(changed.images[0].url, '/new-cover.jpg');
      assert.equal((await routeService.getRouteBySlug(route.slug)).images.length, 2);
      const listing = await routeService.getAllRoutes({ locationId: ids.location });
      assert.equal(listing.find((item) => item.id === route.id).images.length, 2);
      assert.deepEqual(await routeService.getAllRoutes({ status: 'nonexistent' }), []);
      await repos.image.changeIsActive(gallery.id, false);
      assert.equal((await routeService.getRouteById(route.id)).images.length, 1);
      assert.deepEqual((await routeService.updateRoute(route.id, { imageUrl: null })).images, []);
      assert.equal((await routeService.updateRoute(route.id, { imageUrl: '/reactivated.jpg' })).images[0]._id, coverId);
      assert.deepEqual((await routeService.updateRoute(route.id, { imageUrl: '  ' })).images, []);
      await assert.rejects(routeService.updateRoute(route.id, { imageUrl: 123 }), { statusCode: 400 });
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
