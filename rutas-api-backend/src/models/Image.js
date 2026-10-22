import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema(
  {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
      default: null
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Variant',
      default: null
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null
    },
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guide',
      default: null
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    altText: {
      type: String,
      trim: true,
      default: '',
      maxlength: 255
    },
    position: {
      type: Number,
      min: 0,
      validate: Number.isInteger,
      default: 0
    },
    isCover: {
      type: Boolean,
      default: false
    },
    source: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    author: {
      type: String,
      trim: true,
      default: null,
      maxlength: 150
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
      default: 'published'
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

export const Image = mongoose.model('Image', imageSchema);
