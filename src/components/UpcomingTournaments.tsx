import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Typography,
  Avatar,
  AvatarGroup,
  Chip,
  Collapse,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  alpha,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import TagBadge from './TagBadge';
import RegistrationWatchdog from './RegistrationWatchdog';
import { dateLocale } from '../i18n/format';

export interface TournamentMember {
  name: string;
  avatarUrl: string | null;
  division: string;
  tagNumber: number | null;
  iDiscGolfRating: number | null;
  pdgaRating: number | null;
}

export interface RegistrationPhase {
  phaseNumber: number;
  startsAt: string;
  endsAt: string;
  restrictions: string | null;
}

export interface Tournament {
  id: number;
  name: string;
  dateStart: string | null;
  dateEnd: string;
  cadgTier: string | null;
  pdgaTier: string | null;
  region: string | null;
  playerLimit: number | null;
  totalPlayers: number;
  iDiscGolfTournamentId: number;
  pdgaTournamentId: number | null;
  propositionsSyncedAt: string | null;
  registrationPhases?: RegistrationPhase[];
  members: TournamentMember[];
}

const ACCENT = '#e65100';

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function formatDateRange(start: string | null, end: string): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'numeric' });
  };
  if (!start || start === end) return fmt(end);
  return `${fmt(start)}–${fmt(end)}`;
}

export const TournamentCard: React.FC<{
  tournament: Tournament;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ tournament, isExpanded, onToggle }) => {
  const { t: tr } = useTranslation();

  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: isExpanded ? ACCENT : 'divider',
        boxShadow: isExpanded ? `0 4px 20px ${alpha(ACCENT, 0.12)}` : 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: ACCENT,
          boxShadow: `0 4px 20px ${alpha(ACCENT, 0.12)}`,
        },
      }}
    >
      <CardActionArea onClick={onToggle} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <EmojiEventsOutlinedIcon sx={{ color: ACCENT, fontSize: 20, flexShrink: 0 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
              {tournament.name}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, ml: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
              {formatDateRange(tournament.dateStart, tournament.dateEnd)}
            </Typography>
            {tournament.registrationPhases && tournament.registrationPhases.length > 0 && (
              <Box onClick={(e) => e.stopPropagation()}>
                <RegistrationWatchdog
                  tournamentIdgId={tournament.iDiscGolfTournamentId}
                  registrationPhases={tournament.registrationPhases}
                />
              </Box>
            )}
            <ExpandMoreIcon
              sx={{
                fontSize: 18,
                color: 'text.secondary',
                transition: 'transform 0.2s',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1, flexWrap: 'wrap' }}>
          {tournament.cadgTier && (
            <Chip
              label={tournament.cadgTier}
              size="small"
              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#fff3e0', color: '#e65100' }}
            />
          )}
          {tournament.region && (
            <Typography variant="caption" color="text.secondary">
              {tournament.region}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AvatarGroup
            max={6}
            sx={{
              '& .MuiAvatar-root': {
                width: 28,
                height: 28,
                fontSize: '0.7rem',
                fontWeight: 600,
                borderWidth: 1.5,
              },
            }}
          >
            {tournament.members.map((m, i) => (
              <Tooltip key={i} title={`${m.name} (${m.division})`} arrow>
                <Avatar src={m.avatarUrl || undefined} alt={m.name} sx={{ bgcolor: '#0d47a1' }}>
                  {getInitials(m.name)}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
          <Typography variant="caption" color="text.secondary">
            {tournament.members.length === 1
              ? `1 ${tr('tournaments.member')}`
              : `${tournament.members.length} ${tr('tournaments.members')}`}
          </Typography>
        </Box>
      </CardActionArea>

      <Collapse in={isExpanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 0, py: 0.5, width: 40 }} />
                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.75rem' }}>{tr('tournaments.name')}</TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.75rem' }}>{tr('tournaments.division')}</TableCell>
                <TableCell sx={{ py: 0.5, fontWeight: 600, fontSize: '0.75rem' }}>{tr('tournaments.rating')}</TableCell>
                <TableCell align="center" sx={{ py: 0.5, pr: 0, fontWeight: 600, fontSize: '0.75rem' }}>{tr('tournaments.tag')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tournament.members.map((m, i) => (
                <TableRow key={i} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ pl: 0, py: 0.75, width: 40 }}>
                    <Avatar src={m.avatarUrl || undefined} alt={m.name} sx={{ width: 32, height: 32, bgcolor: '#0d47a1', fontSize: '0.75rem' }}>
                      {getInitials(m.name)}
                    </Avatar>
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {m.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Chip label={m.division} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {m.iDiscGolfRating && (
                        <Chip
                          label={m.iDiscGolfRating}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            bgcolor: '#e8f5e9',
                            color: '#2e7d32',
                          }}
                        />
                      )}
                      {m.pdgaRating && (
                        <Chip
                          label={m.pdgaRating}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            bgcolor: '#e3f2fd',
                            color: '#1565c0',
                          }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 0.75, pr: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <TagBadge number={m.tagNumber} size="tiny" />
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Typography
              component="a"
              href={`https://idiscgolf.cz/turnaje/${tournament.iDiscGolfTournamentId}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="caption"
              sx={{ color: '#2e7d32', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}
            >
              iDiscGolf <OpenInNewIcon sx={{ fontSize: 12 }} />
            </Typography>
            {tournament.pdgaTournamentId && (
              <Typography
                component="a"
                href={`https://www.pdga.com/live/event/${tournament.pdgaTournamentId}/`}
                target="_blank"
                rel="noopener noreferrer"
                variant="caption"
                sx={{ color: '#1565c0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { textDecoration: 'underline' } }}
              >
                PDGA <OpenInNewIcon sx={{ fontSize: 12 }} />
              </Typography>
            )}
          </Box>
        </Box>
      </Collapse>
    </Card>
  );
};

interface UpcomingTournamentsProps {
  limit?: number;
  showHeader?: boolean;
  headerKey?: string;
}

const UpcomingTournaments: React.FC<UpcomingTournamentsProps> = ({ limit, showHeader = true, headerKey = 'tournaments.upcoming' }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(limit ?? Infinity);
  const { t: tr } = useTranslation();

  useEffect(() => {
    api
      .getUpcomingTournaments()
      .then((res) => setTournaments(res.data.tournaments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <Box>
        {showHeader && (
          <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
            {tr(headerKey)}
          </Typography>
        )}
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={88} sx={{ mb: 1.5 }} />
        ))}
      </Box>
    );
  }

  if (tournaments.length === 0) return null;

  const visible = tournaments.slice(0, visibleCount);
  const hasMore = visibleCount < tournaments.length;

  return (
    <Box>
      {showHeader && (
        <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
          {tr(headerKey)}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {visible.map((tournament) => (
          <TournamentCard
            key={tournament.id}
            tournament={tournament}
            isExpanded={expanded.has(tournament.id)}
            onToggle={() => toggle(tournament.id)}
          />
        ))}
      </Box>
      {hasMore && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button
            variant="text"
            endIcon={<ArrowForwardIcon />}
            onClick={() => setVisibleCount(tournaments.length)}
            sx={{ color: ACCENT, fontWeight: 600 }}
          >
            {tr('tournaments.showMore', { count: tournaments.length - visibleCount })}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default UpcomingTournaments;
