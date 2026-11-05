import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Role } from './src/models/Role.js';
import { User } from './src/models/User.js';
import { Category } from './src/models/Category.js';
import { Location } from './src/models/Location.js';
import { Guide } from './src/models/Guide.js';
import { Route } from './src/models/Route.js';
import { Variant } from './src/models/Variant.js';
import { generateSlug } from './src/utils/slug.util.js';

dotenv.config();

const buildSeedData = () => {
  const roles = [
    { name: 'Administrador', description: 'Gestiona usuarios, rutas y contenidos' },
    { name: 'Guía', description: 'Organiza y acompaña las rutas' },
    { name: 'Cliente', description: 'Consulta rutas y sus variantes' }
  ].map((data) => new Role({ ...data, slug: generateSlug(data.name) }));
  const roleBySlug = Object.fromEntries(roles.map((role) => [role.slug, role]));

  const users = [
    { name: 'María', lastName: 'Pérez', email: 'admin@walkingalive.local', role: 'administrador' },
    { name: 'Carlos', lastName: 'Martínez', email: 'carlos@walkingalive.local', role: 'guia' },
    { name: 'Luna', lastName: 'García', email: 'luna@walkingalive.local', role: 'guia' },
    { name: 'Oriol', lastName: 'Soler', email: 'oriol@walkingalive.local', role: 'guia' },
    { name: 'Clara', lastName: 'López', email: 'clara@walkingalive.local', role: 'cliente' },
    { name: 'Pablo', lastName: 'Ruiz', email: 'pablo@walkingalive.local', role: 'cliente' }
  ].map(({ role, ...data }) => new User({
    ...data,
    roleId: roleBySlug[role]._id,
    slug: generateSlug(`${data.name} ${data.lastName}`),
    passwordHash: 'HASH_DE_EJEMPLO_NO_VALIDO',
    phone: null,
    url_image: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80']
  }));
  const userByEmail = Object.fromEntries(users.map((user) => [user.email, user]));

  const categories = [
    {
      name: 'Senderismo', description: 'Recorridos a pie por senderos y espacios naturales',
      url_image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Montaña', description: 'Rutas de montaña con mayor exigencia física',
      url_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Cultural', description: 'Paseos por el patrimonio histórico y urbano',
      url_image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80'
    }
  ].map((data) => new Category({ ...data, url_image: [data.url_image], slug: generateSlug(data.name) }));
  const categoryBySlug = Object.fromEntries(categories.map((category) => [category.slug, category]));

  const locations = [
    {
      name: 'Picos de Europa', city: 'Cabrales', region: 'Asturias',
      description: 'Entorno natural de la garganta del Cares',
      meetingPoint: 'Aparcamiento de Poncebos', latitude: 43.258, longitude: -4.831,
      url_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'El Chorro', city: 'Ardales', region: 'Málaga',
      description: 'Desfiladero de los Gaitanes y sus pasarelas',
      meetingPoint: 'Acceso norte del Caminito del Rey', latitude: 36.914, longitude: -4.801,
      url_image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Sierra Nevada', city: 'Capileira', region: 'Granada',
      description: 'Paisajes de alta montaña de Sierra Nevada',
      meetingPoint: 'Centro de visitantes de Capileira', latitude: 36.961, longitude: -3.359,
      url_image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Girona', city: 'Girona', region: 'Cataluña',
      description: 'Casco histórico y caminos naturales próximos a la ciudad',
      meetingPoint: 'Estación de tren de Girona, salida principal', latitude: 41.9794, longitude: 2.8214,
      url_image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Barcelona', city: 'Barcelona', region: 'Cataluña',
      description: 'Parques, miradores y patrimonio de Barcelona',
      meetingPoint: 'Plaça de Catalunya, junto a la oficina de turismo', latitude: 41.3874, longitude: 2.1686,
      url_image: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80'
    },
    {
      name: 'Albufera de Valencia', city: 'Valencia', region: 'Comunitat Valenciana',
      description: 'Senderos y paisajes del entorno de la Albufera',
      meetingPoint: 'Centro de visitantes del Racó de l’Olla', latitude: 39.334, longitude: -0.318,
      url_image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80'
    }
  ].map((data) => new Location({
    ...data, url_image: [data.url_image], country: 'España', slug: generateSlug(data.name)
  }));
  const locationBySlug = Object.fromEntries(locations.map((location) => [location.slug, location]));

  const guides = [
    {
      email: 'carlos@walkingalive.local', specialty: 'Alta montaña',
      description: 'Guía de ejemplo especializado en recorridos de montaña',
      url_image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80'
    },
    {
      email: 'luna@walkingalive.local', specialty: 'Naturaleza',
      description: 'Guía de ejemplo para senderismo y educación ambiental',
      url_image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80'
    },
    {
      email: 'oriol@walkingalive.local', specialty: 'Patrimonio cultural',
      description: 'Guía de ejemplo para paseos urbanos y rutas históricas',
      url_image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
    }
  ].map((data, index) => {
    const user = userByEmail[data.email];
    return new Guide({
      ...data,
      userId: user._id,
      name: `${user.name} ${user.lastName}`,
      phone: null,
      licenseNumber: `DEMO-GUIA-${String(index + 1).padStart(3, '0')}`,
      slug: `${user.slug}-guia`,
      url_image: [data.url_image]
    });
  });
  const guideByEmail = Object.fromEntries(guides.map((guide) => [guide.email, guide]));

  // Distancias, duraciones y precios orientativos para probar la aplicación.
  const routeExamples = [
    {
      title: 'Ruta del Cares', location: 'picos-de-europa', category: 'senderismo', guide: 'carlos',
      distanceKm: 12, difficulty: 'moderada', durationMinutes: 240, price: '35.00', minimumAge: 12,
      url_image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
      description: 'Recorrido guiado de ejemplo por la garganta del Cares, entre paredes de roca y miradores.',
      recommendedEquipment: 'Botas de senderismo, agua, comida y protección solar'
    },
    {
      title: 'Caminito del Rey', location: 'el-chorro', category: 'senderismo', guide: 'luna',
      distanceKm: 7.7, difficulty: 'moderada', durationMinutes: 180, price: '30.00', minimumAge: 12,
      url_image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
      description: 'Ruta de ejemplo por las pasarelas del desfiladero de los Gaitanes.',
      recommendedEquipment: 'Calzado cerrado, agua y ropa cómoda'
    },
    {
      title: 'Ascensión al Mulhacén', location: 'sierra-nevada', category: 'montana', guide: 'carlos',
      distanceKm: 20, difficulty: 'difícil', durationMinutes: 480, price: '65.00', minimumAge: 18,
      url_image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      description: 'Jornada de ejemplo de alta montaña para participantes con experiencia y buena preparación física.',
      recommendedEquipment: 'Botas de montaña, abrigo, impermeable, comida y agua'
    },
    {
      title: 'Murallas y casco antiguo de Girona', location: 'girona', category: 'cultural', guide: 'oriol',
      distanceKm: 4.5, difficulty: 'fácil', durationMinutes: 120, price: '18.00', minimumAge: 6,
      url_image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80',
      description: 'Paseo por calles históricas, plazas y miradores del casco antiguo de Girona.',
      recommendedEquipment: 'Calzado cómodo, agua y cámara de fotos'
    },
    {
      title: 'Senderismo al castillo de Sant Miquel', location: 'girona', category: 'senderismo', guide: 'luna',
      distanceKm: 10, difficulty: 'moderada', durationMinutes: 210, price: '25.00', minimumAge: 10,
      url_image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
      description: 'Recorrido de ejemplo por caminos de bosque hasta un mirador del entorno de Girona.',
      recommendedEquipment: 'Zapatillas de senderismo, agua y tentempié'
    },
    {
      title: 'Miradores de Collserola', location: 'barcelona', category: 'senderismo', guide: 'luna',
      distanceKm: 9, difficulty: 'moderada', durationMinutes: 180, price: '22.00', minimumAge: 10,
      url_image: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80',
      description: 'Ruta de ejemplo por senderos de Collserola con vistas sobre Barcelona.',
      recommendedEquipment: 'Calzado de senderismo, agua y protección solar'
    },
    {
      title: 'Paseo cultural por Montjuïc', location: 'barcelona', category: 'cultural', guide: 'oriol',
      distanceKm: 5, difficulty: 'fácil', durationMinutes: 150, price: '20.00', minimumAge: 6,
      url_image: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80',
      description: 'Paseo guiado de ejemplo por jardines, miradores y espacios históricos de Montjuïc.',
      recommendedEquipment: 'Calzado cómodo, gorra y agua'
    },
    {
      title: 'Senderos de la Albufera', location: 'albufera-de-valencia', category: 'senderismo', guide: 'luna',
      distanceKm: 6, difficulty: 'fácil', durationMinutes: 120, price: '24.00', minimumAge: 6,
      url_image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80',
      description: 'Paseo de ejemplo para conocer los paisajes y observar las aves del entorno de la Albufera.',
      recommendedEquipment: 'Calzado cómodo, agua, prismáticos y repelente de insectos'
    }
  ];
  const now = new Date();
  const routes = routeExamples.map(({ location, category, guide, price, minimumAge, ...data }, index) => {
    const place = locationBySlug[location];
    const startAt = new Date(now);
    startAt.setUTCDate(startAt.getUTCDate() + index + 2);
    startAt.setUTCHours(8, 0, 0, 0);

    return new Route({
      ...data,
      url_image: [data.url_image],
      slug: generateSlug(data.title),
      categoryId: categoryBySlug[category]._id,
      locationId: place._id,
      // Se conserva el texto para que el frontend actual pueda mostrar la ubicación.
      location: `${place.name} (${place.region})`,
      guideId: guideByEmail[`${guide}@walkingalive.local`]._id,
      createdByUserId: userByEmail['admin@walkingalive.local']._id,
      startAt,
      status: 'programado'
    });
  });

  const variants = routes.flatMap((route, index) => {
    const example = routeExamples[index];
    return [false, true].map((includesTransport) => {
      const suffix = includesTransport ? 'con-transporte' : 'sin-transporte';
      // Los importes se construyen con enteros y se guardan como Decimal128.
      const cents = Number(example.price.replace('.', '')) + (includesTransport ? 1500 : 0);
      const price = `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
      return new Variant({
        routeId: route._id,
        name: includesTransport ? 'Ruta guiada con transporte' : 'Ruta guiada sin transporte',
        description: includesTransport ? 'Incluye guía y traslado desde el punto de encuentro' : 'Incluye guía; desplazamiento por cuenta del participante',
        sku: `RUTA-${String(index + 1).padStart(3, '0')}-${includesTransport ? 'BUS' : 'BASE'}`,
        price: mongoose.Types.Decimal128.fromString(price),
        currency: 'EUR',
        capacity: route.difficulty === 'difícil' ? 8 : 20,
        minimumAge: example.minimumAge,
        includesTransport,
        url_image: [includesTransport
          ? 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80'
          : example.url_image],
        slug: `${route.slug}-${suffix}`
      });
    });
  });

  // Orden de inserción: primero los documentos referenciados.
  return [
    { model: Role, documents: roles },
    { model: User, documents: users },
    { model: Category, documents: categories },
    { model: Location, documents: locations },
    { model: Guide, documents: guides },
    { model: Route, documents: routes },
    { model: Variant, documents: variants }
  ];
};

const seed = async () => {
  try {
    const collections = buildSeedData();
    // Validar todos los ejemplos y sus referencias antes de borrar ningún documento.
    const idsByModel = new Map(collections.map(({ model, documents }) => [
      model.modelName, new Set(documents.map((document) => String(document._id)))
    ]));
    for (const { model, documents } of collections) {
      for (const document of documents) {
        await document.validate();
        for (const path of Object.values(model.schema.paths)) {
          const reference = document.get(path.path);
          if (path.options.ref && reference != null && !idsByModel.get(path.options.ref)?.has(String(reference))) {
            throw new Error(`Referencia inválida: ${model.modelName}.${path.path}`);
          }
        }
      }
      for (const [fields, options] of model.schema.indexes()) {
        if (!options.unique) continue;
        const values = documents.map((document) => JSON.stringify(Object.keys(fields).map((field) => document.get(field))));
        if (new Set(values).size !== values.length) {
          throw new Error(`Valores duplicados en ${model.modelName}: ${Object.keys(fields).join(', ')}`);
        }
      }
    }

    const summary = Object.fromEntries(collections.map(({ model, documents }) => [model.collection.name, documents.length]));
    if (process.argv.includes('--dry-run')) {
      console.log('Validación correcta. No se ha conectado ni modificado MongoDB.');
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rutas_db');
    console.log(`Sustituyendo datos en la base: ${mongoose.connection.name}`);
    // Borrar primero los documentos que dependen de otras colecciones.
    for (const { model } of [...collections].reverse()) {
      await model.deleteMany({});
    }
    for (const { model, documents } of collections) {
      await model.insertMany(documents);
    }

    console.log('Seed completado correctamente');
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error('Error al poblar los datos de prueba:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seed();
