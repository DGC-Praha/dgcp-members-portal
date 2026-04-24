import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Skeleton,
  alpha,
} from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import TagBadge from '../components/TagBadge';
import UpcomingTournaments from '../components/UpcomingTournaments';
import MyTournaments from '../components/MyTournaments';
import RecentAchievements from '../components/RecentAchievements';

const StatusDot: React.FC<{ active: boolean | null }> = ({ active }) => {
  const color = active === true ? '#4caf50' : active === false ? '#f44336' : '#9e9e9e';
  return <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, display: 'inline-block' }} />;
};

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  usePageTitle(t('pageTitle.home'));

  if (!user) return null;

  const tag = user.tagovacka;
  const tagLoaded = user.tagovackaLoaded;
  const m = tag?.membership ?? null;
  const badgeColor = m?.club.tagBadgeColor || '#1565c0';
  const highlightColor = m?.club.tagBadgeHighlightColor || '#0d47a1';
  const displayName = user.displayName;
  const avatarInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Box>
      {/* Profile card — full width on top */}
      <Box sx={{ mb: 3 }}>
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
            onClick={
              user.iDiscGolfId != null
                ? () => navigate(`/clenove/${user.iDiscGolfId}`)
                : undefined
            }
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              {/* Avatar + Name + Tag */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Avatar
                  src={tag?.avatarUrl || undefined}
                  alt={displayName}
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
                  {avatarInitials}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      lineHeight: 1.2,
                      // On very narrow widths let long names wrap to 2 lines
                      // (still clipped after 2) rather than being cut off
                      // behind the fixed-width tag badge on the right.
                      display: { xs: '-webkit-box', sm: 'block' },
                      WebkitLineClamp: { xs: 2, sm: 'unset' },
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      whiteSpace: { xs: 'normal', sm: 'nowrap' },
                      textOverflow: { xs: 'clip', sm: 'ellipsis' },
                    }}
                  >
                    {displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {tagLoaded ? (
                      m?.club.name ?? ''
                    ) : (
                      <Skeleton variant="text" width={80} sx={{ display: 'inline-block' }} />
                    )}
                  </Typography>
                </Box>
                {tagLoaded ? (
                  <TagBadge
                    number={m?.tagNumber ?? null}
                    size="medium"
                    badgeColor={badgeColor}
                    highlightColor={highlightColor}
                  />
                ) : (
                  <Skeleton variant="rounded" width={36} height={36} />
                )}
              </Box>

              {/* Ratings + Membership — single compact row */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                {!tagLoaded && (
                  <>
                    <Skeleton variant="rounded" width={60} height={22} />
                    <Skeleton variant="rounded" width={70} height={22} />
                  </>
                )}
                {tagLoaded && tag?.iDiscGolfRating && (
                  <Chip
                    label={`iDG ${tag.iDiscGolfRating}`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#e8f5e9', color: '#2e7d32' }}
                  />
                )}
                {tagLoaded && tag?.pdgaRating && (
                  <Chip
                    label={`PDGA ${tag.pdgaRating}`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }}
                  />
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <StatusDot active={user.activeMember} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>DGCP</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    <StatusDot active={tagLoaded ? tag?.cadgMembershipActive ?? null : null} />
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>ČADG</Typography>
                  </Box>
                  {(!tagLoaded || (tag?.pdgaNumber ?? null) !== null) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      <StatusDot active={tagLoaded ? tag?.pdgaMembershipActive ?? null : null} />
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>PDGA</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
      </Box>

      {/* Bottom: two columns — club mates left, my stuff right */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <UpcomingTournaments limit={6} showHeader headerKey="home.clubMates" />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MyTournaments />

          <Box sx={{ mt: 3 }}>
            <RecentAchievements />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HomePage;
