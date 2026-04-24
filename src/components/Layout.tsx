import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
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
import SportsScoreOutlinedIcon from '@mui/icons-material/SportsScoreOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import DevBanner from './DevBanner';
import LanguageSwitcher from './LanguageSwitcher';

const DRAWER_WIDTH = 240;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t } = useTranslation();

  const menuItems = [
    { text: t('nav.home'), icon: <HomeIcon />, path: '/' },
    { text: t('nav.tournaments'), icon: <EmojiEventsOutlinedIcon />, path: '/turnaje' },
    { text: t('nav.members'), icon: <PeopleIcon />, path: '/members' },
    // Leagues are shown directly on the homepage for desktop users, so the
    // drawer entry only appears on mobile to avoid duplicating the surface.
    ...(isMobile
      ? [{ text: t('nav.leagues'), icon: <SportsScoreOutlinedIcon />, path: '/ligy' }]
      : []),
    { text: t('nav.achievements'), icon: <WorkspacePremiumOutlinedIcon />, path: '/achievements' },
    { text: t('nav.watchedRegistrations'), icon: <NotificationsActiveIcon />, path: '/hlidane-registrace' },
    ...(user?.isAdmin
      ? [{ text: t('nav.admin'), icon: <AdminPanelSettingsIcon />, path: '/admin/members' }]
      : []),
    ...(user?.isSystemAdmin
      ? [{ text: t('nav.system'), icon: <SettingsSuggestIcon />, path: '/system' }]
      : []),
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

  const closeUserMenu = () => setUserMenuAnchor(null);

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
          <Typography
            variant="h6"
            noWrap
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              // At very narrow widths the title competes with the hamburger,
              // language toggle and avatar for space — hide it to prevent
              // squeezing. The logo acts as the brand on md+ and the
              // drawer still shows "DGCP" at the top inside the drawer.
              display: { xs: 'none', sm: 'block' },
            }}
          >
            DGCP Members
          </Typography>
          <Box sx={{ flexGrow: { xs: 1, sm: 0 } }} />
          <LanguageSwitcher dark />
          {user && (
            <>
              <IconButton
                size="small"
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                sx={{ p: 0.5 }}
                aria-label={t('nav.account')}
              >
                <Avatar
                  src={user.tagovacka?.avatarUrl ?? undefined}
                  alt={user.displayName}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: '#1565c0',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: '2px solid rgba(255,255,255,0.35)',
                  }}
                >
                  {getInitials(user.displayName)}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={closeUserMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { minWidth: 220, mt: 0.5 } } }}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }} noWrap>
                    {user.displayName}
                  </Typography>
                  {user.email && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                      {user.email}
                    </Typography>
                  )}
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => {
                    closeUserMenu();
                    navigate('/ucet');
                  }}
                >
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>{t('nav.account')}</ListItemText>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    closeUserMenu();
                    logout();
                  }}
                >
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>{t('account.logout')}</ListItemText>
                </MenuItem>
              </Menu>
            </>
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

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 1.5, sm: 3 } }}>
        <Toolbar />
        <DevBanner />
        <Box sx={{ pt: 2 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
