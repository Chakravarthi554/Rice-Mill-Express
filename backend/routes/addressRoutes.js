const express = require('express');
const router = express.Router();
const { protect, requireVerifiedEmail } = require('../middleware/auth');
const Address = require('../models/Address');
const User = require('../models/User');

// Get all addresses
router.get('/', protect, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new address
router.post('/', protect, requireVerifiedEmail, async (req, res) => {
  try {
    const newAddress = new Address({
      ...req.body,
      user: req.user._id,
    });
    const savedAddress = await newAddress.save();
    
    // If default, unset others
    if (savedAddress.isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: savedAddress._id } },
        { isDefault: false }
      );
    }
    
    await User.findByIdAndUpdate(req.user._id, { $push: { addresses: savedAddress._id } });
    res.status(201).json(savedAddress);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update address
router.put('/:id', protect, requireVerifiedEmail, async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: 'Address not found' });
    
    Object.assign(address, req.body);
    const updatedAddress = await address.save();
    
    // If set as default, unset others
    if (updatedAddress.isDefault) {
      await Address.updateMany(
        { user: req.user._id, _id: { $ne: updatedAddress._id } },
        { isDefault: false }
      );
    }
    
    res.json(updatedAddress);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete address
router.delete('/:id', protect, requireVerifiedEmail, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: 'Address not found' });
    
    await User.findByIdAndUpdate(req.user._id, { $pull: { addresses: req.params.id } });
    res.json({ message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Set default
router.put('/:id/default', protect, requireVerifiedEmail, async (req, res) => {
  try {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDefault: true },
      { new: true }
    );
    if (!address) return res.status(404).json({ message: 'Address not found' });
    res.json(address);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;