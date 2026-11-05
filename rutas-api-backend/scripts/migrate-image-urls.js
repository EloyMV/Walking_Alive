import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { isHttpUrl, normalizeImageUrls } from '../src/utils/urlImage.js';

dotenv.config();

const targets = [
  { field: 'routeId', collection: 'routes' },
  { field: 'categoryId', collection: 'categories' },
  { field: 'locationId', collection: 'locations' },
  { field: 'guideId', collection: 'guides' },
  { field: 'variantId', collection: 'variants' }
];

const migrateImageUrls = async () => {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rutas_db');

  try {
    const legacyImages = mongoose.connection.collection('images');
    const selected = new Map(targets.map(({ field }) => [field, new Map()]));

    for (const { field } of targets) {
      const cursor = legacyImages.find({
        [field]: { $type: 'objectId' },
        url: { $type: 'string' },
        deletedAt: null,
        isActive: { $ne: false }
      }).sort({ isCover: -1, position: 1, _id: 1 });

      for await (const image of cursor) {
        const url = typeof image.url === 'string' ? image.url.trim() : '';
        if (!isHttpUrl(url)) continue;
        const entityId = image[field];
        const choices = selected.get(field);
        const urls = choices.get(String(entityId)) || { entityId, urls: [] };
        if (!urls.urls.includes(url)) urls.urls.push(url);
        choices.set(String(entityId), urls);
      }
    }

    const totals = {};
    for (const { field, collection } of targets) {
      const choices = [...selected.get(field).values()];
      totals[collection] = { candidates: choices.length, updated: 0, skipped: 0 };
      if (!apply) continue;

      const targetCollection = mongoose.connection.collection(collection);
      for (const { entityId, urls } of choices) {
        const record = await targetCollection.findOne({ _id: entityId }, { projection: { url_image: 1 } });
        if (!record) {
          totals[collection].skipped += 1;
          continue;
        }
        const existing = normalizeImageUrls(record.url_image);
        const merged = [...existing];
        for (const url of urls) {
          if (!merged.includes(url)) merged.push(url);
        }
        if (typeof record.url_image === 'string' || record.url_image == null ||
            merged.length !== existing.length) {
          await targetCollection.updateOne({ _id: entityId }, { $set: { url_image: merged } });
        }
        totals[collection].updated += 1;
      }
    }

    console.log(apply
      ? 'Migración completada; se conservaron y combinaron las URLs existentes. La colección images no se ha modificado ni eliminado.'
      : 'Simulación completada; no se ha modificado la base de datos. Usa --apply para combinar las URLs.');
    console.log(JSON.stringify(totals, null, 2));
  } finally {
    await mongoose.disconnect();
  }
};

migrateImageUrls().catch((error) => {
  console.error('Error al migrar las URLs de imagen:', error.message);
  process.exitCode = 1;
});
