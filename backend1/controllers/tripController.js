const Trip = require('../models/Trip');
const User = require('../models/User');

const createTrip = async (req, res) => {
    // Solo distancia es requerida desde el frontend
    const requiredFields = ['distancia'];

    // Validación de campos obligatorios del frontend
    const missingFields = requiredFields.filter(field => !req.body[field] && req.body[field] !== 0);
    if (missingFields.length > 0) {
        return res.status(400).json({
            message: `Faltan campos requeridos: ${missingFields.join(', ')}`
        });
    }

    try {
        // Completar datos con valores por defecto válidos para cumplir con el esquema
        const tripData = {
            userId: req.user._id, // Obligatorio, viene del token
            distancia: parseFloat(req.body.distancia || "0").toFixed(2), // Obligatorio, del frontend
            horaInicio: req.body.horaInicio || "00:00:00", // Valor por defecto válido
            horaFin: req.body.horaFin || "00:00:00", // Valor por defecto válido
            endDate: req.body.endDate || "1970-01-01", // Valor por defecto válido
            montoCobrado: req.body.montoCobrado || "0", // Requerido por el esquema
            plataforma: req.body.plataforma || "UBER", // Requerido por el esquema
            comision: req.body.comision || "0.00", // Requerido por el esquema
            duracion: req.body.duracion || "0 min 0 seg", // Requerido por el esquema
            costoMantenimiento: req.body.costoMantenimiento || "0", // Requerido por el esquema
            costoMantPorViaje: req.body.costoMantPorViaje || "0.0000", // Requerido por el esquema
            costoSeguro: req.body.costoSeguro || "0", // Requerido por el esquema
            costoSeguroPorViaje: req.body.costoSeguroPorViaje || "0.0000", // Requerido por el esquema
            totalGastosDia: req.body.totalGastosDia || "0", // Requerido por el esquema
            pagoCuentaSemana: req.body.pagoCuentaSemana || "0", // Requerido por el esquema
            costoCtaPorViaje: req.body.costoCtaPorViaje || "0.0000", // Requerido por el esquema
            rentaCelular: req.body.rentaCelular || "0", // Requerido por el esquema
            costoCelPorViaje: req.body.costoCelPorViaje || "0.0000", // Requerido por el esquema
            consumo: req.body.consumo || "0.0000", // Requerido por el esquema
            precioGasolina: req.body.precioGasolina || "0", // Requerido por el esquema
            costoGasolina: req.body.costoGasolina || "0.00", // Requerido por el esquema
            kmRecorridos: req.body.kmRecorridos || "0", // Requerido por el esquema
            minedMXC: req.body.minedMXC || "0.0000", // Requerido por el esquema
            mapImageURI: req.body.mapImageURI || null, // Opcional
        };

        // Crear el viaje en la base de datos
        const trip = await Trip.create(tripData);

        // Actualizar el kilometraje total del usuario si es necesario
        if (parseFloat(tripData.distancia) > 0) {
            await User.findByIdAndUpdate(
                req.user._id,
                { $inc: { kmRecorridos: parseFloat(tripData.distancia) } }
            );
        }

        res.status(201).json(trip);
    } catch (error) {
        console.error('Error al crear el viaje:', error);
        res.status(500).json({
            message: 'Error al crear el viaje',
            error: error.message
        });
    }
};

// Obtener todos los viajes del usuario
const getUserTrips = async (req, res) => {
    try {
        const trips = await Trip.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json(trips);
    } catch (error) {
        console.error('Error al obtener los viajes:', error);
        res.status(500).json({
            message: 'Error al obtener los viajes',
            error: error.message
        });
    }
};

// Obtener un viaje específico
const getTripById = async (req, res) => {
    try {
        const trip = await Trip.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!trip) {
            return res.status(404).json({ message: 'Viaje no encontrado' });
        }

        res.status(200).json(trip);
    } catch (error) {
        console.error('Error al obtener el viaje:', error);
        res.status(500).json({
            message: 'Error al obtener el viaje',
            error: error.message
        });
    }
};

module.exports = {
    createTrip,
    getUserTrips,
    getTripById
};