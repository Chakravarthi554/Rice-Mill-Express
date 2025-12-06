const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/cart
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'cartItems.product',
        select: 'name price images stock'   // <-- everything Checkout needs
      });
    res.json(user.cartItems || []);
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// POST /api/cart  (add / update)
router.post('/', protect, async (req, res) => {
  try {
    const { product: productId, qty, location } = req.body;
    if (!productId) return res.status(400).json({ message: 'Product ID required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ---- location handling (unchanged) ----
    if (location != null) {
      let raw = location;
      if (typeof raw === 'string') {
        try { raw = JSON.parse(raw); } catch (e) { raw = null; }
      }
      if (Array.isArray(raw) && raw.length) raw = raw[0];
      if (
        raw &&
        raw.type === 'Point' &&
        Array.isArray(raw.coordinates) &&
        raw.coordinates.length === 2 &&
        typeof raw.coordinates[0] === 'number' &&
        typeof raw.coordinates[1] === 'number'
      ) {
        user.location = raw;
      }
    }

    // ---- cart logic ----
    const idx = user.cartItems.findIndex(
      i => i.product.toString() === productId
    );

    if (idx > -1) {
      if (qty > 0) user.cartItems[idx].quantity = qty;
      else user.cartItems.splice(idx, 1);
    } else if (qty > 0) {
      user.cartItems.push({ product: productId, quantity: qty || 1 });
    }

    const saved = await user.save();
    await saved.populate({
      path: 'cartItems.product',
      select: 'name price images stock'
    });
    res.json(saved.cartItems);
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(400).json({ message: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:productId
router.delete('/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.cartItems = user.cartItems.filter(
      i => i.product.toString() !== req.params.productId
    );

    const saved = await user.save();
    await saved.populate({
      path: 'cartItems.product',
      select: 'name price images stock'
    });
    res.json(saved.cartItems);
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.status(500).json({ message: 'Failed to remove item' });
  }
});

// DELETE /api/cart  (clear)
router.delete('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.cartItems = [];
    const saved = await user.save();
    res.json(saved.cartItems);
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ message: 'Failed to clear cart' });
  }
});

module.exports = router;