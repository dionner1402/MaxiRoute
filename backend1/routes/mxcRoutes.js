const express = require('express');
const router = express.Router();
const { createMxcTransaction, getMxcTransactions } = require('../controllers/mxcController');
const authMiddleware = require('../middleware/auth');
const MxcTransaction = require('../models/mxcTransaction');
const User = require('../models/User');

// Crear una transacción de MXC (para un viaje)
router.post('/transactions', authMiddleware, async (req, res) => {
    try {
        const { tripId, mxcAmount, horaInicio, horaFin, status } = req.body;
        if (!tripId || !mxcAmount || !horaInicio || !horaFin) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        const transaction = new MxcTransaction({
            userId: req.user.id, // Usamos userId como en el modelo
            tripId,
            mxcAmount,
            horaInicio,
            horaFin,
            status: status || 'Procesando',
            date: new Date()
        });

        await transaction.save();
        res.status(201).json({ message: 'Transacción MXC creada', transaction });
    } catch (error) {
        console.error('Error al crear transacción MXC:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener transacciones de MXC para el usuario
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const transactions = await MxcTransaction.find({ userId: req.user.id })
            .sort({ date: -1 });

        // Formateamos las transacciones para que coincidan con lo que espera el frontend
        const formattedTransactions = transactions.map(transaction => ({
            tripId: transaction.tripId,
            mxcAmount: transaction.mxcAmount,
            status: transaction.status,
            timestamp: transaction.date,
            tokenType: 'MXC',
            source: 'Viaje'
        }));

        res.status(200).json(formattedTransactions);
    } catch (error) {
        console.error('Error al obtener transacciones MXC:', error);
        res.status(500).json({ message: 'Error al obtener transacciones MXC' });
    }
});

module.exports = router;