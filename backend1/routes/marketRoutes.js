const express = require('express');
const router = express.Router();
const { createOffer, getOffers, buyOffer, cancelOffer } = require('../controllers/marketController');
const authMiddleware = require('../middleware/auth');

// Rutas del mercado P2P
router.post('/offers', authMiddleware, createOffer);
router.get('/offers', authMiddleware, getOffers);
router.post('/offers/buy', authMiddleware, buyOffer);
router.post('/offers/cancel', authMiddleware, cancelOffer);

module.exports = router;