import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';

interface WatchdogSubscription {
  tournamentName: string;
  tournamentDateStart: string | null;
  tournamentDateEnd: string;
  iDiscGolfTournamentId: number;
  phaseNumber: number;
  phaseStartsAt: string;
  notifyMinutesBefore: number;
}

const WatchedRegistrationsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<WatchdogSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  usePageTitle(t('pageTitle.watchedRegistrations'));

  useEffect(() => {
    api.getMyWatchdogSubscriptions()
      .then((res) => setSubscriptions(res.data.subscriptions))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
      <Typography variant="h4" gutterBottom>
        {t('home.watchedTournaments')}
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={72} />
          ))}
        </Box>
      ) : subscriptions.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t('watchedRegistrations.empty')}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {subscriptions.map((sub, i) => (
            <Card
              key={i}
              variant="outlined"
              component="a"
              href={`https://idiscgolf.cz/turnaje/${sub.iDiscGolfTournamentId}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s ease',
                '&:hover': { borderColor: '#e65100', bgcolor: 'action.hover' },
              }}
            >
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <NotificationsActiveIcon sx={{ fontSize: 24, color: '#e65100', flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                    {sub.tournamentName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('watchdog.phase', { number: sub.phaseNumber })} — {formatPhaseTime(sub.phaseStartsAt)}
                  </Typography>
                </Box>
                <Chip
                  label={sub.notifyMinutesBefore === 0
                    ? t('watchdog.atOpen')
                    : t('watchdog.minutesBefore', { minutes: sub.notifyMinutesBefore })}
                  size="small"
                  sx={{ fontSize: '0.7rem' }}
                />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default WatchedRegistrationsPage;
