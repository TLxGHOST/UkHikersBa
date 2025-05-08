const express = require('express');
const Trek = require('../models/Trek'); // Ensure you're importing the Trek model
const router = express.Router();

// POST request to add a new trek
router.post('/', async (req, res) => {
  try {
    const newTrek = new Trek(req.body);
    const savedTrek = await newTrek.save();
    res.status(201).json(savedTrek);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET request to fetch all treks
router.get('/', async (req, res) => {
  try {
    const treks = await Trek.find();
    res.json(treks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
