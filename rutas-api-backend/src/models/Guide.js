import mongoose from 'mongoose';

const guideSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      maxlength: 30
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    specialty: {
      type: String,
      trim: true,
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

export const Guide = mongoose.model('Guide', guideSchema);
