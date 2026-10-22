import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routeRoutes from './routes/routeRoutes.js';
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

// Middleware centralizado de errores
app.use(errorHandler);

export default app;
