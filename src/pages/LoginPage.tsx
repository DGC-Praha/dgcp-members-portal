import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Typography, Divider } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import DevBanner from '../components/DevBanner';
import { usePageTitle } from '../hooks/usePageTitle';

const TAGOVACKA_PRIMARY = '#001645';
const TAGOVACKA_ACCENT = '#db2228';

const LoginPage: React.FC = () => {
  const { isAuthenticated, loading, login } = useAuth();
  const { t } = useTranslation();
  usePageTitle(t('pageTitle.login'));

  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#0d47a1',
        background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
      }}
    >
      <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1 }}>
        <DevBanner />
      </Box>
      <Card sx={{ maxWidth: 400, width: '100%', mx: 2, border: '1px solid', borderColor: 'divider', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <CardContent sx={{ textAlign: 'center', py: 5, px: 4 }}>
          <Box
            component="img"
            src="/dgcp-logo-white.png"
            alt="DGCP"
            sx={{ height: 48, mb: 2, filter: 'brightness(0)' }}
          />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            DGCP Members
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {t('login.subtitle')}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={login}
            sx={{
              bgcolor: TAGOVACKA_PRIMARY,
              color: 'white',
              fontWeight: 600,
              py: 1.5,
              textTransform: 'none',
              '&:hover': {
                bgcolor: TAGOVACKA_ACCENT,
              },
            }}
          >
            {t('login.button')}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
