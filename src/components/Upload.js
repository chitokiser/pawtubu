
import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Container } from '@mui/material';

function Upload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);

    const token = localStorage.getItem('pawtubu-token');

    try {
      const res = await fetch('http://localhost:5000/api/content/upload', {
        method: 'POST',
        headers: {
          'x-auth-token': token,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        alert('Upload successful!');
        console.log('Uploaded content:', data);
      } else {
        const errorData = await res.json();
        alert(`Upload failed: ${errorData.msg}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('An error occurred during upload.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Upload Content
        </Typography>
        <TextField
          label="Title"
          fullWidth
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          component="label"
          fullWidth
          sx={{ mb: 2 }}
        >
          Choose File
          <input type="file" hidden onChange={handleFileChange} />
        </Button>
        {file && <Typography sx={{ mb: 2 }}>Selected file: {file.name}</Typography>}
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Upload
        </Button>
      </Box>
    </Container>
  );
}

export default Upload;
