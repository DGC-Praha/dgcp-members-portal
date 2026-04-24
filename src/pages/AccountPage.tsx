import React from 'react';
import { Box, Typography, Card, CardContent, Button, Divider, Chip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';

const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  usePageTitle(t('pageTitle.account'));

  if (!user) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t('account.title')}</Typography>
      <Card sx={{ maxWidth: 500 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('account.name')}</Typography>
              <Typography>{user.displayName}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">{t('account.email')}</Typography>
              <Typography>{user.email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {user.iDiscGolfId && (
                <Chip
                  label={`DGOLF #${user.iDiscGolfId}`}
                  size="small"
                  component="a"
                  href={`https://www.dgolf.cz/cs/players/${user.iDiscGolfId}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: '#e8f5e9',
                    color: '#2e7d32',
                    '&:hover': { bgcolor: '#c8e6c9' },
                  }}
                />
              )}
              {user.tagovacka?.pdgaNumber && (
                <Chip
                  label={`PDGA #${user.tagovacka.pdgaNumber}`}
                  size="small"
                  component="a"
                  href={`https://www.pdga.com/player/${user.tagovacka.pdgaNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  clickable
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    bgcolor: '#e3f2fd',
                    color: '#1565c0',
                    '&:hover': { bgcolor: '#bbdefb' },
                  }}
                />
              )}
            </Box>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="outlined"
              href={`${import.meta.env.VITE_OAUTH_AUTHORIZE_URL?.replace('/oauth/authorize', '')}/profile`}
              target="_blank"
            >
              {t('account.changePassword')}
            </Button>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={logout}>
              {t('account.logout')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AccountPage;
