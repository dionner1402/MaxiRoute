const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const cMxcTransaction = require('../models/cMxcTransaction');
const { claimCoupon, convertCoupon } = require('../controllers/couponController');

// Obtener todos los cupones
router.get('/', authMiddleware, async (req, res) => {
    try {
        const coupons = await Coupon.find().lean();
        res.json(coupons);
    } catch (error) {
        console.error('Error al obtener cupones:', error);
        res.status(500).json({ message: 'Error al obtener cupones' });
    }
});

// Reclamar cupón
router.post('/claim', authMiddleware, async (req, res) => {
    try {
        console.log('Body recibido en /claim:', req.body);
        const { couponId } = req.body;
        
        if (!couponId) {
            console.log('ID de cupón no proporcionado');
            return res.status(400).json({ message: 'ID de cupón requerido' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ message: 'Cupón no encontrado' });
        }

        if (coupon.quantity <= 0) {
            return res.status(400).json({ message: 'No hay cupones disponibles' });
        }

        if (user.claimedCoupons.includes(couponId)) {
            return res.status(400).json({ message: 'Ya has reclamado este cupón' });
        }

        // Actualizar el cupón y el usuario
        coupon.quantity -= 1;
        await coupon.save();

        user.claimedCoupons.push(couponId);
        await user.save();

        res.json({
            message: 'Cupón reclamado exitosamente',
            coupon
        });
    } catch (error) {
        console.error('Error al reclamar cupón:', error);
        res.status(500).json({ message: 'Error al reclamar cupón' });
    }
});

// Convertir cupón
router.post('/convert', authMiddleware, async (req, res) => {
    try {
        console.log('Body recibido en /convert:', req.body);
        const { couponId } = req.body;

        if (!couponId) {
            return res.status(400).json({ message: 'ID de cupón requerido' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).json({ message: 'Cupón no encontrado' });
        }

        if (!user.claimedCoupons.includes(couponId)) {
            return res.status(400).json({ message: 'Debes reclamar el cupón primero' });
        }

        const fee = coupon.conversionFee || 0.3;
        const convertedAmount = coupon.cMxcValue * (1 - fee);

        // Crear la transacción
        const transaction = new cMxcTransaction({
            user: user._id,
            coupon: coupon._id,
            amount: coupon.cMxcValue,
            fee: fee * coupon.cMxcValue,
            total: convertedAmount,
            type: 'coupon-conversion'
        });
        await transaction.save();

        // Actualizar el balance del usuario y sus cupones
        user.cMxcBalance = (user.cMxcBalance || 0) + convertedAmount;
        user.claimedCoupons = user.claimedCoupons.filter(id => id.toString() !== couponId);
        user.convertedCoupons.push(couponId);
        await user.save();

        res.json({
            message: `Convertidos ${convertedAmount.toFixed(2)} C-MXC`,
            newBalance: user.cMxcBalance,
            transaction: {
                amount: coupon.cMxcValue,
                fee: fee * coupon.cMxcValue,
                total: convertedAmount
            }
        });
    } catch (error) {
        console.error('Error al convertir cupón:', error);
        res.status(500).json({ message: 'Error al convertir cupón' });
    }
});

// Obtener cupones del usuario
router.get('/user/coupons', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const claimedCouponsIds = user.claimedCoupons || [];
        const convertedCouponsIds = user.convertedCoupons || [];

        const claimedCoupons = await Coupon.find({ _id: { $in: claimedCouponsIds } });
        const convertedCoupons = await Coupon.find({ _id: { $in: convertedCouponsIds } });

        res.json({
            claimed: claimedCoupons,
            converted: convertedCoupons
        });
    } catch (error) {
        console.error('Error al obtener cupones del usuario:', error);
        res.status(500).json({ message: 'Error al obtener cupones del usuario' });
    }
});

// Obtener transacciones de cupones convertidos
router.get('/converted', authMiddleware, async (req, res) => {
    try {
        const transactions = await cMxcTransaction.find({
            user: req.user.id,
            type: 'coupon-conversion'
        }).sort({ date: -1 });

        const formattedTransactions = await Promise.all(transactions.map(async (t) => {
            let couponDetails = null;
            if (t.coupon) {
                couponDetails = await Coupon.findById(t.coupon);
            }

            return {
                couponId: t.coupon ? t.coupon.toString() : null,
                amount: t.amount,
                fee: t.fee || 0,
                conversionDate: t.date
            };
        }));

        res.json(formattedTransactions);
    } catch (error) {
        console.error('Error al obtener conversiones de cupones:', error);
        res.status(500).json({ message: 'Error al obtener conversiones de cupones' });
    }
});

// Generar QR para cupón reclamado
router.get('/:id/qr', authMiddleware, async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Cupón no encontrado' });
        }

        const qrData = `COUPON:${coupon._id}|USER:${req.user.id}`;
        res.json({
            success: true,
            data: qrData
        });
    } catch (error) {
        console.error('Error generando QR:', error);
        res.status(500).json({ message: 'Error generando QR' });
    }
});

// Obtener cupón específico por ID - DEBE IR AL FINAL
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        console.log('Buscando cupón con ID:', req.params.id);
        const coupon = await Coupon.findById(req.params.id).lean();
        if (!coupon) {
            return res.status(404).json({ message: 'Cupón no encontrado' });
        }
        res.json(coupon);
    } catch (error) {
        console.error('Error al obtener cupón:', error);
        res.status(500).json({ message: 'Error al obtener cupón' });
    }
});

module.exports = router;