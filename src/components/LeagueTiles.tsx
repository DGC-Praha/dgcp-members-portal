import React from 'react';
import { Box, Typography, Card, CardActionArea, Grid, alpha } from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AdjustOutlinedIcon from '@mui/icons-material/AdjustOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'react-i18next';

const TAGOVACKA_PRIMARY = '#001645';
const TAGOVACKA_ACCENT = '#db2228';
const JAMKOVKA_COLOR = '#2e7d32';
const HDGL_COLOR = '#5c6bc0';

const competitions = [
  {
    titleKey: 'competitions.tagovacka',
    url: 'https://tagovacka.cz/club/dgcp',
    color: TAGOVACKA_PRIMARY,
    accent: TAGOVACKA_ACCENT,
    icon: <LocalOfferOutlinedIcon />,
  },
  {
    titleKey: 'competitions.jamkovka',
    url: 'https://jamkovka.dgcp.cz/',
    color: JAMKOVKA_COLOR,
    accent: JAMKOVKA_COLOR,
    icon: <AdjustOutlinedIcon />,
  },
  {
    titleKey: 'competitions.hdgl',
    url: 'https://hdgl.lazerfunpraha.cz/',
    color: HDGL_COLOR,
    accent: HDGL_COLOR,
    icon: <LeaderboardOutlinedIcon />,
  },
];

const LeagueTiles: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={2}>
      {competitions.map((c) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={c.titleKey}>
          <Card
            sx={{
              height: '100%',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: c.accent,
                boxShadow: `0 4px 20px ${alpha(c.accent, 0.15)}`,
              },
            }}
          >
            <CardActionArea
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ height: '100%', p: 2, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(c.accent, 0.1),
                  color: c.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {c.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: c.color, lineHeight: 1.25 }}>
                  {t(c.titleKey)}
                </Typography>
                <OpenInNewIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default LeagueTiles;
