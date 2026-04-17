import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';

const DRAWER_WIDTH = 240;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();

  const menuItems = [
    { text: t('nav.home'), icon: <HomeIcon />, path: '/' },
    { text: t('nav.tournaments'), icon: <EmojiEventsOutlinedIcon />, path: '/turnaje' },
    { text: t('nav.members'), icon: <PeopleIcon />, path: '/members' },
    { text: t('nav.watchedRegistrations'), icon: <NotificationsActiveIcon />, path: '/hlidane-registrace' },
    ...(user?.isAdmin
      ? [{ text: t('nav.admin'), icon: <AdminPanelSettingsIcon />, path: '/admin/members' }]
      : []),
    { text: t('nav.account'), icon: <PersonIcon />, path: '/ucet' },
  ];

  const drawer = (
    <Box>
      <Toolbar sx={{ gap: 1.5 }}>
        <Box
          component="img"
          src="/dgcp-logo-white.png"
          alt="DGCP"
          sx={{ height: 32 }}
        />
        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
          DGCP
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: '#0d47a1',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Box
            component="img"
            src="/dgcp-logo-white.png"
            alt="DGCP"
            sx={{ height: 36, mr: 1.5, display: { xs: 'none', md: 'block' } }}
          />
          <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 700 }}>
            DGCP Members
          </Typography>
          {user && (
            <Typography variant="body2" sx={{ opacity: 0.85 }}>{user.name}</Typography>
          )}
        </Toolbar>
      </AppBar>

      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
