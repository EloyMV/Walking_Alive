import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
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
    meetingPoint: {
      type: String,
      trim: true,
      maxlength: 5000
    },
    city: {
      type: String,
      trim: true,
      maxlength: 100
    },
    region: {
      type: String,
      trim: true,
      maxlength: 100
    },
    country: {
      type: String,
      trim: true,
      maxlength: 100
    },
    latitude: {
      type: Number,
      min: -90,
      max: 90,
      default: null
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
      default: null
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

export const Location = mongoose.model('Location', locationSchema);
