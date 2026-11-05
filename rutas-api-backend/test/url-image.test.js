import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose from 'mongoose';
import { Category } from '../src/models/Category.js';
import { Guide } from '../src/models/Guide.js';
import { Location } from '../src/models/Location.js';
import { Role } from '../src/models/Role.js';
import { Route } from '../src/models/Route.js';
import { User } from '../src/models/User.js';
import { Variant } from '../src/models/Variant.js';
import { swaggerDocument } from '../src/config/swagger.js';
import { urlImageSchema } from '../src/utils/urlImage.js';

const imageModels = [Route, Category, Location, Guide, Variant, User];

test('url_image es una lista opcional y valida URLs HTTP/HTTPS en los seis modelos', () => {
  const validUrl = 'https://images.example.test/hiking.jpg';
  for (const model of imageModels) {
    const path = model.schema.path('url_image');
    assert.ok(path, `${model.modelName} debe declarar url_image`);
    assert.equal(path.instance, 'Array');
    assert.deepEqual(path.options.default, []);
    assert.deepEqual(new model().url_image, []);
    assert.deepEqual(new model({ url_image: [validUrl, 'http://images.example.test/second.jpg'] }).url_image, [
      validUrl, 'http://images.example.test/second.jpg'
    ]);
    assert.deepEqual(new model({ url_image: validUrl }).url_image, [validUrl]);
    assert.deepEqual(new model({ url_image: null }).url_image, []);
    assert.equal(new model({ url_image: [validUrl, 'ftp://images.example.test/hiking.jpg'] }).validateSync()?.errors?.url_image?.name, 'ValidatorError');
  }
  assert.equal(Role.schema.path('url_image'), undefined);
  assert.equal(mongoose.models.Image, undefined);
  assert.equal(swaggerDocument.paths['/images'], undefined);
  for (const model of imageModels) {
    const property = swaggerDocument.components.schemas[`${model.modelName}Input`].properties.url_image;
    assert.equal(property.type, 'array');
    assert.equal(property.items.format, 'uri');
    assert.equal(property.items.pattern, '^https?://');
    assert.deepEqual(property.default, []);
  }
});

test('Validación compartida de url_image acepta HTTP/HTTPS y null, y rechaza valores inválidos', () => {
  for (const value of [
    'https://images.example.test/hiking.jpg',
    'http://images.example.test/hiking.jpg',
    null,
    ['https://images.example.test/a.jpg', 'http://images.example.test/b.jpg']
  ]) {
    const result = urlImageSchema.safeParse(value);
    assert.equal(result.success, true);
    if (typeof value === 'string') assert.deepEqual(result.data, [value]);
    if (value === null) assert.deepEqual(result.data, []);
  }
  for (const value of [
    'not-a-url', '/relative.jpg', 'ftp://images.example.test/hiking.jpg', 42,
    ['https://images.example.test/good.jpg', 'ftp://images.example.test/bad.jpg']
  ]) {
    assert.equal(urlImageSchema.safeParse(value).success, false);
  }
});
