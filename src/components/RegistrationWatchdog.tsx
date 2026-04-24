import React, { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Tooltip,
  Divider,
  alpha,
} from '@mui/material';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import type { RegistrationPhase } from './UpcomingTournaments';
import { dateLocale } from '../i18n/format';

interface PhaseSubscription {
  phaseNumber: number;
  subscribed: boolean;
  notifyMinutesBefore: number;
}

interface RegistrationWatchdogProps {
  tournamentIdgId: number;
  registrationPhases: RegistrationPhase[];
}

const TIMING_OPTIONS = [0, 5, 15, 30];

const RegistrationWatchdog: React.FC<RegistrationWatchdogProps> = ({
  tournamentIdgId,
  registrationPhases,
}) => {
  const hasFuturePhases = registrationPhases.some((p) => new Date(p.startsAt) > new Date());

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [subscriptions, setSubscriptions] = useState<PhaseSubscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { t: tr } = useTranslation();

  const hasSubscriptions = subscriptions.some((s) => s.subscribed);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.getWatchdogStatus(tournamentIdgId);
      setSubscriptions(res.data);
    } catch {
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (anchorEl) {
      fetchStatus();
    }
  }, [anchorEl]);

  const handleSubscribe = async (phaseNumber: number, notifyMinutesBefore: number) => {
    setActionLoading(phaseNumber);
    try {
      await api.watchdogSubscribe({ tournamentIdgId, phaseNumber, notifyMinutesBefore });
      await fetchStatus();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsubscribe = async (phaseNumber: number) => {
    setActionLoading(phaseNumber);
    try {
      await api.watchdogUnsubscribePhase({ tournamentIdgId, phaseNumber });
      await fetchStatus();
    } catch {
      // ignore
    } finally {
      setActionLoading(null);
    }
  };

  const getSubscription = (phaseNumber: number): PhaseSubscription | undefined =>
    subscriptions.find((s) => s.phaseNumber === phaseNumber);

  const formatPhaseTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(dateLocale(), {
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!hasFuturePhases && !hasSubscriptions) return null;

  return (
    <>
      <Tooltip title={tr('watchdog.notify')} arrow>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setAnchorEl(e.currentTarget);
          }}
          sx={{
            color: hasSubscriptions ? '#e65100' : 'text.secondary',
          }}
        >
          {hasSubscriptions ? (
            <NotificationsActiveIcon sx={{ fontSize: 20 }} />
          ) : (
            <NotificationsOutlinedIcon sx={{ fontSize: 20 }} />
          )}
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { p: 2, minWidth: 300, maxWidth: 380 },
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          {tr('watchdog.notify')}
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : registrationPhases.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {tr('watchdog.noPhases')}
          </Typography>
        ) : (
          registrationPhases.map((phase, idx) => {
            const sub = getSubscription(phase.phaseNumber);
            const isSubscribed = sub?.subscribed ?? false;
            const isLoading = actionLoading === phase.phaseNumber;
            const isPast = new Date(phase.startsAt) < new Date();

            return (
              <Box key={phase.phaseNumber}>
                {idx > 0 && <Divider sx={{ my: 1.5 }} />}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {tr('watchdog.phase', { number: phase.phaseNumber })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatPhaseTime(phase.startsAt)}
                    </Typography>
                  </Box>

                  {phase.restrictions && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      {phase.restrictions}
                    </Typography>
                  )}

                  {isPast ? (
                    <Typography variant="caption" color="text.secondary">
                      {tr('watchdog.alreadyOpened')}
                    </Typography>
                  ) : isSubscribed ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#e65100',
                          fontWeight: 600,
                          bgcolor: alpha('#e65100', 0.08),
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                        }}
                      >
                        {tr('watchdog.subscribed')}
                      </Typography>
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => handleUnsubscribe(phase.phaseNumber)}
                        disabled={isLoading}
                        sx={{ fontSize: '0.7rem', minWidth: 0, color: 'text.secondary' }}
                      >
                        {isLoading ? <CircularProgress size={14} /> : tr('watchdog.unsubscribe')}
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Select
                        size="small"
                        defaultValue={0}
                        sx={{ fontSize: '0.75rem', height: 30, minWidth: 120 }}
                        id={`timing-${phase.phaseNumber}`}
                        onChange={(e) => handleSubscribe(phase.phaseNumber, e.target.value as number)}
                        disabled={isLoading}
                      >
                        {TIMING_OPTIONS.map((min) => (
                          <MenuItem key={min} value={min} sx={{ fontSize: '0.75rem' }}>
                            {min === 0 ? tr('watchdog.atOpen') : tr('watchdog.minutesBefore', { minutes: min })}
                          </MenuItem>
                        ))}
                      </Select>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          const select = document.getElementById(`timing-${phase.phaseNumber}`) as HTMLSelectElement | null;
                          const val = select ? parseInt(select.value || '0', 10) : 0;
                          handleSubscribe(phase.phaseNumber, val);
                        }}
                        disabled={isLoading}
                        sx={{
                          fontSize: '0.7rem',
                          minWidth: 0,
                          borderColor: '#e65100',
                          color: '#e65100',
                          '&:hover': { borderColor: '#bf360c', bgcolor: alpha('#e65100', 0.04) },
                        }}
                      >
                        {isLoading ? <CircularProgress size={14} /> : tr('watchdog.notify')}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Popover>
    </>
  );
};

export default RegistrationWatchdog;
