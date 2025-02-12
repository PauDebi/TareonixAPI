const express = require('express');
const User = require('../models/User');
const {auth} = require("../middleware/auth");
const router = express.Router();

router.get('/', auth,async (req, res) => {
  try {
    const user = req.user;
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;