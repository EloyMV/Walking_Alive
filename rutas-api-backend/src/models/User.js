import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 150
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      maxlength: 30
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

export const User = mongoose.model('User', userSchema);
