import { z } from 'zod';

export const isHttpUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
};

export const normalizeImageUrls = (value) => {
  if (value === null || value === undefined) return [];
  if (typeof value === 'string') return [value.trim()];
  if (!Array.isArray(value)) return value;
  return value.map((url) => typeof url === 'string' ? url.trim() : url);
};

const imageUrlSchema = z.string()
  .trim()
  .url('Cada elemento de url_image debe ser una URL válida')
  .refine(isHttpUrl, 'Cada imagen debe usar HTTP o HTTPS');

export const urlImageSchema = z.preprocess(
  (value) => value === null || typeof value === 'string' ? normalizeImageUrls(value) : value,
  z.array(imageUrlSchema, { error: 'url_image debe ser una lista de URLs' }).default([])
);

export const imageUrlsValidator = (value) =>
  Array.isArray(value) && value.every((url) => isHttpUrl(url));

export const imageUrlArrayField = {
  type: [String],
  default: [],
  set: normalizeImageUrls,
  get: normalizeImageUrls,
  validate: {
    validator: imageUrlsValidator,
    message: 'url_image solo puede contener URLs HTTP o HTTPS válidas'
  }
};
