const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', req.body);
    }
    next();
});

// Importar rutas
const userRoutes = require('./routes/userRoutes');
const tripRoutes = require('./routes/tripRoutes');
const mxcRoutes = require('./routes/mxcRoutes');
const cmxcRoutes = require('./routes/cmxcRoutes');
const couponRoutes = require('./routes/couponRoutes');
const viajesRoutes = require('./routes/viajesRoutes');

// Configurar rutas con prefijos adecuados
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/mxc', mxcRoutes);        // Cambiado para que coincida con el frontend
app.use('/api/cmxc', cmxcRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/viajes', viajesRoutes);

app.use((req, res) => {
    console.log('Ruta no encontrada:', req.method, req.url);
    res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
    console.error('Error en el servidor:', err.stack);
    res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});