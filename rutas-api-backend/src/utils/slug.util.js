import slugify from 'slugify';

export const generateSlug = (value) =>
  slugify(typeof value === 'string' ? value : '', {
    lower: true,
    strict: true,
    trim: true
  }) || 'ruta';
