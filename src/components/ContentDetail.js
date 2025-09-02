
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Card, CardMedia, CardContent, IconButton, TextField, Button } from '@mui/material';
import { ThumbUp as ThumbUpIcon } from '@mui/icons-material';
import { ethers } from 'ethers';

const API_URL = 'http://localhost:5000';

// Placeholder for PAW Token Contract (replace with actual contract address and ABI)
const PAW_TOKEN_ADDRESS = '0xYourPAWTokenContractAddressHere'; // Replace with actual PAW token contract address
const PAW_TOKEN_ABI = [
  // Only include the transfer function for simplicity
  "function transfer(address to, uint256 amount) returns (bool)"
];

function ContentDetail() {
  const { id } = useParams();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sponsorAmount, setSponsorAmount] = useState('');

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('pawtubu-token');
      const headers = token ? { 'x-auth-token': token } : {};

      const res = await fetch(`${API_URL}/api/content/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setContent(data);
      } else {
        console.error("Failed to fetch content");
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContent();
  }, [id]);

  const handleLike = async () => {
    const token = localStorage.getItem('pawtubu-token');
    if (!token) {
      alert('Please log in to like content.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/content/like/${id}`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token,
        },
      });

      if (res.ok) {
        fetchContent(); // Re-fetch content to get updated like count and isLiked status
      } else {
        alert('Failed to update like status.');
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const handleSponsor = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }
    if (!sponsorAmount || isNaN(sponsorAmount) || parseFloat(sponsorAmount) <= 0) {
      alert('Please enter a valid amount to sponsor.');
      return;
    }
    if (!content.uploader || !content.uploader.walletAddress) {
      alert('Recipient wallet address not found.');
      return;
    }

    const token = localStorage.getItem('pawtubu-token');
    if (!token) {
      alert('Please log in to sponsor content.');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = provider.getSigner();
      const pawTokenContract = new ethers.Contract(PAW_TOKEN_ADDRESS, PAW_TOKEN_ABI, signer);

      // Convert amount to wei (assuming 18 decimals for simplicity, like most ERC-20s)
      const amountInWei = ethers.parseUnits(sponsorAmount, 18);

      // Initiate token transfer
      const tx = await pawTokenContract.transfer(content.uploader.walletAddress, amountInWei);
      alert(`Transaction sent: ${tx.hash}
Waiting for confirmation...`);
      await tx.wait(); // Wait for the transaction to be mined
      alert('Transaction confirmed!');

      // Record donation on backend
      const res = await fetch(`${API_URL}/api/donations/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({
          recipientId: content.uploader._id,
          contentId: content._id,
          amount: parseFloat(sponsorAmount),
          transactionHash: tx.hash,
        }),
      });

      if (res.ok) {
        alert('Donation recorded successfully on platform!');
        setSponsorAmount(''); // Clear input
      } else {
        const errorData = await res.json();
        alert(`Failed to record donation: ${errorData.msg}`);
      }

    } catch (error) {
      console.error("Sponsor error:", error);
      alert(`An error occurred during sponsorship: ${error.message || error}`);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (!content) {
    return <Typography variant="h5" sx={{ mt: 4, textAlign: 'center' }}>Content not found.</Typography>;
  }

  return (
    <Card sx={{ maxWidth: 900, margin: 'auto', mt: 4 }}>
      <CardMedia
        component={content.fileType === 'video' ? 'video' : 'img'}
        style={{ maxHeight: 600, objectFit: 'contain' }}
        image={`${API_URL}/${content.filePath}`}
        title={content.title}
        controls={content.fileType === 'video'}
        autoPlay
      />
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography gutterBottom variant="h4" component="div">
            {content.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleLike} color={content.isLiked ? "primary" : "default"}>
              <ThumbUpIcon />
            </IconButton>
            <Typography variant="h6">{content.likes}</Typography>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary" paragraph>
          {content.description}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Uploaded by: {content.uploader ? content.uploader.walletAddress : 'Unknown'}
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="PAW Amount"
            type="number"
            value={sponsorAmount}
            onChange={(e) => setSponsorAmount(e.target.value)}
            size="small"
            sx={{ width: 150 }}
          />
          <Button variant="contained" color="secondary" onClick={handleSponsor}>
            Sponsor PAW
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

export default ContentDetail;
