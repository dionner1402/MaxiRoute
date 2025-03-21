const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
  miningRate: { type: Number, default: 0.8 },
  mxcBalance: { type: Number, default: 0 },
  cMxcBalance: { type: Number, default: 0 },
  claimedCoupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
  convertedCoupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Normalizar email y encriptar contraseña antes de guardar
userSchema.pre('save', async function (next) {
  if (this.isModified('email') && this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password.trim(), salt);
    console.log('Contraseña encriptada durante el registro:', this.password); // Log para verificar
  }
  next();
});

module.exports = mongoose.model('User', userSchema);