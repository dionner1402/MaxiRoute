// models/cMxcTransaction.js
const mongoose = require("mongoose");

const cMxcTransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    amount: { type: Number, required: true },
    fee: { type: Number },
    total: { type: Number },
    type: {
        type: String,
        enum: ['transfer', 'recharge', 'offline-sync', 'coupon-conversion'],
        required: true
    },
    date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("cMxcTransaction", cMxcTransactionSchema);