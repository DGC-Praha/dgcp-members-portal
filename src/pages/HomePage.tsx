import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  Chip,
  Divider,
  alpha,
} from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AdjustOutlinedIcon from '@mui/icons-material/AdjustOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import TagBadge from '../components/TagBadge';
import UpcomingTournaments from '../components/UpcomingTournaments';
import MembershipStatus from '../components/MembershipStatus';
import MyTournaments from '../components/MyTournaments';
import WatchedTournaments from '../components/WatchedTournaments';

const TAGOVACKA_PRIMARY = '#001645';
const TAGOVACKA_ACCENT = '#db2228';
const JAMKOVKA_COLOR = '#2e7d32';
const HDGL_COLOR = '#5c6bc0';

const competitions = [
  {
    titleKey: 'competitions.tagovacka',
    descKey: 'competitions.tagovackaDesc',
    url: 'https://tagovacka.cz/club/dgcp',
    color: TAGOVACKA_PRIMARY,
    accent: TAGOVACKA_ACCENT,
    icon: <LocalOfferOutlinedIcon />,
  },
  {
    titleKey: 'competitions.jamkovka',
    descKey: 'competitions.jamkovkaDesc',
    url: 'https://jamkovka.dgcp.cz/',
    color: JAMKOVKA_COLOR,
    accent: JAMKOVKA_COLOR,
    icon: <AdjustOutlinedIcon />,
  },
  {
    titleKey: 'competitions.hdgl',
    descKey: 'competitions.hdglDesc',
    url: 'https://hdgl.lazerfunpraha.cz/',
    color: HDGL_COLOR,
    accent: HDGL_COLOR,
    icon: <LeaderboardOutlinedIcon />,
  },
];

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  if (!user) return null;

  const m = user.membership;
  const badgeColor = m?.club.tagBadgeColor || '#1565c0';
  const highlightColor = m?.club.tagBadgeHighlightColor || '#0d47a1';

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Left column: Competitions → Club mates */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
            {t('home.competitions')}
          </Typography>
          <Grid container spacing={2}>
            {competitions.map((c) => (
              <Grid size={{ xs: 12, sm: 4 }} key={c.titleKey}>
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
                    sx={{ height: '100%', p: 2.5 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box sx={{ color: c.accent, display: 'flex' }}>
                        {c.icon}
                      </Box>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: c.color, mb: 0.5 }}>
                      {t(c.titleKey)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {t(c.descKey)}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 3 }}>
            <UpcomingTournaments limit={3} showHeader headerKey="home.clubMates" />
          </Box>
        </Grid>

        {/* Right column: Profile → My tournaments → Watched tournaments */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
            {t('home.profile')}
          </Typography>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TagBadge
                  number={m?.tagNumber ?? null}
                  size="large"
                  badgeColor={badgeColor}
                  highlightColor={highlightColor}
                />
                <Box sx={{ ml: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {user.name}
                  </Typography>
                  {m && (
                    <Typography variant="body2" color="text.secondary">
                      {m.club.name}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

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
                {user.pdgaNumber && (
                  <Chip
                    label={`PDGA #${user.pdgaNumber}`}
                    size="small"
                    component="a"
                    href={`https://www.pdga.com/player/${user.pdgaNumber}`}
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

              <Divider sx={{ my: 2 }} />

              <MembershipStatus user={user} />
            </CardContent>
          </Card>

          <Box sx={{ mt: 3 }}>
            <MyTournaments />
          </Box>

          <Box sx={{ mt: 3 }}>
            <WatchedTournaments />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
