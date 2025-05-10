// routes/treks.js
const express = require('express');
const Trek = require('../models/Trek');
const auth = require('../middleware/auth');
const router = express.Router();

// @route   GET api/treks
// @desc    Get all treks
// @access  Public
router.get('/', async (req, res) => {
  try {
    const treks = await Trek.find().sort({ date: -1 });
    res.json(treks);
  } catch (err) {
    console.error('Error fetching treks:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/treks/:id
// @desc    Get trek by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const trek = await Trek.findById(req.params.id);
    
    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }
    
    res.json(trek);
  } catch (err) {
    console.error('Error fetching trek:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Trek not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST api/treks
// @desc    Create a trek
// @access  Private (only for admins - using auth middleware)
router.post('/', auth, async (req, res) => {
  const { title, location, imageUrl, pdfUrl, description, price, difficulty, date } = req.body;

  try {
    const newTrek = new Trek({
      title,
      location,
      imageUrl,
      pdfUrl,
      description,
      price,
      difficulty,
      date
    });

    const trek = await newTrek.save();
    res.status(201).json(trek);
  } catch (err) {
    console.error('Error creating trek:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/treks/:id
// @desc    Update a trek
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let trek = await Trek.findById(req.params.id);

    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    // Update fields
    const updateFields = { ...req.body };
    
    trek = await Trek.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    res.json(trek);
  } catch (err) {
    console.error('Error updating trek:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Trek not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/treks/:id
// @desc    Delete a trek
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const trek = await Trek.findById(req.params.id);

    if (!trek) {
      return res.status(404).json({ message: 'Trek not found' });
    }

    await Trek.findByIdAndRemove(req.params.id);
    res.json({ message: 'Trek removed' });
  } catch (err) {
    console.error('Error deleting trek:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Trek not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;