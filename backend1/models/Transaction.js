const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tripId: { type: String, required: true },
    mxcAmount: { type: Number, required: true },
    status: { type: String, enum: ['Procesando', 'Validado', 'Rechazado'], default: 'Procesando' },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', transactionSchema);