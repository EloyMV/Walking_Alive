import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema(
  {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 10000
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      validate: (value) => value != null && /^\d+(\.\d+)?$/.test(value.toString())
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Z]{3}$/
    },
    capacity: {
      type: Number,
      min: 0,
      validate: Number.isInteger,
      required: true
    },
    minimumAge: {
      type: Number,
      min: 0,
      validate: Number.isInteger,
      default: 0
    },
    includesTransport: {
      type: Boolean,
      default: false
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 300
    },
    status: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      default: 'available'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Variant = mongoose.model('Variant', variantSchema);
