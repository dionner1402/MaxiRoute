const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createTrip } = require('../controllers/tripController');

console.log('Cargando rutas de viajes en /api/viajes'); // Depuración

// Crear un nuevo viaje
router.post('/', authMiddleware, createTrip);

module.exports = router;