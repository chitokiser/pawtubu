import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme'; // Import your custom theme

import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ContentGrid from './components/ContentGrid';
import Upload from './components/Upload';
import ContentDetail from './components/ContentDetail';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex' }}>
          <Header />
          <Sidebar />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Toolbar />
            <Routes>
              <Route path="/" element={<ContentGrid />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/content/:id" element={<ContentDetail />} />
              <Route path="/category/:type" element={<ContentGrid />} />
              <Route path="/search/:query" element={<ContentGrid />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
