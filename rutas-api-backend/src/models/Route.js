import mongoose from 'mongoose';
import { DEFAULT_ROUTE_STATUS, normalizeLegacyRouteStatus, ROUTE_STATUSES } from '../utils/routeStatus.js';

const routeSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    },
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guide'
    },
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    durationMinutes: {
      type: Number,
      min: 0,
      validate: Number.isInteger
    },
    minParticipants: {
      type: Number,
      default: 1,
      min: 1,
      validate: Number.isInteger
    },
    maxParticipants: {
      type: Number,
      default: 20,
      min: 1,
      validate: [
        { validator: Number.isInteger, message: 'maxParticipants debe ser un entero' },
        {
          validator: function (value) { return value >= this.minParticipants; },
          message: 'maxParticipants no puede ser menor que minParticipants'
        }
      ]
    },
    startAt: {
      type: Date
    },
    recommendedEquipment: {
      type: String,
      trim: true,
      default: '',
      maxlength: 5000
    },
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [120, 'El título no puede superar los 120 caracteres']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    deletedAt: {
      type: Date,
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      trim: true,
      required: true,
      enum: {
        values: ROUTE_STATUSES,
        message: 'El estado debe ser programado, en curso o finalizado'
      },
      default: DEFAULT_ROUTE_STATUS
    },
    location: {
      type: String,
      // Compatibilidad con las rutas anteriores que guardaban la ubicación como texto.
      required: function () { return !this.locationId; },
      trim: true,
      maxlength: [100, 'La ubicación no puede superar los 100 caracteres']
    },
    distanceKm: {
      type: Number,
      required: [true, 'La distancia en kilómetros es obligatoria'],
      min: [0.1, 'La distancia debe ser de al menos 0.1 km']
    },
    difficulty: {
      type: String,
      required: [true, 'La dificultad es obligatoria'],
      enum: {
        values: ['fácil', 'moderada', 'difícil'],
        message: 'Dificultad no válida (fácil, moderada, difícil)'
      },
      default: 'moderada'
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede superar los 500 caracteres'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Normalizar solo documentos ya guardados: no convertir entradas nuevas inválidas.
// La próxima edición de una ruta antigua persiste su estado normalizado.
routeSchema.post('init', function normalizeExistingStatus(route) {
  route.status = normalizeLegacyRouteStatus(route.status);
});

routeSchema.pre(/^find/, function excludeDeleted(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Route = mongoose.model('Route', routeSchema);
