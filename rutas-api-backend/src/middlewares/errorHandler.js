import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  if (err instanceof ZodError) {
    statusCode = 400;
    message = err.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
  }

  // Manejo de IDs inválidos de Mongoose
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Formato de ID inválido';
  }

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Ya existe una ruta con ese slug';
  }

  res.status(statusCode).json({
    error: true,
    message
  });
};
