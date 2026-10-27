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
      category: { name: 'Senderismo de prueba', description: 'Categoría de prueba' },
      location: { name: 'Girona de prueba', latitude: 41.9, longitude: 2.8, city: 'Girona' },
      guide: { name: 'Ana Guía', email: 'guia@services.test', licenseNumber: 'SERVICES-001', specialty: 'Naturaleza' },
      variant: { name: 'Sin transporte', sku: 'SERVICES-BASE', price: '12.50', currency: 'EUR', capacity: 10 },
      image: { url: '/services.jpg', source: 'example', altText: 'Imagen de servicios', position: 2 }
    };
    const references = {
      user: { roleId: 'role' }, guide: { userId: 'user' },
      variant: { routeId: 'route' }, image: { variantId: 'variant' }
    };
    const plurals = { role: 'Roles', user: 'Users', category: 'Categories', location: 'Locations', guide: 'Guides', variant: 'Variants', image: 'Images' };
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
          guideId: documents.guide._id, createdByUserId: documents.user._id
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
        assert.equal(updated[name === 'image' ? 'url' : 'name'], document[name === 'image' ? 'url' : 'name']);
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

    await t.test('Imagen: todas sus asociaciones se validan y pueden cambiarse', async () => {
      for (const [field, parent] of Object.entries({ routeId: 'route', variantId: 'variant', categoryId: 'category', locationId: 'location', guideId: 'guide' })) {
        await assert.rejects(services.image.createImage({ ...fixtures.image, [field]: 'incorrecto' }), { statusCode: 400 });
        await assert.rejects(services.image.createImage({ ...fixtures.image, [field]: new mongoose.Types.ObjectId() }), { statusCode: 404 });
        const image = await services.image.createImage({ ...fixtures.image, [field]: documents[parent]._id });
        assert.equal(idOf(image[field]), idOf(documents[parent]));
        assert.equal((await services.image.updateAssociations(image._id, { [field]: null }))[field], null);
      }
      const gallery = await services.image.createImage({ ...fixtures.image, categoryId: documents.category._id });
      const result = await services.image.getAllImages({ categoryId: documents.category._id });
      assert.ok(result.some((item) => idOf(item) === idOf(gallery)));
      await assert.rejects(services.image.getAllImages({ categoryId: 'incorrecto' }), { statusCode: 400 });
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

    await t.test('Portadas e imágenes por entidad sin mezclar las relaciones', async () => {
      for (const name of ['category', 'location', 'guide', 'variant']) {
        const entity = capitalized(name);
        const service = services[name];
        const record = documents[name];
        const updated = await service[`update${entity}`](record._id, { imageUrl: ` /${name}-cover.jpg ` });
        assert.equal(updated.images.filter((image) => image.isCover).length, 1);
        const cover = updated.images.find((image) => image.isCover);
        assert.equal(cover.url, `/${name}-cover.jpg`);
        const reloaded = await service[`get${entity}ById`](record._id);
        assert.ok(reloaded.images.some((image) => image._id === cover._id));
        assert.ok((await service[`getAll${plurals[name]}`]()).find((item) => idOf(item) === idOf(record)).images.some((image) => image._id === cover._id));
        const changed = await service[`update${entity}`](record._id, { imageUrl: `/${name}-new.jpg` });
        assert.equal(changed.images.find((image) => image.isCover)._id, cover._id);
        assert.ok(!(await routeService.getRouteById(documents.route._id)).images.some((image) => image._id === cover._id));
        const deactivated = await service[`update${entity}`](record._id, { imageUrl: null });
        assert.ok(!deactivated.images.some((image) => image._id === cover._id));
        await assert.rejects(service[`update${entity}`](record._id, { imageUrl: 123 }), { statusCode: 400 });
      }
      const category = await services.category.createCategory({ name: 'Categoría con portada', imageUrl: '/new-category-cover.jpg' });
      assert.equal(category.images[0].url, '/new-category-cover.jpg');
      await assert.rejects(services.location.updateLocation(documents.location._id, { latitude: 100 }), { name: 'ValidationError' });
      await assert.rejects(services.variant.updateVariant(documents.variant._id, { price: '-1' }), { name: 'ValidationError' });
    });
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
