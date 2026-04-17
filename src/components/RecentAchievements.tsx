import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Skeleton,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';

interface AchievementItem {
  id: number;
  achievementName: string;
  achievementEmoji: string;
  tier: string;
  year: number;
  earnedAt: string;
  memberName: string;
  memberIDiscGolfId: number;
}

const RecentAchievements: React.FC = () => {
  const [items, setItems] = useState<AchievementItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await api.getRecentAchievements(p);
      setItems(res.data.items);
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  if (loading && items.length === 0) {
    return (
      <Box>
        <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
          {t('home.recentAchievements')}
        </Typography>
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={48} sx={{ mt: 1 }} />
        <Skeleton variant="rounded" height={48} sx={{ mt: 1 }} />
      </Box>
    );
  }

  if (items.length === 0) return null;

  return (
    <Box>
      <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
        {t('home.recentAchievements')}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {items.map((a) => (
          <Box
            key={a.id}
            onClick={() => navigate(`/clenove/${a.memberIDiscGolfId}`)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 1,
              borderRadius: 1.5,
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Typography sx={{ fontSize: '1.4rem', minWidth: 32, textAlign: 'center', flexShrink: 0 }}>
              {a.achievementEmoji || '🏆'}
            </Typography>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3 }} noWrap>
                  {a.achievementName}
                </Typography>
                <Chip label={a.tier} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {a.memberName} · {new Date(a.earnedAt).toLocaleDateString('cs-CZ')}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 1.5 }}>
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            disabled={page <= 1 || loading}
            onClick={() => load(page - 1)}
          >
            {t('home.previousPage')}
          </Button>
          <Typography variant="caption" color="text.secondary">
            {page} / {totalPages}
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForwardIcon />}
            disabled={page >= totalPages || loading}
            onClick={() => load(page + 1)}
          >
            {t('home.nextPage')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RecentAchievements;
