import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import { useTranslation } from 'react-i18next';
import { membersApi, type ClubMember } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

function displayName(m: ClubMember): string {
  const full = [m.firstName, m.lastName].filter(Boolean).join(' ').trim();
  if (full !== '') return full;
  if (m.email) return m.email;
  return `#${m.iDiscGolfId}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function formatLastSeen(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'short' });
}

type SortKey = 'name' | 'age' | 'status';
type SortDir = 'asc' | 'desc';

const AdminMembersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  usePageTitle(t('pageTitle.admin'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const load = async () => {
    const res = await membersApi.listClubMembers();
    setMembers(res.data);
  };

  useEffect(() => {
    if (!user?.isAdmin) return;
    load()
      .catch((e) => {
        console.error(e);
        setError(t('admin.members.loadError'));
      })
      .finally(() => setLoading(false));
  }, [user?.isAdmin, t]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await membersApi.syncMembers();
      setSyncMessage(
        t('admin.members.syncSuccess', {
          total: res.data.total,
          created: res.data.created,
        }),
      );
      await load();
    } catch (e) {
      console.error(e);
      setError(t('admin.members.syncError'));
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = q
      ? members.filter((m) => {
          const name = displayName(m).toLowerCase();
          return (
            name.includes(q) ||
            (m.email?.toLowerCase().includes(q) ?? false) ||
            (m.phone?.toLowerCase().includes(q) ?? false)
          );
        })
      : [...members];

    const dir = sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      if (sortKey === 'name') {
        return displayName(a).localeCompare(displayName(b), 'cs') * dir;
      }
      if (sortKey === 'age') {
        const ax = ageFromDob(a.dateOfBirth);
        const bx = ageFromDob(b.dateOfBirth);
        if (ax === null && bx === null) return 0;
        if (ax === null) return 1;
        if (bx === null) return -1;
        return (ax - bx) * dir;
      }
      const as = (a.activeMember ? 1 : 0) + (a.isAdmin ? 2 : 0);
      const bs = (b.activeMember ? 1 : 0) + (b.isAdmin ? 2 : 0);
      return (bs - as) * dir;
    });
    return result;
  }, [members, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const counts = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.activeMember).length,
      admins: members.filter((m) => m.isAdmin).length,
    }),
    [members],
  );

  if (user && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        {t('admin.members.title')}
      </Typography>
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }} alignItems="center" flexWrap="wrap">
        <Typography variant="body2" color="text.secondary">
          {t('admin.members.subtitle')}
        </Typography>
        <Chip
          size="small"
          label={t('admin.members.countTotal', { count: counts.total })}
          sx={{ fontWeight: 600 }}
        />
        <Chip
          size="small"
          color="success"
          variant="outlined"
          label={t('admin.members.countActive', { count: counts.active })}
        />
        <Chip
          size="small"
          color="primary"
          variant="outlined"
          label={t('admin.members.countAdmins', { count: counts.admins })}
        />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {syncMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSyncMessage(null)}>
          {syncMessage}
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ mb: 2 }}
        alignItems={{ sm: 'center' }}
      >
        <TextField
          size="small"
          placeholder={t('admin.members.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: 400, width: '100%' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={syncing ? <CircularProgress size={16} /> : <SyncIcon />}
          onClick={handleSync}
          disabled={syncing}
        >
          {t('admin.members.sync')}
        </Button>
      </Stack>

      <TableContainer sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 48 }} />
              <TableCell sortDirection={sortKey === 'name' ? sortDir : false}>
                <TableSortLabel
                  active={sortKey === 'name'}
                  direction={sortKey === 'name' ? sortDir : 'asc'}
                  onClick={() => toggleSort('name')}
                >
                  {t('admin.members.name')}
                </TableSortLabel>
              </TableCell>
              <TableCell>{t('admin.members.contact')}</TableCell>
              <TableCell sortDirection={sortKey === 'age' ? sortDir : false} sx={{ width: 90 }}>
                <TableSortLabel
                  active={sortKey === 'age'}
                  direction={sortKey === 'age' ? sortDir : 'asc'}
                  onClick={() => toggleSort('age')}
                >
                  {t('admin.members.age')}
                </TableSortLabel>
              </TableCell>
              <TableCell>{t('admin.members.address')}</TableCell>
              <TableCell
                sortDirection={sortKey === 'status' ? sortDir : false}
                sx={{ width: 160 }}
              >
                <TableSortLabel
                  active={sortKey === 'status'}
                  direction={sortKey === 'status' ? sortDir : 'asc'}
                  onClick={() => toggleSort('status')}
                >
                  {t('admin.members.status')}
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ width: 160 }}>{t('admin.members.lastSeenAt')}</TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((m) => {
              const name = displayName(m);
              const age = ageFromDob(m.dateOfBirth);
              const SexIcon = m.sex === 'male' ? MaleIcon : m.sex === 'female' ? FemaleIcon : null;
              const sexColor = m.sex === 'male' ? '#1565c0' : m.sex === 'female' ? '#c2185b' : 'text.disabled';
              const rcMissing = !m.identificationNumber;
              return (
                <TableRow
                  key={m.iDiscGolfId}
                  hover
                  onClick={() => navigate(`/admin/members/${m.iDiscGolfId}`)}
                  sx={{ opacity: m.activeMember ? 1 : 0.6, cursor: 'pointer' }}
                >
                  <TableCell sx={{ width: 48 }}>
                    <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                      {getInitials(name)}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography fontWeight={600} variant="body2">
                        {name}
                      </Typography>
                      {m.isAdmin && (
                        <Tooltip title={t('admin.members.adminBadge')} arrow>
                          <AdminPanelSettingsIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                        </Tooltip>
                      )}
                      {rcMissing && (
                        <Tooltip title={t('admin.members.missingPii')} arrow>
                          <Chip
                            label="!"
                            size="small"
                            color="warning"
                            sx={{ height: 16, minWidth: 16, '& .MuiChip-label': { px: 0.5, fontSize: '0.65rem', fontWeight: 700 } }}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      iDG #{m.iDiscGolfId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography
                        variant="body2"
                        color={m.email ? 'text.primary' : 'text.disabled'}
                        sx={{ lineHeight: 1.2 }}
                      >
                        {m.email ?? '—'}
                      </Typography>
                      <Typography
                        variant="caption"
                        color={m.phone ? 'text.secondary' : 'text.disabled'}
                      >
                        {m.phone ?? '—'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {SexIcon && <SexIcon sx={{ fontSize: 16, color: sexColor }} />}
                      {age !== null ? (
                        <Tooltip title={m.dateOfBirth ?? ''} arrow>
                          <Typography variant="body2" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                            <CakeOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            {age}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography
                      variant="body2"
                      color={m.address ? 'text.primary' : 'text.disabled'}
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={m.address ?? undefined}
                    >
                      {m.address ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={m.activeMember ? 'success' : 'default'}
                      variant={m.activeMember ? 'filled' : 'outlined'}
                      label={
                        m.activeMember
                          ? t('admin.members.activeBadge')
                          : t('admin.members.inactiveBadge')
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={m.lastSeenAt ? 'text.primary' : 'text.disabled'}>
                      {formatLastSeen(m.lastSeenAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ width: 48, color: 'text.disabled' }}>
                    <IconButton size="small" tabIndex={-1} sx={{ pointerEvents: 'none' }}>
                      <ChevronRightIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    {t('admin.members.empty')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminMembersPage;
