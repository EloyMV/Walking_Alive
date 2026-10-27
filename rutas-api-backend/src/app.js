import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routeRoutes from './routes/routeRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import guideRoutes from './routes/guideRoutes.js';
import variantRoutes from './routes/variantRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { setupSwagger } from './config/swagger.js';

const app = express();

// Middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Documentación Swagger
setupSwagger(app);

// Rutas API
app.use('/api/routes', routeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/variants', variantRoutes);
app.use('/api/images', imageRoutes);

// Middleware centralizado de errores
app.use(errorHandler);

export default app;
