import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Skeleton,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';

interface WatchdogSubscription {
  tournamentName: string;
  tournamentDateStart: string | null;
  tournamentDateEnd: string;
  iDiscGolfTournamentId: number;
  phaseNumber: number;
  phaseStartsAt: string;
  notifyMinutesBefore: number;
}

const WatchedTournaments: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<WatchdogSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { t: tr } = useTranslation();

  useEffect(() => {
    api.getMyWatchdogSubscriptions()
      .then((res) => setSubscriptions(res.data.subscriptions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
          {tr('home.watchedTournaments')}
        </Typography>
        <Skeleton variant="rounded" height={48} />
      </Box>
    );
  }

  if (subscriptions.length === 0) return null;

  const formatPhaseTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
        {tr('home.watchedTournaments')}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {subscriptions.map((sub, i) => (
          <Box
            key={i}
            component="a"
            href={`https://idiscgolf.cz/turnaje/${sub.iDiscGolfTournamentId}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              p: 1,
              borderRadius: 1.5,
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <NotificationsActiveIcon sx={{ fontSize: 16, color: '#e65100', mt: 0.25, flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3 }} noWrap>
                {sub.tournamentName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tr('watchdog.phase', { number: sub.phaseNumber })} — {formatPhaseTime(sub.phaseStartsAt)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default WatchedTournaments;
