import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
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
      maxlength: 300
    },
    status: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      default: 'enabled'
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

export const Role = mongoose.model('Role', roleSchema);
