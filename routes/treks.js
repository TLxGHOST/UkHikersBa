// routes/treks.js
const express = require('express');
const Trek = require('../models/Trek');
const router = express.Router();

// GET request to fetch all treks
router.get('/', async (req, res) => {
  try {
    const treks = await Trek.find();
    // Ensure we always return an array, even if empty
    res.json(Array.isArray(treks) ? treks : []);
  } catch (err) {
    console.error('Error fetching treks:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET request to fetch a specific trek by ID
router.get('/:id', async (req, res) => {
  try {
    const trek = await Trek.findById(req.params.id);
    if (!trek) {
      return res.status(404).json({ success: false, message: 'Trek not found' });
    }
    res.json(trek);
  } catch (err) {
    console.error('Error fetching trek by ID:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST request to add a new trek
router.post('/', async (req, res) => {
  try {
    const newTrek = new Trek(req.body);
    const savedTrek = await newTrek.save();
    res.status(201).json({ success: true, data: savedTrek });
  } catch (err) {
    console.error('Error creating new trek:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT request to update a trek
router.put('/:id', async (req, res) => {
  try {
    const updatedTrek = await Trek.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedTrek) {
      return res.status(404).json({ success: false, message: 'Trek not found' });
    }
    
    res.json({ success: true, data: updatedTrek });
  } catch (err) {
    console.error('Error updating trek:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE request to remove a trek
router.delete('/:id', async (req, res) => {
  try {
    const deletedTrek = await Trek.findByIdAndDelete(req.params.id);
    
    if (!deletedTrek) {
      return res.status(404).json({ success: false, message: 'Trek not found' });
    }
    
    res.json({ success: true, data: {} });
  } catch (err) {
    console.error('Error deleting trek:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;