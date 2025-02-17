const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, isAdmin } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     description: Creates a new user account (non-admin) and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "securePassword123"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                 token:
 *                   type: string
 *                   example: "jwt-token-here"
 *       400:
 *         description: Validation error or user creation failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */

/**
 * @swagger
 * /api/auth/register-admin:
 *   post:
 *     summary: Register a new admin user
 *     tags: [Auth]
 *     description: Creates a new admin user account. Only accessible to admins.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: "securePassword123"
 *               name:
 *                 type: string
 *                 example: "Admin User"
 *     responses:
 *       201:
 *         description: Admin user registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     name:
 *                       type: string
 *                       example: "Admin User"
 *                     email:
 *                       type: string
 *                       example: "admin@example.com"
 *                     role:
 *                       type: string
 *                       example: "ADMIN"
 *       400:
 *         description: Validation error or user creation failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 *       403:
 *         description: Forbidden. Only admins can create admin users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Forbidden"
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     description: Authenticates a user and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "securePassword123"
 *     responses:
 *       200:
 *         description: User authenticated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                 token:
 *                   type: string
 *                   example: "jwt-token-here"
 *       400:
 *         description: Invalid request format.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 *       401:
 *         description: Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid credentials"
 */

// Configurar transporte de Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
  });

// Registra un usuari sense poders d'administrador
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Verificar si el email ya está registrado
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Crear usuario sin verificar
    const user = await User.create({ email, password, name, isVerified: false });

    // Generar un token JWT de verificación con expiración de 1 hora
    const verificationToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Enviar email de verificación
    const verificationLink = `worldgames.es/api/auth/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Verifica tu cuenta',
      html: `<p>Hola ${user.name},</p>
             <p>Por favor, haz clic en el siguiente enlace para verificar tu cuenta:</p>
             <a href="${verificationLink}">${verificationLink}</a>`
    });

    res.status(201).json({ message: 'Registro exitoso. Revisa tu email para verificar la cuenta.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para verificar email con el JWT de verificación
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    // Decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o usuario no encontrado' });
    }

    // Marcar el usuario como verificado
    user.isVerified = true;
    await user.save();

    res.json({ message: 'Email verificado con éxito. Ahora puedes iniciar sesión.' });
  } catch (error) {
    res.status(400).json({ error: 'Token inválido o expirado' });
  }
});


// Nova ruta per crear usuaris admin (només accessible per admins)
router.post('/register-admin', [
  auth,
  isAdmin,
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userData = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: 'ADMIN'
    };

    const user = await User.create(userData);
    res.status(201).json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login per a qualsevol usuari, retorna un token per a realitzar les peticions protegides
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;