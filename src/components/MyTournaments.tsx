import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Chip,
  Skeleton,
  Button,
  alpha,
} from '@mui/material';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import { formatDateRange } from './UpcomingTournaments';

const ACCENT = '#e65100';

interface MyTournament {
  id: number;
  name: string;
  dateStart: string | null;
  dateEnd: string;
  cadgTier: string | null;
  pdgaTier: string | null;
  region: string | null;
  iDiscGolfTournamentId: number;
  pdgaTournamentId: number | null;
  division: string;
  /** 'registered' | 'waiting' | 'wildcard' — defaults to 'registered' for back-compat. */
  state?: string;
  totalPlayers: number;
  waitlistedPlayers?: number;
  playerLimit: number | null;
}

const MyTournaments: React.FC = () => {
  const [tournaments, setTournaments] = useState<MyTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { t: tr } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    api.getMyTournaments()
      .then((res) => setTournaments(res.data.tournaments))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
          {tr('home.myTournaments')}
        </Typography>
        {[1, 2].map((i) => (
          <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1.5 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
        {tr('home.myTournaments')}
      </Typography>

      {tournaments.length === 0 ? (
        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 2.5, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {tr('home.myTournamentsEmpty')}
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/turnaje')}
            sx={{ color: ACCENT, fontWeight: 600 }}
          >
            {tr('home.browseTournaments')}
          </Button>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {tournaments.map((t) => (
            <Card
              key={t.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: ACCENT,
                  boxShadow: `0 4px 20px ${alpha(ACCENT, 0.12)}`,
                },
              }}
            >
              <CardActionArea
                href={`https://idiscgolf.cz/turnaje/${t.iDiscGolfTournamentId}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ p: 2 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <EmojiEventsOutlinedIcon sx={{ color: ACCENT, fontSize: 20, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
                        {t.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateRange(t.dateStart, t.dateEnd)}
                        </Typography>
                        {t.cadgTier && (
                          <Chip
                            label={t.cadgTier}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#fff3e0', color: '#e65100' }}
                          />
                        )}
                        {t.pdgaTournamentId && (
                          <Chip
                            label={t.pdgaTier || 'PDGA'}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }}
                          />
                        )}
                        {t.region && (
                          <Typography variant="caption" color="text.secondary">
                            {t.region}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, ml: 1.5 }}>
                    {t.state === 'waiting' && (
                      <Chip
                        label={tr('tournaments.youAreWaitlisted')}
                        size="small"
                        sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#fff3e0', color: '#e65100' }}
                      />
                    )}
                    <Chip
                      label={t.division}
                      size="small"
                      sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                    />
                    <OpenInNewIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default MyTournaments;
