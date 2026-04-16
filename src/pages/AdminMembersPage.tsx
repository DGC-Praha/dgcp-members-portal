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
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import SyncIcon from '@mui/icons-material/Sync';
import { useTranslation } from 'react-i18next';
import { api, membersApi, type ClubMember } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface TagovackaMember {
  name: string;
  iDiscGolfId: number;
  pdgaNumber: number | null;
  tagNumber: number | null;
  avatarUrl: string | null;
  iDiscGolfRating: number | null;
  pdgaRating: number | null;
  role: string;
  joinedAt: string;
}

interface Row {
  iDiscGolfId: number;
  name: string;
  avatarUrl: string | null;
  tagNumber: number | null;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  clubId: number | null; // members-api Player.id (null if not yet seen)
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

const AdminMembersPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [draftPhone, setDraftPhone] = useState('');
  const [draftAdmin, setDraftAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const load = async () => {
    const [tagRes, clubRes] = await Promise.all([
      api.getMembers(),
      membersApi.listClubMembers(),
    ]);
    const tagovackaMembers: TagovackaMember[] = tagRes.data;
    const clubByIDiscGolfId = new Map<number, ClubMember>(
      clubRes.data.map((c) => [c.iDiscGolfId, c]),
    );
    const merged: Row[] = tagovackaMembers.map((m) => {
      const c = clubByIDiscGolfId.get(m.iDiscGolfId);
      return {
        iDiscGolfId: m.iDiscGolfId,
        name: m.name,
        avatarUrl: m.avatarUrl,
        tagNumber: m.tagNumber,
        email: c?.email ?? null,
        phone: c?.phone ?? null,
        isAdmin: c?.isAdmin ?? false,
        clubId: c?.id ?? null,
      };
    });
    setRows(merged);
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
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  // Belt-and-braces: if user somehow lands here as non-admin, bounce.
  if (user && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const openEdit = (row: Row) => {
    setEditing(row);
    setDraftPhone(row.phone ?? '');
    setDraftAdmin(row.isAdmin);
  };

  const closeEdit = () => {
    if (saving) return;
    setEditing(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const normalizedPhone = draftPhone.trim();
      const res = await membersApi.updateClubMember(editing.iDiscGolfId, {
        phone: normalizedPhone === '' ? null : normalizedPhone,
        isAdmin: draftAdmin,
      });
      const updated = res.data;
      setRows((prev) =>
        prev.map((r) =>
          r.iDiscGolfId === editing.iDiscGolfId
            ? { ...r, phone: updated.phone, isAdmin: updated.isAdmin, clubId: updated.id }
            : r,
        ),
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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('admin.members.subtitle')}
      </Typography>

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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: 'center' }}>
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
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>{t('admin.members.name')}</TableCell>
              <TableCell>{t('admin.members.email')}</TableCell>
              <TableCell>{t('admin.members.phone')}</TableCell>
              <TableCell>{t('admin.members.role')}</TableCell>
              <TableCell align="right">{t('admin.members.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.iDiscGolfId} hover>
                <TableCell sx={{ width: 56 }}>
                  <Avatar src={row.avatarUrl ?? undefined} sx={{ width: 36, height: 36 }}>
                    {getInitials(row.name)}
                  </Avatar>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={500}>{row.name}</Typography>
                  {row.tagNumber !== null && (
                    <Typography variant="caption" color="text.secondary">
                      #{row.tagNumber}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color={row.email ? 'text.primary' : 'text.disabled'}>
                    {row.email ?? '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color={row.phone ? 'text.primary' : 'text.disabled'}>
                    {row.phone ?? '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {row.isAdmin ? (
                    <Chip size="small" color="primary" label={t('admin.members.adminBadge')} />
                  ) : (
                    <Chip size="small" variant="outlined" label={t('admin.members.memberBadge')} />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(row)} aria-label={t('admin.members.edit')}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    {t('admin.members.empty')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editing} onClose={closeEdit} fullWidth maxWidth="xs">
        {editing && (
          <>
            <DialogTitle>
              {t('admin.members.editTitle', { name: editing.name })}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label={t('admin.members.email')}
                  value={editing.email ?? ''}
                  fullWidth
                  disabled
                  helperText={t('admin.members.emailReadonlyHint')}
                />
                <TextField
                  label={t('admin.members.phone')}
                  value={draftPhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  fullWidth
                  autoFocus
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={draftAdmin}
                      onChange={(e) => setDraftAdmin(e.target.checked)}
                    />
                  }
                  label={t('admin.members.isAdmin')}
                />
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
