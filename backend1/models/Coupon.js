const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    expiry: { type: Date, required: true },
    quantity: { type: Number, required: true },
    terms: { type: String },
    benefitType: { type: String, required: true }, // Ejemplo: "recarga_gasolina", "consumo_restaurante"
    cMxcValue: { type: Number, required: true },   // Valor en C-MXC
    conversionFee: { type: Number, default: 0.3 }, // Comisión del 30% al convertir
});

module.exports = mongoose.model('Coupon', couponSchema);