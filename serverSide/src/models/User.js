import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  // Basic Info
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  
  // Personal Info
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', ''] },
  
  // Shop Info
  shopName: { type: String, required: true },
  role: { type: String, default: 'admin', enum: ['admin', 'staff', 'manager'] },
  
  // Address
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String }
  },
  
  // Shop Settings
  shopSettings: {
    address: { type: String },
    businessType: { type: String },
    phone: { type: String },
    description: { type: String },
    taxId: { type: String },
    website: { type: String }
  },
  
  // Preferences
  preferences: {
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' },
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true },
    emailUpdates: { type: Boolean, default: false }
  },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },

  // Refresh tokens (hashed) for token-based auth; max 5 per user
  refreshTokens: [{
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  }],
}, { timestamps: true })

export default mongoose.model('User', userSchema)
