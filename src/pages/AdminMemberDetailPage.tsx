import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from 'react-i18next';
import {
  membersApi,
  type ClubMember,
  type ClubMemberUpdate,
  type Sex,
} from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import AdminMemberAchievements from '../components/admin/AdminMemberAchievements';

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

function normalize(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

const AdminMemberDetailPage: React.FC = () => {
  const { iDiscGolfId } = useParams<{ iDiscGolfId: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const memberId = iDiscGolfId ? parseInt(iDiscGolfId, 10) : NaN;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [member, setMember] = useState<ClubMember | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  usePageTitle(member ? displayName(member) : t('pageTitle.admin'));

  useEffect(() => {
    if (!user?.isAdmin) return;
    if (!Number.isFinite(memberId)) {
      setError(t('admin.members.detail.loadError'));
      setLoading(false);
      return;
    }
    membersApi
      .getClubMember(memberId)
      .then((res) => {
        setMember(res.data);
        setDraft(draftFromMember(res.data));
      })
      .catch((e) => {
        console.error(e);
        setError(t('admin.members.detail.loadError'));
      })
      .finally(() => setLoading(false));
  }, [memberId, user?.isAdmin, t]);

  if (user && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const save = async () => {
    if (!member || !draft) return;
    setSaving(true);
    setSaved(false);
    setError(null);
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
      const res = await membersApi.updateClubMember(member.iDiscGolfId, update);
      setMember(res.data);
      setDraft(draftFromMember(res.data));
      setSaved(true);
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

  if (error && !member) {
    return (
      <Box>
        <IconButton onClick={() => navigate('/admin/members')} sx={{ mb: 1, ml: -1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!member || !draft) return null;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link
          component="button"
          type="button"
          onClick={() => navigate('/admin/members')}
          underline="hover"
          color="inherit"
        >
          {t('admin.members.title')}
        </Link>
        <Typography color="text.primary">{displayName(member)}</Typography>
      </Breadcrumbs>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/admin/members')} sx={{ ml: -1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {displayName(member)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          iDG #{member.iDiscGolfId}
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {saved && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(false)}>
          {t('admin.members.detail.saved')}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('admin.members.detail.sectionIdentity')}
        </Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('admin.members.firstName')}
              value={draft.firstName}
              onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('admin.members.lastName')}
              value={draft.lastName}
              onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
              fullWidth
            />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="admin-member-detail-sex-label">
                {t('admin.members.sex')}
              </InputLabel>
              <Select
                labelId="admin-member-detail-sex-label"
                label={t('admin.members.sex')}
                value={draft.sex}
                onChange={(e) =>
                  setDraft({ ...draft, sex: e.target.value as Sex | '' })
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
              onChange={(e) => setDraft({ ...draft, dateOfBirth: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          <TextField
            label={t('admin.members.identificationNumber')}
            value={draft.identificationNumber}
            onChange={(e) =>
              setDraft({ ...draft, identificationNumber: e.target.value })
            }
            fullWidth
          />
          <TextField
            label={t('admin.members.address')}
            value={draft.address}
            onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('admin.members.detail.sectionContact')}
        </Typography>
        <Stack spacing={2}>
          <TextField
            label={t('admin.members.email')}
            value={member.email ?? ''}
            fullWidth
            disabled
            helperText={t('admin.members.emailReadonlyHint')}
          />
          <TextField
            label={t('admin.members.phone')}
            value={draft.phone}
            onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
            fullWidth
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {t('admin.members.detail.sectionMembership')}
        </Typography>
        <Stack spacing={2}>
          <TextField
            label={t('admin.members.memberSince')}
            type="date"
            value={draft.memberSince}
            onChange={(e) => setDraft({ ...draft, memberSince: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={draft.activeMember}
                  onChange={(e) =>
                    setDraft({ ...draft, activeMember: e.target.checked })
                  }
                />
              }
              label={t('admin.members.activeMember')}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={draft.isAdmin}
                  onChange={(e) => setDraft({ ...draft, isAdmin: e.target.checked })}
                />
              }
              label={t('admin.members.isAdmin')}
            />
          </Stack>
        </Stack>
      </Paper>

      <AdminMemberAchievements iDiscGolfId={member.iDiscGolfId} />

      <Divider sx={{ mb: 3 }} />

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button onClick={() => navigate('/admin/members')} disabled={saving}>
          {t('admin.members.detail.back')}
        </Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : t('admin.members.save')}
        </Button>
      </Stack>
    </Box>
  );
};

export default AdminMemberDetailPage;
