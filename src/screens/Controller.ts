const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generar un token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Registrar un usuario
const registerUser = async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        console.log('Datos recibidos en el backend:', req.body);

        // Verificar que se proporcione al menos email o phone
        if (!email && !phone) {
            return res.status(400).json({ message: 'Debes proporcionar un correo electrónico o un número de teléfono' });
        }

        // Normalizar email a minúsculas si se proporciona
        const normalizedEmail = email ? email.toLowerCase() : undefined;

        // Crear el objeto de búsqueda para verificar existencia
        const searchQuery = [];
        if (normalizedEmail) searchQuery.push({ email: normalizedEmail });
        if (phone) searchQuery.push({ phone });

        // Verificar si el usuario ya existe por email o phone
        const userExists = await User.findOne({ $or: searchQuery });
        if (userExists) {
            const conflictField = userExists.email === normalizedEmail ? 'correo electrónico' : 'número de teléfono';
            return res.status(400).json({ message: `El ${conflictField} ya está registrado` });
        }

        // Crear el usuario con email normalizado
        const user = await User.create({
            name,
            email: normalizedEmail,
            phone: phone || undefined,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ message: 'Datos de usuario inválidos' });
        }
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        if (error.code === 11000) { // Error de duplicado en MongoDB
            const field = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `El ${field === 'email' ? 'correo electrónico' : 'número de teléfono'} ya está registrado` });
        }
        res.status(500).json({ message: 'Error al registrar el usuario', error: error.message });
    }
};

// Iniciar sesión
const loginUser = async (req, res) => {
    const { email, phone, password } = req.body;

    try {
        console.log('Datos de inicio de sesión recibidos:', { email, phone });

        if (!email && !phone) {
            return res.status(400).json({ message: 'Debes proporcionar un correo electrónico o un número de teléfono' });
        }

        // Normalizar email a minúsculas si se proporciona
        const normalizedEmail = email ? email.toLowerCase() : undefined;

        // Crear el objeto de búsqueda usando $or
        const searchQuery = [];
        if (normalizedEmail) searchQuery.push({ email: normalizedEmail });
        if (phone) searchQuery.push({ phone });

        // Buscar usuario por email o phone
        const user = await User.findOne({ $or: searchQuery });
        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            token: generateToken(user.id),
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
};

// Obtener perfil de usuario
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ message: 'Error al obtener el perfil del usuario' });
    }
};

// Recuperar contraseña
const forgotPassword = async (req, res) => {
    const { email, phone } = req.body;

    try {
        if (!email && !phone) {
            return res.status(400).json({ message: 'Debes proporcionar un correo electrónico o un número de teléfono' });
        }

        // Normalizar email a minúsculas si se proporciona
        const normalizedEmail = email ? email.toLowerCase() : undefined;

        const searchQuery = {};
        if (normalizedEmail) searchQuery.email = normalizedEmail;
        if (phone) searchQuery.phone = phone;

        const user = await User.findOne(searchQuery);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = Date.now() + 3600000; // Expira en 1 hora
        await user.save();

        res.status(200).json({
            message: email
                ? 'Código de recuperación enviado al correo'
                : 'Código de recuperación enviado por mensaje de texto',
            resetToken, // Solo para pruebas
        });
    } catch (error) {
        console.error('Error al procesar recuperación de contraseña:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud' });
    }
};

// Restablecer contraseña
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Token inválido o expirado' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: 'Contraseña restablecida con éxito' });
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ message: 'Error al restablecer la contraseña' });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, forgotPassword, resetPassword };