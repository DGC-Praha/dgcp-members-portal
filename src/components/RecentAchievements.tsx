import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  Skeleton,
  Typography,
} from '@mui/material';
import { membersApi } from '../api/client';
import { useTranslation } from 'react-i18next';
import BadgeTooltip from './achievements/BadgeTooltip';
import AchievementBadge from './achievements/AchievementBadge';
import { TIER_COLORS, tierLabel } from './achievements/shared';
import { formatDate } from '../i18n/format';

interface AchievementItem {
  id: number;
  achievementName: string;
  achievementEmoji: string;
  achievementDescription?: string;
  tier: string;
  threshold: number | null;
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

  // Ref guard prevents a double-click race where two loads fire before React
  // batches the `loading` state update and hides the button.
  const loadingRef = useRef(false);
  const load = useCallback(async (p: number, append: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await membersApi.getRecentAchievements(p);
      setItems((prev) => (append ? [...prev, ...res.data.items] : res.data.items));
      setTotalPages(res.data.totalPages);
      setPage(res.data.page);
    } catch {
      // non-critical
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1, false);
  }, [load]);

  if (loading && items.length === 0) {
    return (
      <Box>
        <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
          {t('home.recentAchievements')}
        </Typography>
        {[1, 2, 3].map((i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 0.75 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={18} />
              <Skeleton variant="text" width="40%" height={14} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  if (items.length === 0) return null;

  return (
    <Box>
      <Typography variant="overline" sx={{ mb: 1.5, display: 'block', letterSpacing: 1.5, color: 'text.secondary' }}>
        {t('home.recentAchievements')}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
        {items.map((a) => {
          const tierColor = TIER_COLORS[a.tier] ?? '#9ca3af';

          return (
            <Box
              key={a.id}
              onClick={() => navigate(`/clenove/${a.memberIDiscGolfId}`)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 0.75,
                px: 1,
                borderRadius: 1.5,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box onClick={(e) => e.stopPropagation()}>
                <BadgeTooltip
                  emoji={a.achievementEmoji || '🏆'}
                  name={a.achievementName}
                  tier={a.tier}
                  threshold={a.threshold ?? 0}
                  description={a.achievementDescription}
                  earned
                  earnedAt={a.earnedAt}
                >
                  <Box>
                    <AchievementBadge emoji={a.achievementEmoji || '🏆'} tier={a.tier} />
                  </Box>
                </BadgeTooltip>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', lineHeight: 1.3 }} noWrap>
                    {a.achievementName}
                    {a.threshold !== null && (
                      <Typography component="span" sx={{ fontWeight: 400, fontSize: '0.75rem', color: 'text.secondary' }}>
                        {' '}({a.threshold})
                      </Typography>
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      color: tierColor,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    {tierLabel(a.tier)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {a.memberName} · {formatDate(a.earnedAt)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      {page < totalPages && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
          <Button
            variant="text"
            size="medium"
            disabled={loading}
            onClick={() => load(page + 1, true)}
            sx={{ minHeight: 44, textTransform: 'none', fontSize: '0.85rem' }}
            startIcon={loading ? <CircularProgress size={16} /> : null}
          >
            {t('common.loadMore')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RecentAchievements;
