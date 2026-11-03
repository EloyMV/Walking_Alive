const accountStatuses = [
  { value: 'enabled', label: 'Habilitado' },
  { value: 'disabled', label: 'Deshabilitado' },
  { value: 'archived', label: 'Archivado' }
];

const publicationStatuses = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Archivado' }
];

const availabilityStatuses = [
  { value: 'available', label: 'Disponible' },
  { value: 'unavailable', label: 'No disponible' },
  { value: 'archived', label: 'Archivado' }
];

const descriptionField = { name: 'description', label: 'Descripción', type: 'textarea', maxLength: 10000 };
const coverField = { name: 'imageUrl', label: 'URL de portada', type: 'text', nullable: true, help: 'Déjala vacía para quitar la portada.' };
const phoneField = { name: 'phone', label: 'Teléfono', type: 'text', maxLength: 30, nullable: true };

export const entityConfigs = [
  {
    key: 'categories', singular: 'categoría', plural: 'Categorías', titleField: 'name',
    description: 'Organiza las experiencias y encuentra el tipo de aventura que buscas.',
    defaultStatus: 'published', statusOptions: publicationStatuses,
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true, minLength: 2, maxLength: 100 },
      descriptionField,
      coverField
    ],
    listFields: ['description']
  },
  {
    key: 'locations', singular: 'ubicación', plural: 'Ubicaciones', titleField: 'name',
    description: 'Guarda los lugares y puntos de encuentro de tus próximas rutas.',
    defaultStatus: 'published', statusOptions: publicationStatuses,
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 150 },
      descriptionField,
      { name: 'meetingPoint', label: 'Punto de encuentro', type: 'textarea', maxLength: 5000 },
      { name: 'city', label: 'Ciudad', type: 'text', maxLength: 100 },
      { name: 'region', label: 'Región', type: 'text', maxLength: 100 },
      { name: 'country', label: 'País', type: 'text', maxLength: 100 },
      { name: 'latitude', label: 'Latitud', type: 'number', min: -90, max: 90, step: 'any', nullable: true },
      { name: 'longitude', label: 'Longitud', type: 'number', min: -180, max: 180, step: 'any', nullable: true },
      coverField
    ],
    listFields: ['city', 'region', 'country', 'meetingPoint', 'latitude', 'longitude']
  },
  {
    key: 'guides', singular: 'guía', plural: 'Guías', titleField: 'name',
    description: 'Gestiona a quienes conocen cada sendero y acompañan tus aventuras.',
    defaultStatus: 'available', statusOptions: availabilityStatuses,
    fields: [
      { name: 'userId', label: 'Usuario asociado', type: 'relation', relation: 'users', required: true },
      { name: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 150 },
      descriptionField,
      { name: 'email', label: 'Correo electrónico', type: 'text', required: true, maxLength: 150, lowercase: true },
      phoneField,
      { name: 'licenseNumber', label: 'Número de licencia', type: 'text', required: true, maxLength: 100 },
      { name: 'specialty', label: 'Especialidad', type: 'text', maxLength: 150 },
      coverField
    ],
    listFields: ['userId', 'email', 'phone', 'licenseNumber', 'specialty']
  },
  {
    key: 'variants', singular: 'variante', plural: 'Variantes', titleField: 'name',
    description: 'Define precios, plazas y opciones para disfrutar de cada ruta.',
    defaultStatus: 'available', statusOptions: availabilityStatuses,
    fields: [
      { name: 'routeId', label: 'Ruta', type: 'relation', relation: 'routes', required: true },
      { name: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 150 },
      descriptionField,
      { name: 'sku', label: 'SKU', type: 'text', required: true, maxLength: 100 },
      { name: 'price', label: 'Precio', type: 'number', required: true, min: 0, step: 'any', decimal: true },
      { name: 'currency', label: 'Moneda (código ISO)', type: 'text', required: true, maxLength: 3, uppercase: true, defaultValue: 'EUR', pattern: '^[A-Z]{3}$', help: 'Tres letras, por ejemplo EUR o USD.' },
      { name: 'capacity', label: 'Plazas', type: 'number', required: true, min: 0, step: 1, integer: true },
      { name: 'minimumAge', label: 'Edad mínima', type: 'number', min: 0, step: 1, integer: true, defaultValue: 0 },
      { name: 'includesTransport', label: 'Incluye transporte', type: 'checkbox', defaultValue: false },
      coverField
    ],
    listFields: ['routeId', 'sku', 'price', 'currency', 'capacity', 'minimumAge', 'includesTransport']
  },
  {
    key: 'images', singular: 'imagen', plural: 'Imágenes', titleField: 'url',
    description: 'Conserva las imágenes que cuentan la historia de tus rutas y lugares.',
    defaultStatus: 'published', statusOptions: publicationStatuses,
    fields: [
      { name: 'url', label: 'URL de la imagen', type: 'text', required: true },
      { name: 'altText', label: 'Texto alternativo', type: 'text', maxLength: 255 },
      { name: 'source', label: 'Origen', type: 'text', required: true, maxLength: 50, defaultValue: 'manual' },
      { name: 'author', label: 'Autor', type: 'text', maxLength: 150, nullable: true },
      { name: 'position', label: 'Posición', type: 'number', min: 0, step: 1, integer: true, defaultValue: 0 },
      { name: 'isCover', label: 'Imagen de portada', type: 'checkbox', defaultValue: false },
      { name: 'routeId', label: 'Ruta', type: 'relation', relation: 'routes', nullable: true },
      { name: 'variantId', label: 'Variante', type: 'relation', relation: 'variants', nullable: true },
      { name: 'categoryId', label: 'Categoría', type: 'relation', relation: 'categories', nullable: true },
      { name: 'locationId', label: 'Ubicación', type: 'relation', relation: 'locations', nullable: true },
      { name: 'guideId', label: 'Guía', type: 'relation', relation: 'guides', nullable: true }
    ],
    listFields: ['altText', 'source', 'author', 'position', 'isCover', 'routeId', 'variantId', 'categoryId', 'locationId', 'guideId']
  },
  {
    key: 'users', singular: 'usuario', plural: 'Usuarios', titleField: 'name',
    description: 'Gestiona las personas que dan vida a WalkingAlive y sus roles.',
    defaultStatus: 'enabled', statusOptions: accountStatuses,
    fields: [
      { name: 'roleId', label: 'Rol', type: 'relation', relation: 'roles', required: true },
      { name: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 150 },
      { name: 'lastName', label: 'Apellidos', type: 'text', required: true, maxLength: 150 },
      { name: 'email', label: 'Correo electrónico', type: 'text', required: true, maxLength: 150, lowercase: true },
      { name: 'passwordHash', label: 'Hash de contraseña', type: 'password', required: true, editOptional: true, help: 'El backend recibe un hash, no una contraseña en texto. Al editar, déjalo vacío para conservarlo.' },
      phoneField
    ],
    listFields: ['lastName', 'email', 'roleId', 'phone']
  },
  {
    key: 'roles', singular: 'rol', plural: 'Roles', titleField: 'name',
    description: 'Organiza los roles de las personas que forman parte de la comunidad.',
    defaultStatus: 'enabled', statusOptions: accountStatuses,
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true, maxLength: 50 },
      descriptionField
    ],
    listFields: ['description']
  }
];

export const getEntityConfig = (key) => entityConfigs.find((config) => config.key === key);
