import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import LeagueTiles from '../components/LeagueTiles';

const CompetitionsPage: React.FC = () => {
  const { t } = useTranslation();
  usePageTitle(t('nav.leagues'));

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        {t('competitions.title')}
      </Typography>
      <LeagueTiles />
    </Box>
  );
};

export default CompetitionsPage;
