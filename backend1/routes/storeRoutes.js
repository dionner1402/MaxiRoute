const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Product = require('../models/product');
const User = require('../models/User');

// GET /api/store/products - Obtener lista de productos
router.get('/products', authMiddleware, async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.status(200).json(products);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error al obtener productos' });
    }
});

// GET /api/store/products/:id - Obtener un producto específico
router.get('/products/:id', authMiddleware, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ message: 'Error al obtener producto' });
    }
});

// POST /api/store/purchase - Realizar una compra
router.post('/purchase', authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id;

        // Obtener el producto y el usuario
        const [product, user] = await Promise.all([
            Product.findById(productId),
            User.findById(userId)
        ]);

        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar stock
        if (product.stock < 1) {
            return res.status(400).json({ message: 'Producto sin stock disponible' });
        }

        // Verificar saldo
        if (user.cMxcBalance < product.price) {
            return res.status(400).json({ message: 'Saldo insuficiente' });
        }

        // Actualizar stock y saldo
        product.stock -= 1;
        user.cMxcBalance -= product.price;

        await Promise.all([
            product.save(),
            user.save()
        ]);

        res.status(200).json({
            message: 'Compra exitosa',
            product: {
                name: product.name,
                price: product.price
            },
            newBalance: user.cMxcBalance
        });
    } catch (error) {
        console.error('Error al procesar la compra:', error);
        res.status(500).json({ message: 'Error al procesar la compra' });
    }
});

// Solo para administradores
router.post('/products', authMiddleware, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ message: 'Error al crear producto' });
    }
});

module.exports = router;