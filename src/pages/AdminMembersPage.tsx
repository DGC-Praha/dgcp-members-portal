import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
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
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import { useTranslation } from 'react-i18next';
import {
  membersApi,
  type ClubMember,
  type ClubMemberUpdate,
  type Sex,
} from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';

interface Draft {
  firstName: string;
  lastName: string;
  sex: Sex | '';
  dateOfBirth: string;
  identificationNumber: string;
  address: string;
  phone: string;
  memberSince: string;
  activeMember: boolean;
  isAdmin: boolean;
}

function emptyDraft(): Draft {
  return {
    firstName: '',
    lastName: '',
    sex: '',
    dateOfBirth: '',
    identificationNumber: '',
    address: '',
    phone: '',
    memberSince: '',
    activeMember: false,
    isAdmin: false,
  };
}

function draftFromMember(m: ClubMember): Draft {
  return {
    firstName: m.firstName ?? '',
    lastName: m.lastName ?? '',
    sex: (m.sex ?? '') as Sex | '',
    dateOfBirth: m.dateOfBirth ?? '',
    identificationNumber: m.identificationNumber ?? '',
    address: m.address ?? '',
    phone: m.phone ?? '',
    memberSince: m.memberSince ?? '',
    activeMember: m.activeMember,
    isAdmin: m.isAdmin,
  };
}

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

function normalize(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
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

type SortKey = 'name' | 'age' | 'status';
type SortDir = 'asc' | 'desc';

const AdminMembersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  usePageTitle(t('pageTitle.admin'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [editing, setEditing] = useState<ClubMember | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // status: active first when asc
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

  // Belt-and-braces: if user somehow lands here as non-admin, bounce.
  if (user && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const openEdit = (member: ClubMember) => {
    setEditing(member);
    setDraft(draftFromMember(member));
  };

  const closeEdit = () => {
    if (saving) return;
    setEditing(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const update: ClubMemberUpdate = {
        firstName: normalize(draft.firstName),
        lastName: normalize(draft.lastName),
        sex: draft.sex === '' ? null : draft.sex,
        dateOfBirth: normalize(draft.dateOfBirth),
        identificationNumber: normalize(draft.identificationNumber),
        address: normalize(draft.address),
        phone: normalize(draft.phone),
        memberSince: normalize(draft.memberSince),
        activeMember: draft.activeMember,
        isAdmin: draft.isAdmin,
      };
      const res = await membersApi.updateClubMember(editing.iDiscGolfId, update);
      const updated = res.data;
      setMembers((prev) =>
        prev.map((m) => (m.iDiscGolfId === editing.iDiscGolfId ? updated : m)),
      );
      setEditing(null);
    } catch (e) {
      console.error(e);
      setError(t('admin.members.saveError'));
    } finally {
      setSaving(false);
    }
  };

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
              <TableCell align="right" sx={{ width: 64 }}>
                {t('admin.members.actions')}
              </TableCell>
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
                  sx={{ opacity: m.activeMember ? 1 : 0.6 }}
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
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => openEdit(m)}
                      aria-label={t('admin.members.edit')}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    {t('admin.members.empty')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editing} onClose={closeEdit} fullWidth maxWidth="sm">
        {editing && (
          <>
            <DialogTitle>
              {t('admin.members.editTitle', { name: displayName(editing) })}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label={t('admin.members.firstName')}
                    value={draft.firstName}
                    onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label={t('admin.members.lastName')}
                    value={draft.lastName}
                    onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
                    fullWidth
                  />
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel id="admin-members-sex-label">
                      {t('admin.members.sex')}
                    </InputLabel>
                    <Select
                      labelId="admin-members-sex-label"
                      label={t('admin.members.sex')}
                      value={draft.sex}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, sex: e.target.value as Sex | '' }))
                      }
                    >
                      <MenuItem value="">—</MenuItem>
                      <MenuItem value="male">{t('admin.members.sexMale')}</MenuItem>
                      <MenuItem value="female">{t('admin.members.sexFemale')}</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    label={t('admin.members.dateOfBirth')}
                    type="date"
                    value={draft.dateOfBirth}
                    onChange={(e) => setDraft((d) => ({ ...d, dateOfBirth: e.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
                <TextField
                  label={t('admin.members.identificationNumber')}
                  value={draft.identificationNumber}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, identificationNumber: e.target.value }))
                  }
                  fullWidth
                />
                <TextField
                  label={t('admin.members.address')}
                  value={draft.address}
                  onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  fullWidth
                  multiline
                  minRows={2}
                />
                <TextField
                  label={t('admin.members.email')}
                  value={editing.email ?? ''}
                  fullWidth
                  disabled
                  helperText={t('admin.members.emailReadonlyHint')}
                />
                <TextField
                  label={t('admin.members.phone')}
                  value={draft.phone}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label={t('admin.members.memberSince')}
                  type="date"
                  value={draft.memberSince}
                  onChange={(e) => setDraft((d) => ({ ...d, memberSince: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={draft.activeMember}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, activeMember: e.target.checked }))
                        }
                      />
                    }
                    label={t('admin.members.activeMember')}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={draft.isAdmin}
                        onChange={(e) => setDraft((d) => ({ ...d, isAdmin: e.target.checked }))}
                      />
                    }
                    label={t('admin.members.isAdmin')}
                  />
                </Stack>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeEdit} disabled={saving}>
                {t('admin.members.cancel')}
              </Button>
              <Button variant="contained" onClick={saveEdit} disabled={saving}>
                {saving ? <CircularProgress size={20} /> : t('admin.members.save')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminMembersPage;
