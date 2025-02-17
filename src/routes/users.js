const express = require('express');
const User = require('../models/User');
const { auth } = require("../middleware/auth");
const router = express.Router();

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get user information
 *     tags: [User]
 *     description: Retrieve the details of the currently authenticated user.
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
    await user.destroy();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
