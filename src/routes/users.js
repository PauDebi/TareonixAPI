const express = require('express');
const User = require('../models/User');
const ProjectUser = require('../models/ProjectUser');
const Project = require('../models/Project');
const { auth } = require("../middleware/auth");
const router = express.Router();
const fs = require('fs');
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // Carpeta donde se almacenarán las imágenes
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + path.extname(file.originalname);  // Crear nombre único
    cb(null, fileName);
  }
});

const upload = multer({ storage });

// Ruta para obtener la información del usuario (sin cambios)
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get user information
 *     tags: [User]
 *     description: Retrieve the details of the currently authenticated user with bearer token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information successfully retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "John Doe"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *       400:
 *         description: Error retrieving user information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */

router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/user:
 *   put:
 *     summary: Update user information
 *     tags: [User]
 *     description: Allows the user to update their own details such as name and password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Name"
 *               password:
 *                 type: string
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: User information successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Updated Name"
 *                 email:
 *                   type: string
 *                   example: "user@example.com"
 *       400:
 *         description: Error updating user information.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 *       405:
 *         description: Error, cannot change email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Can not change email"
 */

router.put('/', auth, async (req, res) => {
  try {
    const user = req.user;

    // Si se intenta actualizar la contraseña, hay que cifrarla antes
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    if (req.body.email) {
      return res.status(405).json({ error: 'Can not change email' });
    }

    await user.update(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Delete the current user
 *     tags: [User]
 *     description: Allows the user to delete their account.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *       400:
 *         description: Error deleting the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */


router.delete('/', auth, async (req, res) => {
  try {
    const user = req.user;

    // Verificar si el usuario es líder de algún proyecto y actualizar el lider_id a null
    const isLeader = await Project.findOne({ where: { lider_id: user.id } });
    if (isLeader) {
      await isLeader.update({ lider_id: null });
    }

    // Eliminar relaciones en project_users
    await ProjectUser.destroy({ where: { user_id: user.id } });

    // Eliminar la imagen de perfil si existe
    if (user.profile_image) {
      const imagePath = path.join(__dirname, '..', user.profile_image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error('Error deleting profile image:', err);
        }
      });
    }

    // Eliminar usuario
    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ruta para actualizar la imagen de perfil
/**
 * @swagger
 * /api/user/profile-image:
 *   put:
 *     summary: Update user profile image
 *     tags: [User]
 *     description: Allows the user to update their profile image.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile image updated successfully"
 *       400:
 *         description: Error updating the profile image.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
router.put('/profile-image', auth, upload.single('image'), async (req, res) => {
  try {
    const user = req.user;
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Si el usuario ya tiene una imagen de perfil, eliminar la anterior
    if (user.profile_image) {
      const oldImagePath = path.join(__dirname, '..', user.profile_image);  // Ruta completa del archivo antiguo
      // Verificar si el archivo existe y eliminarlo
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error('Error deleting old profile image:', err);
        }
      });
    }

    // Guardar la ruta de la imagen en la base de datos
    const imagePath = "http://worldgames.es/" +req.file.path; // Ruta completa de la imagen en el servidor

    // Actualizar la imagen de perfil del usuario
    await user.update({ profile_image: imagePath });
    res.json({ message: 'Profile image updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
