import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';

const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setTokenFromCallback } = useAuth();
  const { t } = useTranslation();
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    const exchangeCode = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const savedState = sessionStorage.getItem('oauth_state');

      if (!code) {
        setError(t('callback.noCode'));
        return;
      }

      if (state !== savedState) {
        setError(t('callback.stateMismatch'));
        return;
      }

      sessionStorage.removeItem('oauth_state');

      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const res = await axios.post(`${apiUrl}/oauth/token`, {
          grant_type: 'authorization_code',
          code,
          client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
          client_secret: import.meta.env.VITE_OAUTH_CLIENT_SECRET,
          redirect_uri: `${window.location.origin}/oauth/callback`,
        });

        if (res.data.refresh_token) {
          localStorage.setItem('oauth_refresh_token', res.data.refresh_token);
        }
        await setTokenFromCallback(res.data.access_token);
        navigate('/', { replace: true });
      } catch {
        setError(t('callback.exchangeFailed'));
      }
    };

    exchangeCode();
  }, [searchParams, navigate, setTokenFromCallback, t]);

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          {t('callback.backToLogin')}
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  );
};

export default OAuthCallbackPage;
