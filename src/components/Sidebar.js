
import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Divider } from '@mui/material';
import { MusicNote, VideoLibrary, Image, Upload as UploadIcon, Home as HomeIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const drawerWidth = 240;

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Music', icon: <MusicNote />, path: '/category/audio' }, // fileType for music is 'audio'
  { text: 'Videos', icon: <VideoLibrary />, path: '/category/video' },
  { text: 'Images', icon: <Image />, path: '/category/image' },
];

function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <List>
        <ListItem button component={Link} to="/upload">
          <ListItemIcon>
            <UploadIcon />
          </ListItemIcon>
          <ListItemText primary="Upload" />
        </ListItem>
      </List>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} component={Link} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;
