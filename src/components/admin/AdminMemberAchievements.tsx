import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  membersApi,
  type AdminMemberAchievement,
} from '../../api/client';
import { TIER_BG, TIER_COLORS, tierLabel, twemoji } from '../achievements/shared';

interface Props {
  iDiscGolfId: number;
}

function earnedTierFor(ach: AdminMemberAchievement): string | null {
  for (let i = ach.tiers.length - 1; i >= 0; i--) {
    if (ach.tiers[i].earned) return ach.tiers[i].tier;
  }
  return null;
}

const ManualBadge: React.FC<{ ach: AdminMemberAchievement; saving: boolean }> = ({ ach, saving }) => {
  const earnedTier = earnedTierFor(ach);
  const ringColor = earnedTier ? (TIER_COLORS[earnedTier] ?? '#9ca3af') : '#e0e0e0';
  const bgColor = earnedTier ? (TIER_BG[earnedTier] ?? '#f5f5f5') : '#f5f5f5';
  return (
    <Box
      sx={{
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: ringColor,
        flexShrink: 0,
        opacity: saving ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '3px',
          left: '3px',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          bgcolor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: earnedTier ? 'none' : 'grayscale(1) brightness(0.9)',
          opacity: earnedTier ? 1 : 0.5,
        }}
      >
        <img src={twemoji(ach.emoji)} alt="" width={22} height={22} />
      </Box>
    </Box>
  );
};

const ManualRow: React.FC<{
  ach: AdminMemberAchievement;
  onChange: (key: string, progress: number) => Promise<void>;
}> = ({ ach, onChange }) => {
  const [saving, setSaving] = useState(false);
  const singleTier = ach.tiers.length === 1;
  const earnedTier = earnedTierFor(ach);

  const handle = async (progress: number) => {
    setSaving(true);
    try {
      await onChange(ach.key, progress);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 1.5 }}>
      <ManualBadge ach={ach} saving={saving} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {ach.name}
          </Typography>
          {earnedTier && (
            <Chip
              size="small"
              label={tierLabel(earnedTier)}
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: TIER_BG[earnedTier] ?? '#f5f5f5',
                color: TIER_COLORS[earnedTier] ?? '#666',
                border: `1px solid ${TIER_COLORS[earnedTier] ?? '#ccc'}`,
              }}
            />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {ach.description}
        </Typography>
      </Box>
      <Box sx={{ flexShrink: 0 }}>
        {singleTier ? (
          <Switch
            checked={ach.progress >= ach.tiers[0].threshold}
            onChange={(e) => handle(e.target.checked ? ach.tiers[0].threshold : 0)}
            disabled={saving}
          />
        ) : (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={String(ach.progress)}
            onChange={(_, v) => {
              if (v === null) return;
              handle(parseInt(v, 10));
            }}
            disabled={saving}
          >
            <ToggleButton value="0">0</ToggleButton>
            {ach.tiers.map((tier) => (
              <Tooltip key={tier.tier} title={tierLabel(tier.tier)} arrow>
                <ToggleButton
                  value={String(tier.threshold)}
                  sx={{
                    color: TIER_COLORS[tier.tier],
                    '&.Mui-selected': {
                      bgcolor: TIER_BG[tier.tier],
                      color: TIER_COLORS[tier.tier],
                      fontWeight: 700,
                      '&:hover': { bgcolor: TIER_BG[tier.tier] },
                    },
                  }}
                >
                  {tier.threshold}
                </ToggleButton>
              </Tooltip>
            ))}
          </ToggleButtonGroup>
        )}
      </Box>
    </Stack>
  );
};

const AdminMemberAchievements: React.FC<Props> = ({ iDiscGolfId }) => {
  const { t } = useTranslation();
  const [year] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<AdminMemberAchievement[]>([]);

  useEffect(() => {
    let cancelled = false;
    membersApi
      .getAdminMemberAchievements(iDiscGolfId, year)
      .then((res) => {
        if (!cancelled) setAchievements(res.data.achievements);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setError(t('admin.members.achievements.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [iDiscGolfId, year, t]);

  const handleChange = async (key: string, progress: number) => {
    try {
      const res = await membersApi.setAdminMemberAchievement(iDiscGolfId, key, { progress, year });
      setAchievements((prev) =>
        prev.map((a) => (a.key === res.data.key ? res.data : a)),
      );
    } catch (e) {
      console.error(e);
      setError(t('admin.members.achievements.saveError'));
    }
  };

  const manual = achievements.filter((a) => a.manual);

  return (
    <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mb: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {t('admin.members.achievements.title')}
        </Typography>
        <Chip
          size="small"
          label={t('admin.members.achievements.season', { year })}
          sx={{ height: 20, fontSize: '0.7rem' }}
        />
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {t('admin.members.achievements.subtitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          <Stack divider={<Box sx={{ borderTop: '1px solid', borderColor: 'divider' }} />}>
            {manual.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                {t('admin.members.achievements.noManual')}
              </Typography>
            ) : (
              manual.map((a) => <ManualRow key={a.key} ach={a} onChange={handleChange} />)
            )}
          </Stack>
        </>
      )}
    </Paper>
  );
};

export default AdminMemberAchievements;
