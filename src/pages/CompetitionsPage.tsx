import React from 'react';
import { Box, Typography, Card, CardContent, CardActions, Button, Grid } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';

const competitions = [
  {
    titleKey: 'competitions.tagovacka',
    descKey: 'competitions.tagovackaDesc',
    url: 'https://tagovacka.cz/club/dgcp',
  },
  {
    titleKey: 'competitions.jamkovka',
    descKey: 'competitions.jamkovkaDesc',
    url: 'https://jamkovka.dgcp.cz/',
  },
  {
    titleKey: 'competitions.hdgl',
    descKey: 'competitions.hdglDesc',
    url: 'https://hdgl.lazerfunpraha.cz/',
  },
];

const CompetitionsPage: React.FC = () => {
  const { t } = useTranslation();
  usePageTitle(t('nav.leagues'));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{t('competitions.title')}</Typography>
      <Grid container spacing={3}>
        {competitions.map((c) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.titleKey}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>{t(c.titleKey)}</Typography>
                <Typography variant="body2" color="text.secondary">{t(c.descKey)}</Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  endIcon={<OpenInNewIcon />}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('competitions.go')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default CompetitionsPage;
