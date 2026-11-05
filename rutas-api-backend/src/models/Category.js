import mongoose from 'mongoose';
import { imageUrlArrayField } from '../utils/urlImage.js';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 10000
    },
    url_image: imageUrlArrayField,
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 150
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
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

export const Category = mongoose.model('Category', categorySchema);
