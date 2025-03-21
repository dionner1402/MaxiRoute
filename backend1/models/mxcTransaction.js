// models/mxcTransaction.js
const mongoose = require("mongoose");

// models/mxcTransaction.js
const mxcTransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // ✅
    tripId: { type: String, required: true },
    mxcAmount: { type: String, required: true },
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
    status: { type: String, default: "Procesando" },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("MxcTransaction", mxcTransactionSchema);