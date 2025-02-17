const express = require('express');
const User = require('../models/User');
const {auth} = require("../middleware/auth");
const router = express.Router();

router.get('/',auth,async (req, res) => {
  try {
    const user = req.user;
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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