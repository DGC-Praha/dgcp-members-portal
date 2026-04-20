import React, { useState } from 'react';
import { Box, IconButton, Typography, Link } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'dgcp:devBannerDismissed';
const WHATSAPP_URL = 'https://wa.me/420777688020';

const DevBanner: React.FC = () => {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === '1',
  );

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  return (
    <Box
      sx={{
        bgcolor: '#fff3e0',
        borderBottom: '1px solid',
        borderColor: '#ffb74d',
        color: '#6d4c00',
        px: { xs: 1.5, sm: 2 },
        py: 0.75,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
      role="status"
    >
      <ConstructionIcon fontSize="small" sx={{ flexShrink: 0 }} />
      <Typography variant="body2" sx={{ flex: 1, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
        {t('devBanner.text')}{' '}
        <Link
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontWeight: 700,
            color: '#25d366',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.25,
            verticalAlign: 'middle',
          }}
        >
          <WhatsAppIcon sx={{ fontSize: '1em' }} />
          {t('devBanner.cta')}
        </Link>
      </Typography>
      <IconButton size="small" onClick={dismiss} aria-label={t('devBanner.dismiss')} sx={{ color: 'inherit' }}>
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default DevBanner;
