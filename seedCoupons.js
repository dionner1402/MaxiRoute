require('dotenv').config();
const mongoose = require('mongoose');
const Coupon = require('./models/Coupon');
const connectDB = require('./config/db');


const offersData = [
    {
        title: 'Recarga deCombuustibleeee',
        description: '10000 C-MXC válidos por $100 de gasolina',
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        expiry: '2024-09-30',
        quantity: 100,
        terms: '*Válido en estaciones participantes',
        cMxcValue: 1000,
        benefitType: 'recarga_gasolina',
        value: 10.00,
    },
    {
        title: 'Consumo en Restaurant',
        description: '6000 C-MXC válidos por $6 de consumo en restaurantes',
        image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
        expiry: '2024-10-01',
        quantity: 50,
        terms: '*Válido en restaurantes seleccionados',
        cMxcValue: 5000,
        benefitType: 'consumo_restaurante',
        value: 5.00,
    },
    {
        title: 'Lava Auto',
        description: '7000 C-MXC válidos por un lavado de auto de $7',
        image: 'https://images.unsplash.com/photo-1580587771525-78b9f0f89f70?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
        expiry: '2024-10-15',
        quantity: 25,
        terms: '*Presentar identificación',
        cMxcValue: 6000,
        benefitType: 'lavado_auto',
        value: 6.00,
    },
    {
        title: 'Descuento',
        description: '2500 C-MXC válidos por $2,5 de descuento en tiendas',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
        expiry: '2024-10-31',
        quantity: 75,
        terms: '*Válido en tiendas participantes',
        cMxcValue: 2000,
        benefitType: 'descuento_tienda',
        value: 2.00,
    },
    {
        title: 'Servicio de Mant.',
        description: '3000 C-MXC válidos por $3 de servicio de mantenimiento',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
        expiry: '2024-11-15',
        quantity: 40,
        terms: '*Válido en talleres seleccionados',
        cMxcValue: 3000,
        benefitType: 'servicio_mantenimiento',
        value: 3.00,
    },

    {
        title: 'Servicio de Mant.',
        description: '3000 C-MXC válidos por $3 de servicio de mantenimiento',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
        expiry: '2024-11-15',
        quantity: 40,
        terms: '*Válido en talleres seleccionados',
        cMxcValue: 3000,
        benefitType: 'servicio_mantenimiento',
        value: 3.00,
    },

    {
        title: 'Servicio de Mant.',
        description: '3000 C-MXC válidos por $3 de servicio de mantenimiento',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
        expiry: '2024-11-15',
        quantity: 40,
        terms: '*Válido en talleres seleccionados',
        cMxcValue: 3000,
        benefitType: 'servicio_mantenimiento',
        value: 3.00,
    },

    {
        title: 'Servicio de Mant.',
        description: '3000 C-MXC válidos por $3 de servicio de mantenimiento',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80',
        expiry: '2024-11-15',
        quantity: 40,
        terms: '*Válido en talleres seleccionados',
        cMxcValue: 3000,
        benefitType: 'servicio_mantenimiento',
        value: 3.00,
    },
];

const seedCoupons = async () => {
    try {
        await connectDB(); // Conectar a la base de datos
        await Coupon.deleteMany(); // Opcional: borrar cupones existentes
        await Coupon.insertMany(offersData);
        console.log('Cupones insertados correctamente');
        process.exit();
    } catch (error) {
        console.error('Error al insertar cupones:', error);
        process.exit(1);
    }
};

seedCoupons();