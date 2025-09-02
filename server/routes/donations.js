
const express = require('express');
const Donation = require('../models/Donation');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Content = require('../models/Content');

const router = express.Router();

// @route   POST api/donations/record
// @desc    Record a successful donation after blockchain transaction
// @access  Private
router.post('/record', authMiddleware, async (req, res) => {
  const { recipientId, contentId, amount, transactionHash } = req.body;

  try {
    // Verify recipient and content exist
    const recipient = await User.findById(recipientId);
    const content = await Content.findById(contentId);

    if (!recipient || !content) {
      return res.status(404).json({ msg: 'Recipient or content not found' });
    }

    // Create new donation record
    const newDonation = new Donation({
      donor: req.user.id,
      recipient: recipientId,
      content: contentId,
      amount,
      transactionHash
    });

    await newDonation.save();

    // Update donor's EXP
    const donorUser = await User.findById(req.user.id);
    if (donorUser) {
      donorUser.exp += amount;
      await donorUser.save();
    }

    res.json({ msg: 'Donation recorded successfully', donorExp: donorUser ? donorUser.exp : null });

  } catch (err) {
    console.error(err.message);
    // Handle duplicate transaction hash error
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Transaction already recorded' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
