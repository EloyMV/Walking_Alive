import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Route } from './src/models/Route.js';
import { generateSlug } from './src/utils/slug.util.js';

dotenv.config();

const initialRoutes = [
  {
    title: 'Ruta del Cares',
    location: 'Picos de Europa (Asturias/León)',
    distanceKm: 12.0,
    difficulty: 'moderada',
    description: 'Conocida como la Garganta Divina, discurre entre Caín y Poncebos a través de un espectacular desfildadero.'
  },
  {
    title: 'Caminito del Rey',
    location: 'El Chorro (Málaga)',
    distanceKm: 7.7,
    difficulty: 'fácil',
    description: 'Paso construido en las paredes del desfiladero de los Gaitanes con pasarelas adosadas a la roca.'
  },
  {
    title: 'Subida al Mulhacén',
    location: 'Sierra Nevada (Granada)',
    distanceKm: 16.5,
    difficulty: 'difícil',
    description: 'Ascensión al pico más alto de la Península Ibérica partiendo desde Hoya de la Mora.'
  }
].map((route, index) => ({
  ...route,
  slug: `${generateSlug(route.title)}-${index + 1}`,
  isActive: true,
  status: 'active',
  deletedAt: null
}));

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rutas_db');
    await Route.deleteMany({});
    await Route.insertMany(initialRoutes);
    console.log('Base de datos poblada con éxito con rutas iniciales');
    process.exit(0);
  } catch (error) {
    console.error('Error al insertar datos de prueba:', error);
    process.exit(1);
  }
};

seedDB();
