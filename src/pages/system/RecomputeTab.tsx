import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslation } from 'react-i18next';
import { membersApi, type ClubMemberBasic } from '../../api/client';

interface PlayerOption {
  iDiscGolfId: number;
  label: string;
}

function memberLabel(m: ClubMemberBasic): string {
  const full = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
  if (full !== '') return m.iDiscGolfId !== null ? `${full} (#${m.iDiscGolfId})` : full;
  return m.iDiscGolfId !== null ? `#${m.iDiscGolfId}` : `(member ${m.id})`;
}

const RecomputeTab: React.FC = () => {
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const [members, setMembers] = useState<ClubMemberBasic[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [selectedPlayer, setSelectedPlayer] = useState<PlayerOption | null>(null);
  const [playerYear, setPlayerYear] = useState<number | ''>('');
  const [playerBusy, setPlayerBusy] = useState(false);

  const [seasonYear, setSeasonYear] = useState<number>(currentYear);
  const [seasonBusy, setSeasonBusy] = useState(false);

  const [allBusy, setAllBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await membersApi.listMembersBasic();
        setMembers(res.data);
      } catch (e) {
        setMembersError((e as { message?: string })?.message ?? String(e));
      } finally {
        setMembersLoading(false);
      }
    })();
  }, []);

  const playerOptions: PlayerOption[] = useMemo(
    () =>
      members
        .filter((m) => m.iDiscGolfId !== null)
        .map((m) => ({ iDiscGolfId: m.iDiscGolfId as number, label: memberLabel(m) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'cs')),
    [members],
  );

  const runPlayer = async () => {
    if (selectedPlayer === null) return;
    setPlayerBusy(true);
    setError(null);
    try {
      const year = playerYear === '' ? undefined : playerYear;
      const res = await membersApi.recomputePlayer(selectedPlayer.iDiscGolfId, year);
      setToast(
        t('system.recompute.player.success', {
          name: selectedPlayer.label,
          year: res.data.year,
        }),
      );
    } catch (e) {
      setError((e as { message?: string })?.message ?? String(e));
    } finally {
      setPlayerBusy(false);
    }
  };

  const runSeason = async () => {
    if (!window.confirm(t('system.recompute.season.confirm', { year: seasonYear }))) return;
    setSeasonBusy(true);
    setError(null);
    try {
      const res = await membersApi.recomputeSeason(seasonYear);
      setToast(
        t('system.recompute.season.success', {
          dispatched: res.data.dispatched ?? 0,
          year: res.data.year,
        }),
      );
    } catch (e) {
      setError((e as { message?: string })?.message ?? String(e));
    } finally {
      setSeasonBusy(false);
    }
  };

  const runAll = async () => {
    if (!window.confirm(t('system.recompute.all.confirm'))) return;
    setAllBusy(true);
    setError(null);
    try {
      const res = await membersApi.recomputeAll();
      setToast(
        t('system.recompute.all.success', {
          dispatched: res.data.dispatched ?? 0,
          seasons: res.data.seasons?.length ?? 0,
        }),
      );
    } catch (e) {
      setError((e as { message?: string })?.message ?? String(e));
    } finally {
      setAllBusy(false);
    }
  };

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {membersError && <Alert severity="warning">{membersError}</Alert>}

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {t('system.recompute.player.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('system.recompute.player.desc')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
          <Autocomplete
            size="small"
            sx={{ flex: 1, minWidth: 280 }}
            options={playerOptions}
            loading={membersLoading}
            getOptionLabel={(o) => o.label}
            isOptionEqualToValue={(a, b) => a.iDiscGolfId === b.iDiscGolfId}
            value={selectedPlayer}
            onChange={(_, v) => setSelectedPlayer(v)}
            renderInput={(params) => (
              <TextField {...params} label={t('system.recompute.player.fieldPlayer')} />
            )}
          />
          <TextField
            size="small"
            select
            label={t('system.recompute.player.fieldYear')}
            value={playerYear}
            onChange={(e) => {
              const raw = e.target.value;
              setPlayerYear(raw === '' ? '' : Number(raw));
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">{t('system.recompute.player.yearCurrent')}</MenuItem>
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            startIcon={playerBusy ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
            disabled={selectedPlayer === null || playerBusy}
            onClick={runPlayer}
          >
            {t('system.recompute.player.action')}
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
          {t('system.recompute.season.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('system.recompute.season.desc')}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
          <TextField
            size="small"
            select
            label={t('system.recompute.player.fieldYear')}
            value={seasonYear}
            onChange={(e) => setSeasonYear(Number(e.target.value))}
            sx={{ minWidth: 180 }}
          >
            {yearOptions.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            color="warning"
            startIcon={seasonBusy ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
            disabled={seasonBusy}
            onClick={runSeason}
          >
            {t('system.recompute.season.action')}
          </Button>
        </Stack>
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          borderColor: 'error.light',
          bgcolor: 'error.lighter',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <WarningAmberIcon color="error" fontSize="small" />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {t('system.recompute.all.title')}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('system.recompute.all.desc')}
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={allBusy ? <CircularProgress size={16} color="inherit" /> : <PlayArrowIcon />}
          disabled={allBusy}
          onClick={runAll}
        >
          {t('system.recompute.all.action')}
        </Button>
      </Paper>

      <Snackbar
        open={toast !== null}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        message={toast ?? ''}
      />
    </Stack>
  );
};

export default RecomputeTab;
