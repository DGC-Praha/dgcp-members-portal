import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
  Grid,
  Skeleton,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  alpha,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import GroupIcon from '@mui/icons-material/Group';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import TagBadge from '../components/TagBadge';
import Achievements from '../components/Achievements';
import RatingChart from '../components/RatingChart';
import { formatDateRange } from '../components/UpcomingTournaments';

const ACCENT = '#e65100';

interface MemberDetail {
  player: {
    name: string;
    avatarUrl: string | null;
    iDiscGolfId: number;
    pdgaNumber: number | null;
    iDiscGolfRating: number | null;
    pdgaRating: number | null;
    cadgMembershipActive: boolean | null;
    pdgaMembershipActive: boolean | null;
  };
  membership: {
    tagNumber: number | null;
    role: string;
    active: boolean;
    joinedAt: string;
  };
  tagStats: {
    currentTag: number | null;
    bestTag: number | null;
    totalExchanges: number;
    wins: number;
    losses: number;
    longestHoldDays: number;
  };
  tagHistory: Array<{
    date: string;
    type: string;
    note: string | null;
    oldTagNumber: number;
    newTagNumber: number;
    finishPosition: number;
  }>;
  upcomingTournaments: Array<{
    name: string;
    dateStart: string | null;
    dateEnd: string;
    division: string;
    cadgTier: string | null;
    region: string | null;
    iDiscGolfTournamentId: number;
  }>;
  pastTournaments: Array<{
    name: string;
    dateEnd: string;
    division: string;
    totalScore: number | null;
    finishPosition: number | null;
    cadgTier: string | null;
    iDiscGolfTournamentId: number;
  }>;
  sharedTournaments: Array<{
    name: string;
    dateStart: string | null;
    dateEnd: string;
    iDiscGolfTournamentId: number;
  }>;
  ratingHistory: Array<{
    type: string;
    rating: number;
    date: string;
  }>;
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const StatusDot: React.FC<{ active: boolean | null; label: string }> = ({ active, label }) => {
  const color = active === true ? '#4caf50' : active === false ? '#f44336' : '#9e9e9e';
  const text = active === true ? 'Aktivní' : active === false ? 'Neaktivní' : 'Nezjištěno';
  return (
    <Tooltip title={text} arrow>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
};

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t: tr } = useTranslation();

  const m = user?.tagovacka?.membership;
  const badgeColor = m?.club.tagBadgeColor || '#1565c0';
  const highlightColor = m?.club.tagBadgeHighlightColor || '#0d47a1';

