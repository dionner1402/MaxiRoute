const User = require('../models/User'); // Asumiendo que tienes un modelo User

const createOffer = async (req, res) => {
    const { amount, price } = req.body;
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        if (!user || user.cMxcBalance < amount) {
            return res.status(400).json({ error: 'Saldo C-MXC insuficiente' });
        }

        // Aquí podrías guardar la oferta en una colección "Offers" en MongoDB
        user.cMxcBalance -= amount; // Retener los tokens hasta que se venda
        await user.save();

        res.status(201).json({ message: 'Oferta creada', offer: { amount, price, userId } });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la oferta' });
    }
};

const getOffers = async (req, res) => {
    // Simulación de ofertas (en la práctica, obtén esto de tu DB)
    const offers = [
        { id: 1, amount: 10, price: 5, userId: 'user1' },
        { id: 2, amount: 20, price: 8, userId: 'user2' },
    ];
    res.status(200).json(offers);
};

const buyOffer = async (req, res) => {
    const { offerId } = req.body;
    const buyerId = req.user._id;

    // Lógica simulada (ajusta según tu DB)
    const offer = { id: offerId, amount: 10, price: 5, userId: 'user1' };
    const buyer = await User.findById(buyerId);

    if (!buyer || buyer.cMxcBalance < offer.price) {
        return res.status(400).json({ error: 'Saldo insuficiente para comprar' });
    }

    buyer.cMxcBalance -= offer.price;
    buyer.cMxcBalance += offer.amount; // Transferir los C-MXC comprados
    await buyer.save();

    res.status(200).json({ message: 'Compra realizada' });
};

module.exports = { createOffer, getOffers, buyOffer };