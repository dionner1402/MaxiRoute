const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createTrip, getUserTrips, getTripById } = require('../controllers/tripController');

// Crear un nuevo viaje
router.post('/', authMiddleware, createTrip);

// Obtener todos los viajes del usuario
router.get('/', authMiddleware, getUserTrips);

// Obtener un viaje específico por ID
router.get('/:id', authMiddleware, getTripById);

module.exports = router;