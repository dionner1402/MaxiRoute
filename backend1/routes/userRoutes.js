const express = require('express');
const {
    registerUser,
    loginUser,
    getUserProfile,
    forgotPassword,
    resetPassword,
    resetCoupons
} = require('../controllers/userController');
const { claimCoupon, convertCoupon } = require('../controllers/couponController');
const { createMxcTransaction, getMxcTransactions } = require('../controllers/mxcController');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Autenticación (sin cambios)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authMiddleware, getUserProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Cupones (sin cambios)
router.post('/coupons/claim', authMiddleware, claimCoupon);
router.post('/coupons/convert', authMiddleware, convertCoupon);
router.post('/coupons/reset', authMiddleware, resetCoupons); // ✅ Función existente



module.exports = router;