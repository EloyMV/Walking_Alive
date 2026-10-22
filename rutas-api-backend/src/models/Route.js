import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema(
  {
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
      maxlength: [50, 'El estado no puede superar los 50 caracteres'],
      default: 'active'
    },
    location: {
      type: String,
      required: [true, 'La ubicación es obligatoria'],
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

routeSchema.pre(/^find/, function excludeDeleted(next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

export const Route = mongoose.model('Route', routeSchema);
