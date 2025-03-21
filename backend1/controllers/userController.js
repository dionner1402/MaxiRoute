const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generar un token JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Iniciar sesión
const loginUser = async (req, res) => {
    const { email, phone, password } = req.body;

    try {
        const normalizedEmail = email ? email.toLowerCase().trim() : undefined;
        console.log('Datos recibidos:', { email: normalizedEmail, phone, password }); // Log de datos recibidos

        const user = await User.findOne({
            $or: [{ email: normalizedEmail }, { phone }],
        });

        if (!user) {
            console.log('Usuario no encontrado con email o teléfono proporcionado');
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        console.log('Usuario encontrado:', { email: user.email, phone: user.phone }); // Log del usuario encontrado
        console.log('Contraseña almacenada:', user.password); // Log de la contraseña encriptada

        const isMatch = await bcrypt.compare(password.trim(), user.password);
        console.log('¿Contraseña coincide?:', isMatch); // Log del resultado de la comparación

        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            miningRate: user.miningRate,
            mxcBalance: user.mxcBalance,
            cMxcBalance: user.cMxcBalance,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ message: 'Error al iniciar sesión' });
    }
};

// Registrar un usuario
const registerUser = async (req, res) => {
    const { name, email, phone, password, referrerId } = req.body;

    try {
        const normalizedEmail = email ? email.toLowerCase().trim() : undefined;

        let queryArray = [];
        if (normalizedEmail) queryArray.push({ email: normalizedEmail });
        if (phone) queryArray.push({ phone: phone });

        if (queryArray.length === 0) {
            return res.status(400).json({ message: 'Se debe proporcionar correo electrónico o teléfono' });
        }

        const userExists = await User.findOne({ $or: queryArray });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const userCount = await User.countDocuments();
        let miningRate;
        if (userCount < 10) {
            miningRate = 0.8;
        } else if (userCount < 100) {
            miningRate = 0.4;
        } else {
            miningRate = 0.2;
        }

        const user = await User.create({
            name,
            email: normalizedEmail,
            phone,
            password: password.trim(), // Asegúrate de eliminar espacios
            miningRate,
            mxcBalance: 0,
            cMxcBalance: 0,
            claimedCoupons: [],
            referrals: [],
        });

        if (referrerId) {
            const referrer = await User.findById(referrerId);
            if (referrer) {
                referrer.referrals.push(user._id);
                await referrer.save();
                user.referrer = referrer._id;
                user.mxcBalance += 0.1 * miningRate; // Bono del 10% en MXC
                await user.save();
            }
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            miningRate: user.miningRate,
            mxcBalance: user.mxcBalance,
            cMxcBalance: user.cMxcBalance,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};

// Obtener perfil de usuario
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select("-password")
            .populate("claimedCoupons", "title description image cMxcValue conversionFee")
            .populate("convertedCoupons", "title description image cMxcValue conversionFee");
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                miningRate: user.miningRate,
                mxcBalance: user.mxcBalance,
                cMxcBalance: user.cMxcBalance,
                claimedCoupons: user.claimedCoupons,
                convertedCoupons: user.convertedCoupons, // Añadir convertedCoupons
                referrals: user.referrals,
                referrer: user.referrer,
            });
        } else {
            res.status(404).json({ message: "Usuario no encontrado" });
        }
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.status(500).json({ message: "Error al obtener el perfil del usuario" });
    }
};

// Recuperar contraseña
const forgotPassword = async (req, res) => {
    const { email, phone } = req.body;

    try {
        if (!email && !phone) {
            return res.status(400).json({ message: 'Debes proporcionar un correo electrónico o un número de teléfono' });
        }

        const normalizedEmail = email ? email.toLowerCase().trim() : undefined;
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
            resetToken,
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
        user.password = await bcrypt.hash(newPassword.trim(), salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: 'Contraseña restablecida con éxito' });
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ message: 'Error al restablecer la contraseña' });
    }
};

const resetCoupons = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.claimedCoupons = [];
        user.convertedCoupons = [];
        await user.save();
        res.status(200).json({ message: 'Cupones reiniciados correctamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al reiniciar cupones', error: error.message });
    }
};

// Exportar todas las funciones (incluyendo resetCoupons)
module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    forgotPassword,
    resetPassword,
    resetCoupons // ✅ Se mantiene para otras pantallas
};