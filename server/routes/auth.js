
const express = require('express');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const User = require('../models/User');
const crypto = require('crypto');

const router = express.Router();

// 1. Request a nonce for a given wallet address
router.post('/request-nonce', async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ msg: 'Wallet address is required' });
  }

  try {
    const nonce = crypto.randomBytes(32).toString('hex');
    let user = await User.findOneAndUpdate(
      { walletAddress: walletAddress.toLowerCase() },
      { nonce },
      { upsert: true, new: true }
    );
    res.json({ nonce });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 2. Verify signature and issue JWT
router.post('/verify', async (req, res) => {
  const { walletAddress, signature } = req.body;
  if (!walletAddress || !signature) {
    return res.status(400).json({ msg: 'Wallet address and signature are required' });
  }

  try {
    const user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: 'User not found. Please request a nonce first.' });
    }

    const message = `Signing with a one-time nonce: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() === user.walletAddress) {
      // Signature is valid, issue JWT
      const payload = { user: { id: user.id, walletAddress: user.walletAddress } };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'mysecrettoken', { expiresIn: '1h' });
      
      // Invalidate the nonce
      user.nonce = crypto.randomBytes(32).toString('hex');
      await user.save();

      res.json({ token, exp: user.exp });
    } else {
      res.status(401).json({ msg: 'Signature verification failed' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
