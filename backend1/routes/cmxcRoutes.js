const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const cMxcTransaction = require('../models/cMxcTransaction');
const Coupon = require('../models/Coupon');

// Transferir a wallet (C-MXC)
router.post('/transfer', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Cantidad inválida' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        user.cMxcBalance += parseFloat(amount);
        await user.save();

        const transaction = new cMxcTransaction({
            user: req.user.id,
            amount: parseFloat(amount),
            type: 'transfer',
            date: new Date()
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: `Transferencia de ${amount} C-MXC realizada con éxito`,
            newBalance: user.cMxcBalance
        });
    } catch (error) {
        console.error('Error en transferencia:', error);
        res.status(500).json({ message: 'Error al realizar la transferencia' });
    }
});

// Obtener saldo de la wallet (C-MXC)
router.get('/wallet/balance', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.status(200).json({ balance: user.cMxcBalance || 0 });
    } catch (error) {
        console.error('Error al obtener el saldo:', error);
        res.status(500).json({ message: 'Error al obtener el saldo' });
    }
});

// Obtener todas las transacciones del usuario
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const transactions = await cMxcTransaction.find({ user: req.user.id })
            .populate('coupon', 'title description') // Poblar datos del cupón si existe
            .sort({ date: -1 }) // Ordenar por fecha, más reciente primero
            .lean();

        res.json(transactions);
    } catch (error) {
        console.error('Error al obtener transacciones:', error);
        res.status(500).json({ message: 'Error al obtener transacciones' });
    }
});

// Obtener transacciones de C-MXC
router.get('/transactions/cmxc', authMiddleware, async (req, res) => {
    try {
        const transactions = await cMxcTransaction.find({ user: req.user.id })
            .populate('coupon') // Añade populate para obtener datos del cupón
            .sort({ date: -1 });

        const formattedTransactions = transactions.map(transaction => ({
            couponId: transaction.coupon?._id?.toString() || null, // Usar _id del cupón
            mxcAmount: transaction.amount.toFixed(4),
            fee: transaction.fee?.toFixed(4) || '0.0000',
            availableAmount: transaction.total?.toFixed(4) || transaction.amount.toFixed(4),
            tokenType: 'C-MXC',
            status: 'Validado',
            timestamp: transaction.date,
            source: transaction.type === 'coupon-conversion' ? 'Conversión de Cupón' : 'Otra transacción'
        }));

        res.status(200).json(formattedTransactions);
    } catch (error) {
        console.error('Error al obtener transacciones C-MXC:', error);
        res.status(500).json({ message: 'Error al obtener transacciones C-MXC' });
    }
});

// Recargar saldo (C-MXC)
router.post('/wallet/recharge', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Cantidad inválida' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        user.cMxcBalance += parseFloat(amount);
        await user.save();

        const transaction = new cMxcTransaction({
            user: req.user.id,
            amount: parseFloat(amount),
            type: 'recharge',
            date: new Date()
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: `Recarga de ${amount} C-MXC exitosa`,
            newBalance: user.cMxcBalance
        });
    } catch (error) {
        console.error('Error al recargar saldo:', error);
        res.status(500).json({ message: 'Error al recargar saldo' });
    }
});

// Sincronizar transacciones offline (C-MXC)
router.post('/wallet/sync', authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: 'Cantidad inválida' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        if (user.cMxcBalance < amount) {
            return res.status(400).json({ message: 'Saldo insuficiente' });
        }

        user.cMxcBalance -= parseFloat(amount);
        await user.save();

        const transaction = new cMxcTransaction({
            user: req.user.id,
            amount: -parseFloat(amount),
            type: 'offline-sync',
            date: new Date()
        });
        await transaction.save();

        res.status(200).json({
            success: true,
            message: 'Transacción sincronizada correctamente',
            newBalance: user.cMxcBalance
        });
    } catch (error) {
        console.error('Error al sincronizar transacción:', error);
        res.status(500).json({ message: 'Error al sincronizar' });
    }
});

// Reclamar cupón (lógica compartida, pero se usará para C-MXC)
router.post('/coupons/claim', authMiddleware, async (req, res) => {
    try {
        const { couponCode } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (user.claimedCoupons.includes(couponCode)) {
            return res.status(400).json({ message: 'Cupón ya reclamado' });
        }

        const coupon = await Coupon.findById(couponCode);
        if (!coupon) {
            return res.status(400).json({ message: 'Cupón no encontrado' });
        }

        user.claimedCoupons.push(couponCode);
        await user.save();

        res.status(200).json({ message: 'Cupón reclamado exitosamente' });
    } catch (error) {
        console.error('Error al reclamar cupón:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Convertir cupón a C-MXC
router.post('/coupons/convert', authMiddleware, async (req, res) => {
    try {
        const { couponCode } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const coupon = await Coupon.findById(couponCode);
        if (!coupon) {
            return res.status(400).json({ message: 'Cupón no encontrado' });
        }

        if (!user.claimedCoupons.includes(couponCode)) {
            return res.status(400).json({ message: 'Cupón no reclamado previamente' });
        }

        const conversionFee = 0.3;
        const feeAmount = coupon.cMxcValue * conversionFee;
        const convertedAmount = coupon.cMxcValue * (1 - conversionFee);

        user.cMxcBalance = (user.cMxcBalance || 0) + convertedAmount;
        user.convertedCoupons.push(couponCode);
        user.claimedCoupons = user.claimedCoupons.filter(c => c.toString() !== couponCode.toString());
        await user.save();

        const transaction = new cMxcTransaction({
            user: req.user.id,
            coupon: couponCode,
            amount: coupon.cMxcValue,
            fee: feeAmount,
            total: convertedAmount,
            type: 'coupon-conversion',
            date: new Date()
        });
        await transaction.save();

        res.status(200).json({
            message: 'Cupón convertido exitosamente',
            newBalance: user.cMxcBalance,
            transaction
        });
    } catch (error) {
        console.error('Error al convertir cupón:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Reiniciar cupones (lógica compartida, pero se usará para C-MXC)
router.post('/coupons/reset', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        user.claimedCoupons = [];
        user.convertedCoupons = [];
        await user.save();

        res.status(200).json({ message: 'Cupones reiniciados correctamente' });
    } catch (error) {
        console.error('Error al reiniciar cupones:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

module.exports = router;