const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    distancia: { type: String, required: true },
    horaInicio: { type: String, default: "00:00:00" },
    horaFin: { type: String, default: "00:00:00" },
    endDate: { type: String, default: "1970-01-01" },
    montoCobrado: { type: String, default: "0" },
    plataforma: { type: String, default: "UBER" },
    comision: { type: String, default: "0.00" },
    duracion: { type: String, default: "0 min 0 seg" },
    costoMantenimiento: { type: String, default: "0" },
    costoMantPorViaje: { type: String, default: "0.0000" },
    costoSeguro: { type: String, default: "0" },
    costoSeguroPorViaje: { type: String, default: "0.0000" },
    totalGastosDia: { type: String, default: "0" },
    pagoCuentaSemana: { type: String, default: "0" },
    costoCtaPorViaje: { type: String, default: "0.0000" },
    rentaCelular: { type: String, default: "0" },
    costoCelPorViaje: { type: String, default: "0.0000" },
    consumo: { type: String, default: "0.0000" },
    precioGasolina: { type: String, default: "0" },
    costoGasolina: { type: String, default: "0.00" },
    kmRecorridos: { type: String, default: "0" },
    minedMXC: { type: String, default: "0.0000" },
    mapImageURI: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);