  useEffect(() => {
    if (!id) return;
    api.getMemberDetail(parseInt(id, 10))
      .then((res) => setData(res.data))
      .catch(() => navigate('/members', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={200} />
      </Box>
    );
  }

  if (!data) return null;

  const { player, membership, tagHistory, upcomingTournaments, pastTournaments, sharedTournaments, ratingHistory } = data;

  const sharedIds = new Set(sharedTournaments.map((t) => t.iDiscGolfTournamentId));

  return (
    <Box>
      {/* Back button */}
      <IconButton onClick={() => navigate('/members')} sx={{ mb: 1, ml: -1 }}>
        <ArrowBackIcon />
      </IconButton>

      {/* Hero card */}
      <Card
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          mb: 3,
          overflow: 'visible',
          background: `linear-gradient(135deg, ${alpha(badgeColor, 0.03)} 0%, ${alpha(highlightColor, 0.06)} 100%)`,
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            {/* Left: player info (60%) */}
            <Grid size={{ xs: 12, md: ratingHistory && ratingHistory.length >= 2 ? 7 : 12 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                    <Avatar
                      src={player.avatarUrl || undefined}
                      alt={player.name}
                      sx={{
                        width: 96,
                        height: 96,
                        bgcolor: badgeColor,
                        fontSize: '2rem',
                        fontWeight: 700,
                        border: '3px solid white',
                        boxShadow: `0 4px 20px ${alpha(badgeColor, 0.3)}`,
                      }}
                    >
                      {getInitials(player.name)}
                    </Avatar>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 'grow' }}>
                  <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800 }}>
                        {player.name}
                      </Typography>
                      {membership.role === 'admin' && (
                        <Chip label="Admin" size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#fff3e0', color: '#e65100' }} />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
                      <TagBadge number={membership.tagNumber} size="small" badgeColor={badgeColor} highlightColor={highlightColor} />
                      <Chip
                        label={`DGOLF #${player.iDiscGolfId}`}
                        size="small"
                        component="a"
                        href={`https://www.dgolf.cz/cs/players/${player.iDiscGolfId}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        clickable
                        sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: '#e8f5e9', color: '#2e7d32', '&:hover': { bgcolor: '#c8e6c9' } }}
                      />
                      {player.pdgaNumber && (
                        <Chip
                          label={`PDGA #${player.pdgaNumber}`}
                          size="small"
                          component="a"
                          href={`https://www.pdga.com/player/${player.pdgaNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          clickable
                          sx={{ fontWeight: 600, fontSize: '0.75rem', bgcolor: '#e3f2fd', color: '#1565c0', '&:hover': { bgcolor: '#bbdefb' } }}
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
                      {player.iDiscGolfRating && (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          <Typography component="span" color="text.secondary" sx={{ fontSize: '0.75rem' }}>iDG </Typography>
                          {player.iDiscGolfRating}
                        </Typography>
                      )}
                      {player.pdgaRating && (
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          <Typography component="span" color="text.secondary" sx={{ fontSize: '0.75rem' }}>PDGA </Typography>
                          {player.pdgaRating}
                        </Typography>
                      )}
                      <Divider orientation="vertical" flexItem />
                      <StatusDot active={membership.active} label="DGCP" />
                      <StatusDot active={player.cadgMembershipActive} label="ČADG" />
                      {player.pdgaNumber && <StatusDot active={player.pdgaMembershipActive} label="PDGA" />}
                      <Divider orientation="vertical" flexItem />
                      <Typography variant="caption" color="text.secondary">
                        {tr('playerCard.memberSince')} {new Date(membership.joinedAt).toLocaleDateString('cs-CZ')}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>

            {/* Right: rating chart (40%) */}
            {ratingHistory && ratingHistory.length >= 2 && (
              <Grid size={{ xs: 12, md: 5 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: '100%' }}>
                  <RatingChart ratingHistory={ratingHistory} height={140} />
                </Box>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Upcoming tournaments */}
          {upcomingTournaments.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ letterSpacing: 1.5, color: 'text.secondary', display: 'block', mb: 1.5 }}>
                {tr('playerCard.upcoming')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {upcomingTournaments.map((t) => {
                  const isShared = sharedIds.has(t.iDiscGolfTournamentId);
                  return (
                  <Card
                    key={t.iDiscGolfTournamentId}
                    component="a"
                    href={`https://idiscgolf.cz/turnaje/${t.iDiscGolfTournamentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      textDecoration: 'none',
                      color: 'inherit',
                      border: '1px solid',
                      borderColor: isShared ? '#1565c0' : 'divider',
                      boxShadow: 'none',
                      transition: 'all 0.2s ease',
                      ...(isShared && { bgcolor: alpha('#1565c0', 0.03) }),
                      '&:hover': { borderColor: ACCENT, boxShadow: `0 2px 12px ${alpha(ACCENT, 0.1)}` },
                    }}
                  >
                    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmojiEventsOutlinedIcon sx={{ color: ACCENT, fontSize: 18 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.name}</Typography>
                          {isShared && (
                            <Tooltip title={tr('playerCard.sharedTournaments')} arrow>
                              <GroupIcon sx={{ fontSize: 16, color: '#1565c0' }} />
                            </Tooltip>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                          <Chip label={t.division} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                          {t.cadgTier && (
                            <Chip label={t.cadgTier} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#fff3e0', color: '#e65100' }} />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {formatDateRange(t.dateStart, t.dateEnd)}
                          </Typography>
                          <OpenInNewIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Past tournaments */}
          {pastTournaments.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="overline" sx={{ letterSpacing: 1.5, color: 'text.secondary', display: 'block', mb: 1.5 }}>
                {tr('playerCard.pastTournaments')}
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ '& td, & th': { py: 0.75, fontSize: '0.8rem' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>{tr('tournaments.name')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tr('tournaments.date')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{tr('tournaments.division')}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>#</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{tr('playerCard.score')}</TableCell>
                      <TableCell sx={{ width: 36 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pastTournaments.map((t) => {
                      const isShared = sharedIds.has(t.iDiscGolfTournamentId);
                      return (
                      <TableRow key={t.iDiscGolfTournamentId} hover sx={isShared ? { bgcolor: alpha('#1565c0', 0.03) } : undefined}>
                        <TableCell sx={{ fontWeight: 600, maxWidth: 240 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }} noWrap>
                              {t.name}
                            </Typography>
                            {isShared && (
                              <Tooltip title={tr('playerCard.sharedTournaments')} arrow>
                                <GroupIcon sx={{ fontSize: 14, color: '#1565c0', flexShrink: 0 }} />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {new Date(t.dateEnd).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <Chip label={t.division} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: t.finishPosition && t.finishPosition <= 3 ? ACCENT : 'text.primary' }}>
                          {t.finishPosition ?? '–'}
                        </TableCell>
                        <TableCell align="center" sx={{ color: 'text.secondary' }}>
                          {t.totalScore && t.totalScore > 0 ? t.totalScore : '–'}
                        </TableCell>
                        <TableCell sx={{ px: 0 }}>
                          <Tooltip title="iDiscGolf" arrow>
                            <IconButton
                              size="small"
                              component="a"
                              href={`https://idiscgolf.cz/turnaje/${t.iDiscGolfTournamentId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ color: '#2e7d32' }}
                            >
                              <OpenInNewIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Grid>

        {/* Right column */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Achievements */}
          <Box sx={{ mb: 3 }}>
            <Achievements iDiscGolfId={player.iDiscGolfId} title={tr('playerCard.achievements')} />
          </Box>

          {/* Tag history */}
          {tagHistory.length > 0 && (
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: 1.5, color: 'text.secondary', display: 'block', mb: 1.5 }}>
                {tr('playerCard.tagHistory')}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {tagHistory.slice(0, 20).map((h, i) => {
                  const improved = h.newTagNumber < h.oldTagNumber;
                  const worsened = h.newTagNumber > h.oldTagNumber;
                  return (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: improved ? alpha('#4caf50', 0.04) : worsened ? alpha('#f44336', 0.04) : 'transparent',
                      }}
                    >
                      {improved ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                      ) : worsened ? (
                        <TrendingDownIcon sx={{ fontSize: 16, color: '#f44336' }} />
                      ) : (
                        <SwapVertIcon sx={{ fontSize: 16, color: '#9e9e9e' }} />
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                          #{h.oldTagNumber} → #{h.newTagNumber}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(h.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MemberDetailPage;
