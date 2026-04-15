import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Grid,
  Chip,
  Avatar,
  alpha,
} from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AdjustOutlinedIcon from '@mui/icons-material/AdjustOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import TagBadge from '../components/TagBadge';
import UpcomingTournaments from '../components/UpcomingTournaments';
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

const StatusDot: React.FC<{ active: boolean | null }> = ({ active }) => {
  const color = active === true ? '#4caf50' : active === false ? '#f44336' : '#9e9e9e';
  return <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, display: 'inline-block' }} />;
};

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

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
            <UpcomingTournaments limit={6} showHeader headerKey="home.clubMates" />
          </Box>
        </Grid>

        {/* Right column: Profile → My tournaments → Watched tournaments */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
              background: `linear-gradient(135deg, ${alpha(badgeColor, 0.03)} 0%, ${alpha(highlightColor, 0.06)} 100%)`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: badgeColor,
                boxShadow: `0 4px 16px ${alpha(badgeColor, 0.12)}`,
              },
            }}
            onClick={() => navigate(`/clenove/${user.iDiscGolfId}`)}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              {/* Avatar + Name + Tag */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Avatar
                  src={user.avatarUrl || undefined}
                  alt={user.name}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: badgeColor,
                    fontSize: '1rem',
                    fontWeight: 700,
                    border: '2px solid white',
                    boxShadow: `0 2px 8px ${alpha(badgeColor, 0.25)}`,
                  }}
                >
                  {user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {m?.club.name}
                  </Typography>
                </Box>
                <TagBadge
                  number={m?.tagNumber ?? null}
                  size="medium"
                  badgeColor={badgeColor}
                  highlightColor={highlightColor}
                />
              </Box>

              {/* Ratings + Membership — single compact row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                {user.iDiscGolfRating && (
                  <Chip
                    label={`iDG ${user.iDiscGolfRating}`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#e8f5e9', color: '#2e7d32' }}
                  />
                )}
                {user.pdgaRating && (
                  <Chip
                    label={`PDGA ${user.pdgaRating}`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }}
                  />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                  <StatusDot active={m?.active ?? null} />
                  <StatusDot active={user.cadgMembershipActive} />
                  {user.pdgaNumber && <StatusDot active={user.pdgaMembershipActive} />}
                </Box>
              </Box>
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
