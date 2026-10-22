import mongoose from 'mongoose';

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
    timestamps: true
  }
);

export const Category = mongoose.model('Category', categorySchema);
