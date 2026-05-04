import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { api, type TagovackaMemberDetail } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import TagBadge from '../TagBadge';

interface Props {
  iDiscGolfId: number | null;
}

const MIN_TAG = 1;
const MAX_TAG = 9999;
const DEFAULT_BADGE_COLOR = '#1565c0';
const DEFAULT_HIGHLIGHT_COLOR = '#0d47a1';

const AdminMemberTagovackaSection: React.FC<Props> = ({ iDiscGolfId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const club = user?.tagovacka?.membership?.club;
  const clubId = club?.id ?? null;
  const badgeColor = club?.tagBadgeColor || DEFAULT_BADGE_COLOR;
  const highlightColor = club?.tagBadgeHighlightColor || DEFAULT_HIGHLIGHT_COLOR;

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notInClub, setNotInClub] = useState(false);
  const [detail, setDetail] = useState<TagovackaMemberDetail | null>(null);

  const [newTag, setNewTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [assigned, setAssigned] = useState(false);

  useEffect(() => {
    if (iDiscGolfId == null) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setNotInClub(false);
    api
      .getMemberDetail(iDiscGolfId)
      .then((res) => {
        if (cancelled) return;
        setDetail(res.data as TagovackaMemberDetail);
      })
      .catch((e) => {
        if (cancelled) return;
        // 404 when the player isn't an active member of the caller's club —
        // render a neutral placeholder, not an error.
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setNotInClub(true);
        } else {
          setLoadError(t('admin.members.detail.tagovacka.loadError'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [iDiscGolfId, t]);

  const submit = async () => {
    if (!detail || clubId == null) return;
    const parsed = parseInt(newTag, 10);
    if (!Number.isInteger(parsed) || parsed < MIN_TAG || parsed > MAX_TAG) return;

    setSubmitting(true);
    setSubmitError(null);
    setAssigned(false);
    try {
      await api.manualTransfer({
        clubId,
        transfers: [{ membershipId: detail.membership.id, newTagNumber: parsed }],
      });
      // Refetch from tagovacka rather than trusting local state — keeps the
      // displayed current tag in sync with what the server actually stored.
      const fresh = await api.getMemberDetail(detail.player.iDiscGolfId);
      setDetail(fresh.data as TagovackaMemberDetail);
      setNewTag('');
      setAssigned(true);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { detail?: string; message?: string } | undefined;
        setSubmitError(data?.detail ?? data?.message ?? t('admin.members.detail.tagovacka.loadError'));
      } else {
        setSubmitError(t('admin.members.detail.tagovacka.loadError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const header = (
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
      {t('admin.members.detail.sectionTagovacka')}
    </Typography>
  );

  if (iDiscGolfId == null) {
    return (
      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        {header}
        <Alert severity="info">{t('admin.members.detail.tagovacka.notLinked')}</Alert>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        {header}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      </Paper>
    );
  }

  if (loadError) {
    return (
      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        {header}
        <Alert severity="error">{loadError}</Alert>
      </Paper>
    );
  }

  if (notInClub || !detail) {
    return (
      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        {header}
        <Alert severity="info">{t('admin.members.detail.tagovacka.notInClub')}</Alert>
      </Paper>
    );
  }

  const parsed = parseInt(newTag, 10);
  const validTag =
    Number.isInteger(parsed) && parsed >= MIN_TAG && parsed <= MAX_TAG;

  return (
    <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
      {header}
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}
      {assigned && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAssigned(false)}>
          {t('admin.members.detail.tagovacka.assigned')}
        </Alert>
      )}
      <Stack spacing={3}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('admin.members.detail.tagovacka.currentTag')}
          </Typography>
          <TagBadge
            number={detail.membership.tagNumber}
            size="medium"
            badgeColor={badgeColor}
            highlightColor={highlightColor}
          />
        </Box>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ sm: 'center' }}
        >
          <TextField
            label={t('admin.members.detail.tagovacka.newTag')}
            type="number"
            size="small"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            slotProps={{ htmlInput: { min: MIN_TAG, max: MAX_TAG } }}
            disabled={submitting || clubId == null}
            sx={{ width: { xs: '100%', sm: 140 } }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={submit}
            disabled={submitting || !validTag || clubId == null}
            sx={{ minWidth: 120 }}
          >
            {submitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              t('admin.members.detail.tagovacka.assign')
            )}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default AdminMemberTagovackaSection;
