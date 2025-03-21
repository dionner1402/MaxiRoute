// controllers/couponController.js
const Coupon = require("../models/Coupon");
const User = require("../models/User");

const claimCoupon = async (req, res) => {
    const { couponId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!couponId) {
        return res.status(400).json({ message: "Se requiere el ID del cupón" });
    }

    try {
        const coupon = await Coupon.findById(couponId).lean();
        if (!coupon) {
            return res.status(404).json({ message: "Cupón no encontrado" });
        }

        if (coupon.quantity <= 0) {
            return res.status(400).json({ message: "Cupón no disponible" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        if (user.claimedCoupons.some(c => c.toString() === coupon._id.toString())) {
            return res.status(400).json({ message: "Ya has reclamado este cupón" });
        }

        user.claimedCoupons.push(coupon._id);
        await user.save();

        await Coupon.updateOne({ _id: coupon._id }, { quantity: coupon.quantity - 1 });

        res.status(200).json({ message: "Cupón reclamado con éxito" });
    } catch (error) {
        console.error("Error al reclamar cupón:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

const convertCoupon = async (req, res) => {
    const { couponId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!couponId) {
        return res.status(400).json({ message: "Se requiere el ID del cupón" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const coupon = await Coupon.findById(couponId).lean();
        if (!coupon) {
            return res.status(404).json({ message: "Cupón no encontrado" });
        }

        const claimedIndex = user.claimedCoupons.findIndex(c => c.toString() === coupon._id.toString());
        if (claimedIndex === -1) {
            return res.status(400).json({ message: "No has reclamado este cupón" });
        }

        const commission = coupon.conversionFee || 0.3;
        const cMxcAmount = coupon.cMxcValue * (1 - commission);

        user.cMxcBalance = (user.cMxcBalance || 0) + cMxcAmount;
        const convertedCoupon = user.claimedCoupons.splice(claimedIndex, 1)[0]; // Extraer el cupón
        user.convertedCoupons.push(convertedCoupon); // Añadir a convertedCoupons
        await user.save();

        res.status(200).json({ message: "Cupón convertido con éxito", cMxcAmount, newBalance: user.cMxcBalance });
    } catch (error) {
        console.error("Error al convertir cupón:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

module.exports = { claimCoupon, convertCoupon };