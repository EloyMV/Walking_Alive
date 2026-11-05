import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import { routeService } from '../src/services/routeService.js';

const idOf = (value) => String(value?._id ?? value);

test('Servicios de las entidades del seed con MongoDB', async (t) => {
  const dbName = `rutas_services_test_${process.pid}_${Date.now()}`;
  await mongoose.connect(process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017', {
    dbName, serverSelectionTimeoutMS: 5000
  });
  try {
    const services = {};
    const documents = {};
    const fixtures = {
      role: { name: 'Cliente de prueba', description: 'Rol de los servicios' },
      user: { name: 'Ana', lastName: 'Servicios', email: 'ana@services.test', passwordHash: 'hash-de-prueba', phone: '123456789' },
      category: {
        name: 'Senderismo de prueba', description: 'Categoría de prueba',
        url_image: ['https://example.test/category-services.jpg', 'https://example.test/category-2-services.jpg']
      },
      location: {
        name: 'Girona de prueba', latitude: 41.9, longitude: 2.8, city: 'Girona',
        url_image: ['https://example.test/location-services.jpg', 'https://example.test/location-2-services.jpg']
      },
      guide: {
        name: 'Ana Guía', email: 'guia@services.test', licenseNumber: 'SERVICES-001',
        specialty: 'Naturaleza', url_image: ['https://example.test/guide-services.jpg', 'https://example.test/guide-2-services.jpg']
      },
      variant: {
        name: 'Sin transporte', sku: 'SERVICES-BASE', price: '12.50', currency: 'EUR',
        capacity: 10, url_image: ['https://example.test/variant-services.jpg', 'https://example.test/variant-2-services.jpg']
      }
    };
    const references = {
      user: { roleId: 'role' }, guide: { userId: 'user' },
      variant: { routeId: 'route' }
    };
    const plurals = { role: 'Roles', user: 'Users', category: 'Categories', location: 'Locations', guide: 'Guides', variant: 'Variants' };
    const capitalized = (name) => name[0].toUpperCase() + name.slice(1);
    const payloadFor = (name) => ({
      ...fixtures[name],
      ...Object.fromEntries(Object.entries(references[name] || {}).map(([field, entity]) => [field, documents[entity]._id]))
    });

    for (const name of Object.keys(fixtures)) {
      services[name] = (await import(`../src/services/${name}Service.js`))[`${name}Service`];
    }
    // Crear los índices antes de comprobar conflictos de email y SKU.
    await Promise.all(Object.values(mongoose.models).map((model) => model.init()));

    for (const name of Object.keys(fixtures)) {
      if (name === 'variant') {
        documents.route = await routeService.createRoute({
          title: 'Ruta para servicios', distanceKm: 5, difficulty: 'fácil',
          categoryId: documents.category._id, locationId: documents.location._id,
          guideId: documents.guide._id, createdByUserId: documents.user._id,
          url_image: ['https://example.test/route-services.jpg', 'https://example.test/route-2-services.jpg']
        });
      }
      const service = services[name];
      const entity = capitalized(name);
      await t.test(`${entity}: creación, consultas, cambios y borrado lógico`, async () => {
        const document = await service[`create${entity}`]({
          ...payloadFor(name), slug: 'slug-del-cliente', deletedAt: new Date(0), createdAt: new Date(0), unknownField: true
        });
        documents[name] = document;
        assert.ok(document.slug);
        assert.notEqual(document.slug, 'slug-del-cliente');
        assert.equal(document.deletedAt, null);
        assert.notEqual(new Date(document.createdAt).getTime(), 0);
        assert.equal(document.unknownField, undefined);
        if (name === 'user') assert.equal(document.passwordHash, undefined);
        for (const [field, related] of Object.entries(references[name] || {})) {
          assert.equal(idOf(document[field]), idOf(documents[related]));
          assert.ok(document[field].slug);
        }
        assert.equal(idOf(await service[`get${entity}ById`](document._id)), idOf(document));
        assert.equal(idOf(await service[`get${entity}BySlug`](document.slug)), idOf(document));
        assert.ok((await service[`getAll${plurals[name]}`]()).some((item) => idOf(item) === idOf(document)));
        await assert.rejects(service.findById('id-inválido'), { statusCode: 400 });
        await assert.rejects(service.findById(new mongoose.Types.ObjectId()), { statusCode: 404 });

        const updated = await service[`update${entity}`](document._id, {
          status: 'updated', slug: 'slug-inyectado', deletedAt: new Date(), _id: new mongoose.Types.ObjectId()
        });
        assert.equal(updated.status, 'updated');
        assert.equal(updated.slug, document.slug);
        assert.equal(updated.deletedAt, null);
        assert.equal(idOf(updated), idOf(document));
        assert.equal(updated.name, document.name);
        await assert.rejects(service[`update${entity}`](document._id, {}), { statusCode: 400 });
        await assert.rejects(service.changeIsActive(document._id, 'false'), { statusCode: 400 });
        await assert.rejects(service.changeStatus(document._id, ''), { statusCode: 400 });
        assert.equal((await service.changeStatus(document._id, 'published')).status, 'published');
        assert.equal((await service.setActivation(document._id, false)).isActive, false);
        const deleted = await service.softDelete(document._id);
        assert.ok(deleted.deletedAt);
        if (name === 'user') assert.equal(deleted.passwordHash, undefined);
        await assert.rejects(service[`get${entity}ById`](document._id), { statusCode: 404 });
        await assert.rejects(service[`get${entity}BySlug`](document.slug), { statusCode: 404 });
        assert.ok(!(await service[`getAll${plurals[name]}`]()).some((item) => idOf(item) === idOf(document)));
        const list = (filters) => service[`getAll${plurals[name]}`](filters);
        assert.ok(!(await list({ includeDeleted: false })).some((item) => idOf(item) === idOf(document)));
        const includingDeleted = await list({ includeDeleted: true, _id: document._id });
        assert.equal(includingDeleted.length, 1);
        assert.ok(includingDeleted[0].deletedAt);
        assert.equal(includingDeleted[0].isActive, false);
        if (name === 'user') assert.equal(includingDeleted[0].passwordHash, undefined);
        for (const [field, related] of Object.entries(references[name] || {})) {
          assert.equal(idOf(includingDeleted[0][field]), idOf(documents[related]));
        }
        assert.ok((await list({ includeDeleted: true, isActive: false })).some((item) => idOf(item) === idOf(document)));
        assert.ok(!(await list({ includeDeleted: true, isActive: true })).some((item) => idOf(item) === idOf(document)));
        for (const includeDeleted of ['true', 'false', 1, null, { $ne: false }]) {
          await assert.rejects(list({ includeDeleted }), { statusCode: 400 });
        }
        assert.equal((await service.restoreDelete(document._id)).isActive, true);
        assert.deepEqual(await service[`delete${entity}`](document._id), { alreadyDeleted: false });
        assert.deepEqual(await service[`delete${entity}`](document._id), { alreadyDeleted: true });
        documents[name] = await service.restoreDelete(document._id);
      });
    }

    await t.test('Relaciones obligatorias: IDs, existencia y referencias borradas', async () => {
      for (const [name, field, parent] of [['user', 'roleId', 'role'], ['guide', 'userId', 'user'], ['variant', 'routeId', 'route']]) {
        const service = services[name];
        const create = (payload) => service[`create${capitalized(name)}`](payload);
        await assert.rejects(create({ ...payloadFor(name), [field]: 'incorrecto' }), { statusCode: 400 });
        await assert.rejects(create({ ...payloadFor(name), [field]: new mongoose.Types.ObjectId() }), { statusCode: 404 });
        await assert.rejects(create({ ...payloadFor(name), [field]: null }), { statusCode: 400 });
        const withoutReference = payloadFor(name);
        delete withoutReference[field];
        await assert.rejects(create(withoutReference), { statusCode: 400 });
        await assert.rejects(service.updateAssociations(documents[name]._id, { [field]: null }), { statusCode: 400 });

        const parentService = parent === 'route' ? routeService : services[parent];
        await service.softDelete(documents[name]._id);
        await parentService.softDelete(documents[parent]._id);
        await assert.rejects(create(payloadFor(name)), { statusCode: 404 });
        await assert.rejects(service.restoreDelete(documents[name]._id), { statusCode: 404 });
        await parentService.restoreDelete(documents[parent]._id);
        await service.restoreDelete(documents[name]._id);
      }
    });

    await t.test('Slugs únicos, cambios de nombre y conflictos de email y SKU', async () => {
      const first = await services.role.createRole({ name: 'Rol con acento' });
      const second = await services.role.createRole({ name: 'Rol con acénto' });
      assert.notEqual(first.slug, second.slug);
      await services.role.softDelete(first._id);
      const third = await services.role.createRole({ name: 'Rol con acento' });
      assert.notEqual(first.slug, third.slug);
      const renamed = await services.user.updateUser(documents.user._id, { lastName: 'Apellido nuevo' });
      assert.notEqual(renamed.slug, documents.user.slug);
      assert.equal(renamed.name, documents.user.name);
      assert.equal(renamed.passwordHash, undefined);
      await assert.rejects(services.user.createUser({ ...payloadFor('user'), name: 'Otra Ana' }), { statusCode: 409 });
      await assert.rejects(services.variant.createVariant({ ...payloadFor('variant'), name: 'Otra variante' }), { statusCode: 409 });
      const anotherUser = await services.user.createUser({ ...payloadFor('user'), email: 'otra@services.test' });
      await assert.rejects(services.user.updateUser(anotherUser._id, { email: fixtures.user.email }), { statusCode: 409 });
      assert.equal((await services.user.updateUser(documents.user._id, { passwordHash: 'nuevo-hash' })).passwordHash, undefined);
      for (const value of [
        await services.user.findById(documents.user._id),
        await services.user.changeStatus(documents.user._id, 'enabled'),
        await services.user.changeIsActive(documents.user._id, true),
        ...(await services.user.getAllUsers())
      ]) assert.equal(value.passwordHash, undefined);
    });

    await t.test('url_image se lee, actualiza y elimina directamente en cada entidad', async () => {
      const imageEntities = [
        ['category', services.category, 'Category', 'Categories'],
        ['location', services.location, 'Location', 'Locations'],
        ['guide', services.guide, 'Guide', 'Guides'],
        ['route', routeService, 'Route', 'Routes'],
        ['variant', services.variant, 'Variant', 'Variants']
      ];
      for (const [name, service, entity, plural] of imageEntities) {
        const record = documents[name];
        const updatedUrl = `https://example.test/${name}-updated.jpg`;
        const update = name === 'route' ? service.updateRoute : service[`update${entity}`];
        const byId = name === 'route' ? service.getRouteById : service[`get${entity}ById`];
        const all = name === 'route' ? service.getAllRoutes : service[`getAll${plural}`];
        assert.deepEqual(record.url_image, fixtures[name]?.url_image ?? [
          'https://example.test/route-services.jpg', 'https://example.test/route-2-services.jpg'
        ]);
        assert.deepEqual((await update.call(service, record._id, { url_image: [updatedUrl] })).url_image, [updatedUrl]);
        assert.deepEqual((await byId.call(service, record._id)).url_image, [updatedUrl]);
        assert.deepEqual((await all.call(service)).find((item) => idOf(item) === idOf(record)).url_image, [updatedUrl]);
        assert.deepEqual((await update.call(service, record._id, { url_image: [] })).url_image, []);
      }
      const categoryWithoutImage = await services.category.createCategory({ name: 'Categoría sin imagen' });
      assert.deepEqual(categoryWithoutImage.url_image, []);
      await assert.rejects(
        services.category.updateCategory(categoryWithoutImage._id, { url_image: ['ftp://example.test/image.jpg'] }),
        { name: 'ValidationError' }
      );
      await assert.rejects(services.location.updateLocation(documents.location._id, { latitude: 100 }), { name: 'ValidationError' });
      await assert.rejects(services.variant.updateVariant(documents.variant._id, { price: '-1' }), { name: 'ValidationError' });
    });
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
