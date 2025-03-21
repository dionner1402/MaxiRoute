const Offer = require('../models/offer');
const User = require('../models/User');

// Crear una nueva oferta
exports.createOffer = async (req, res) => {
    try {
        const { amount, price, paymentMethod, paymentDetails } = req.body;
        const seller = req.user.id;

        // Verificar saldo del vendedor
        const user = await User.findById(seller);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        if (user.cMxcBalance < amount) {
            return res.status(400).json({ message: 'Saldo insuficiente para crear la oferta' });
        }

        // Bloquear el saldo
        user.cMxcBalance -= amount;
        await user.save();

        // Crear la oferta
        const offer = new Offer({
            seller,
            amount,
            price,
            paymentMethod,
            paymentDetails
        });

        await offer.save();

        res.status(201).json({
            message: 'Oferta creada exitosamente',
            offer: {
                id: offer._id,
                amount,
                price,
                paymentMethod
            }
        });
    } catch (error) {
        console.error('Error al crear oferta:', error);
        res.status(500).json({ message: 'Error al crear la oferta' });
    }
};

// Obtener todas las ofertas activas
exports.getOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ status: 'active' })
            .populate('seller', 'username email')
            .sort({ createdAt: -1 });

        res.status(200).json(offers);
    } catch (error) {
        console.error('Error al obtener ofertas:', error);
        res.status(500).json({ message: 'Error al obtener las ofertas' });
    }
};

// Comprar una oferta
exports.buyOffer = async (req, res) => {
    try {
        const { offerId } = req.body;
        const buyerId = req.user.id;

        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ message: 'Oferta no encontrada' });
        }

        if (offer.status !== 'active') {
            return res.status(400).json({ message: 'Esta oferta ya no está disponible' });
        }

        if (offer.seller.toString() === buyerId) {
            return res.status(400).json({ message: 'No puedes comprar tu propia oferta' });
        }

        // Marcar la oferta como completada
        offer.status = 'completed';
        await offer.save();

        // Transferir los tokens al comprador
        const buyer = await User.findById(buyerId);
        if (!buyer) {
            return res.status(404).json({ message: 'Comprador no encontrado' });
        }

        buyer.cMxcBalance += offer.amount;
        await buyer.save();

        res.status(200).json({
            message: 'Compra exitosa',
            transaction: {
                amount: offer.amount,
                price: offer.price,
                paymentMethod: offer.paymentMethod,
                paymentDetails: offer.paymentDetails
            }
        });
    } catch (error) {
        console.error('Error al procesar la compra:', error);
        res.status(500).json({ message: 'Error al procesar la compra' });
    }
};

// Cancelar una oferta
exports.cancelOffer = async (req, res) => {
    try {
        const { offerId } = req.body;
        const userId = req.user.id;

        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ message: 'Oferta no encontrada' });
        }

        if (offer.seller.toString() !== userId) {
            return res.status(403).json({ message: 'No tienes permiso para cancelar esta oferta' });
        }

        if (offer.status !== 'active') {
            return res.status(400).json({ message: 'Esta oferta no puede ser cancelada' });
        }

        // Devolver los tokens al vendedor
        const seller = await User.findById(userId);
        if (!seller) {
            return res.status(404).json({ message: 'Vendedor no encontrado' });
        }

        seller.cMxcBalance += offer.amount;
        offer.status = 'cancelled';

        await Promise.all([
            seller.save(),
            offer.save()
        ]);

        res.status(200).json({
            message: 'Oferta cancelada exitosamente',
            newBalance: seller.cMxcBalance
        });
    } catch (error) {
        console.error('Error al cancelar la oferta:', error);
        res.status(500).json({ message: 'Error al cancelar la oferta' });
    }
};
