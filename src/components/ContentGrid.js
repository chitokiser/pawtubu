
import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardActionArea, CardMedia, CardContent, Typography, CircularProgress } from '@mui/material';
import { Link, useParams } from 'react-router-dom';

const API_URL = 'http://localhost:5000';

function ContentGrid() {
  const { type, query } = useParams(); // Get type and query from URL params
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const token = localStorage.getItem('pawtubu-token');
        const headers = token ? { 'x-auth-token': token } : {};

        let url = `${API_URL}/api/content`;
        const params = new URLSearchParams();
        if (type) {
          params.append('type', type);
        }
        if (query) {
          params.append('search', query);
        }
        if (params.toString()) {
          url = `${url}?${params.toString()}`;
        }

        const res = await fetch(url, { headers });
        const data = await res.json();
        setContents(data);
      } catch (error) {
        console.error("Failed to fetch contents:", error);
      }
      setLoading(false);
    };

    fetchContents();
  }, [type, query]); // Re-fetch when type or query changes

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {contents.map((content) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={content._id}>
            <Card>
              <CardActionArea component={Link} to={`/content/${content._id}`}>
                <CardMedia
                  component={content.fileType === 'video' ? 'video' : 'img'}
                  style={{ height: 140 }}
                  image={`${API_URL}/${content.filePath}`}
                  title={content.title}
                  controls={content.fileType === 'video'}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {content.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {content.uploader ? `${content.uploader.walletAddress.substring(0, 6)}...${content.uploader.walletAddress.substring(content.uploader.walletAddress.length - 4)}` : 'Unknown Uploader'}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default ContentGrid;
