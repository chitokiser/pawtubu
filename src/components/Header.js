
import React, { useState, useEffect, useCallback } from 'react';
import { AppBar, Toolbar, Typography, InputBase, Button, IconButton, Box } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';

// Simple API functions for interaction with backend
const api = {
  getNonce: (walletAddress) => fetch('http://localhost:5000/api/auth/request-nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  }).then(res => res.json()),

  verifySignature: (walletAddress, signature) => fetch('http://localhost:5000/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, signature }),
  }).then(res => res.json()),
};

function Header() {
  const [userAddress, setUserAddress] = useState(null);
  const [userExp, setUserExp] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing token on component mount
    const token = localStorage.getItem('pawtubu-token');
    if (token) {
      // Decode token to get user info (simple client-side decode for display)
      // In a real app, you'd verify this with the backend
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUserAddress(decoded.user.walletAddress);
        // Fetch user EXP if not included in token (or if token is old)
        // For now, we'll assume EXP is part of the login response
      } catch (e) {
        console.error("Failed to decode token", e);
        localStorage.removeItem('pawtubu-token');
      }
    }
  }, []);

  const handleLogin = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const walletAddress = await signer.getAddress();

      // Get nonce from backend
      const { nonce } = await api.getNonce(walletAddress);
      const message = `Signing with a one-time nonce: ${nonce}`;

      // Sign the message
      const signature = await signer.signMessage(message);

      // Verify signature and get token and exp
      const { token, exp } = await api.verifySignature(walletAddress, signature);

      if (token) {
        localStorage.setItem('pawtubu-token', token);
        setUserAddress(walletAddress);
        setUserExp(exp || 0); // Set user EXP
        alert('Login successful!');
      } else {
        alert('Login failed. Please try again.');
      }

    } catch (error) {
      console.error("Login error:", error);
      alert('An error occurred during login.');
    }
  }, [api, setUserAddress, setUserExp]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      navigate(`/search/${searchTerm.trim()}`);
    } else {
      navigate('/'); // Go to home if search term is empty
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
          Pawtubu
        </Typography>
        <div style={{ position: 'relative', borderRadius: '4px', backgroundColor: 'rgba(255, 255, 255, 0.15)', marginRight: '16px', width: 'auto' }}>
          <div style={{ padding: '0 16px', height: '100%', position: 'absolute', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SearchIcon />
          </div>
          <InputBase
            placeholder="Search…"
            style={{ color: 'inherit', padding: '8px 8px 8px 50px' }}
            inputProps={{ 'aria-label': 'search' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
        <IconButton color="inherit" onClick={handleSearch}>
          <SearchIcon />
        </IconButton>
        {userAddress ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography noWrap>{`${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`}</Typography>
            <Typography variant="body2">(EXP: {userExp})</Typography>
          </Box>
        ) : (
          <Button color="inherit" variant="outlined" onClick={handleLogin}>
            Connect Wallet
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;
