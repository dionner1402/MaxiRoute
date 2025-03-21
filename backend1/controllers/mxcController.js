// controllers/mxcController.js
const MxcTransaction = require("../models/mxcTransaction");

const createMxcTransaction = async (req, res) => {
    const { tripId, mxcAmount, horaInicio, horaFin, status } = req.body;

    try {
        // Validar autenticación
        if (!req.user || !req.user.id) { // ✅ Usar req.user.id
            return res.status(401).json({ message: "Usuario no autenticado" });
        }

        // Validar datos requeridos
        if (!tripId || !mxcAmount || !horaInicio || !horaFin) {
            return res.status(400).json({
                message: "Faltan datos: tripId, mxcAmount, horaInicio, horaFin"
            });
        }

        // Crear transacción
        const transaction = await MxcTransaction.create({
            userId: req.user.id, // ✅ Campo correcto (userId)
            tripId: tripId,
            mxcAmount: parseFloat(mxcAmount).toFixed(4), // Formatear a 4 decimales
            horaInicio,
            horaFin,
            status: status || "Procesando",
            date: new Date()
        });

        res.status(201).json({
            message: "Transacción MXC creada",
            transaction
        });

    } catch (error) {
        console.error("Error al crear transacción:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

const getMxcTransactions = async (req, res) => {
    try {
        // Validar autenticación
        if (!req.user || !req.user.id) { // ✅ Usar req.user.id
            return res.status(401).json({ message: "Usuario no autenticado" });
        }

        // Obtener transacciones
        const transactions = await MxcTransaction.find({ userId: req.user.id })
            .sort({ date: -1 });

        // Formatear respuesta para el frontend
        const formattedTransactions = transactions.map(t => ({
            tripId: t.tripId,
            mxcAmount: t.mxcAmount,
            status: t.status,
            timestamp: t.date,
            tokenType: "MXC",        // ✅ Campo requerido
            source: "Viaje"           // ✅ Campo requerido
        }));

        res.status(200).json(formattedTransactions);

    } catch (error) {
        console.error("Error al obtener transacciones:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

module.exports = { createMxcTransaction, getMxcTransactions };