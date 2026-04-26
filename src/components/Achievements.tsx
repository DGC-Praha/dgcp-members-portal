import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  alpha,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { membersApi } from '../api/client';
import { useTranslation } from 'react-i18next';
import BadgeTooltip from './achievements/BadgeTooltip';
import AchievementBadge from './achievements/AchievementBadge';
import { TIER_BG, TIER_COLORS, TIER_GLOW, tierLabel, twemoji } from './achievements/shared';
import { formatDate } from '../i18n/format';

// --- Types from API ---
interface AchievementTier {
  tier: string;
  threshold: number;
  progress: number;
  earned: boolean;
  earnedAt: string | null;
}

interface Achievement {
  key: string;
  name: string;
  emoji: string;
  description: string;
  tiers: AchievementTier[];
}

// Subtle background tint per achievement key — purely decorative, kept in FE.
const ACHIEVEMENT_BG: Record<string, string> = {
  tournaments_played: '#eff6ff',
  podium: '#fff7ed',
  tag_tournament: '#ecfdf5',
  casual_exchanges: '#eef2ff',
  regions_visited: '#ecfeff',
  above_rating: '#f5f3ff',
  below_rating: '#fef2f2',
  ace: '#fffbeb',
  snowman: '#f0f9ff',
  jamkovka: '#f0fdf4',
  handicap_liga: '#eef2ff',
};

// --- Badge with circular arc progress ---

type ArcBadgeProps = {
  emoji: string;
  name: string;
  description: string;
  tier: string;
  threshold: number;
  progress: number;
  earned: boolean;
  earnedAt: string | null;
  bgColor: string;
  ringColor: string;
  nextTier: { tier: string; threshold: number } | null;
  // Only the very next unearned tier animates its arc to avoid every locked
  // badge looking "almost full" once progress exceeds a lower threshold.
  showArcProgress: boolean;
};

const ArcBadge: React.FC<ArcBadgeProps> = ({
  emoji,
  name,
  description,
  tier,
  threshold,
  progress,
  earned,
  earnedAt,
  bgColor,
  ringColor,
  nextTier,
  showArcProgress,
}) => {
  const arcPct = earned
    ? 100
    : showArcProgress
      ? Math.min((progress / threshold) * 100, 100)
      : 0;
  const glow = earned ? TIER_GLOW[tier] : undefined;

  return (
    <BadgeTooltip
      emoji={emoji}
      name={name}
      tier={tier}
      threshold={threshold}
      description={description}
      earned={earned}
      earnedAt={earnedAt}
      progress={progress}
      nextTier={nextTier}
    >
      <Box
        sx={{
          position: 'relative',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: earned
            ? `conic-gradient(${ringColor} 0% 100%, #e0e0e0 100% 100%)`
            : showArcProgress
              ? `conic-gradient(${ringColor} 0% ${arcPct}%, #e0e0e0 ${arcPct}% 100%)`
              : '#e0e0e0',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default',
          ...(glow && { boxShadow: glow }),
          ...(earned && {
            '&:hover': {
              transform: 'scale(1.15) translateY(-2px)',
              boxShadow: `0 6px 20px ${alpha(ringColor, 0.4)}`,
            },
          }),
          ...(!earned && showArcProgress && {
            '&:hover': {
              transform: 'scale(1.1)',
            },
          }),
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '3px',
            left: '3px',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            bgcolor: earned ? bgColor : '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            filter: earned ? 'none' : showArcProgress && progress > 0 ? 'none' : 'grayscale(1) brightness(0.9)',
            opacity: earned ? 1 : showArcProgress && progress > 0 ? 0.7 : 0.3,
          }}
        >
          <img
            src={twemoji(emoji)}
            alt={name}
            width={22}
            height={22}
            style={{ pointerEvents: 'none' }}
          />
        </Box>
      </Box>
    </BadgeTooltip>
  );
};

// --- Achievement Detail Modal ---

const AchievementDetailModal: React.FC<{
  achievements: Achievement[];
  open: boolean;
  onClose: () => void;
}> = ({ achievements, open, onClose }) => {
  const { t: tr } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{tr('playerCard.achievements')}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {achievements.map((ach) => {
          const singleTier = ach.tiers.length === 1;

          return (
            <Box key={ach.key} sx={{ mb: 3, '&:last-child': { mb: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <img src={twemoji(ach.emoji)} alt={ach.name} width={28} height={28} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {ach.name}
                  </Typography>
                  {ach.description && (
                    <Typography variant="caption" color="text.secondary">
                      {ach.description}
                    </Typography>
                  )}
                </Box>
              </Box>

              {!singleTier ? (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', ml: 5.5 }}>
                  {ach.tiers.map((t) => (
                    <Chip
                      key={t.tier}
                      label={`${tierLabel(t.tier)}: ${t.threshold}`}
                      size="small"
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: t.earned ? (TIER_BG[t.tier] ?? '#f5f5f5') : '#f5f5f5',
                        color: t.earned ? (TIER_COLORS[t.tier] ?? '#666') : '#999',
                        border: t.earned ? `1.5px solid ${TIER_COLORS[t.tier] ?? '#ccc'}` : '1.5px solid #e0e0e0',
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Box sx={{ ml: 5.5 }}>
                  <Chip
                    label={ach.tiers[0].earned ? '✓ Earned' : `${ach.tiers[0].progress} / ${ach.tiers[0].threshold}`}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: ach.tiers[0].earned ? '#e8f5e9' : '#f5f5f5',
                      color: ach.tiers[0].earned ? '#2e7d32' : '#999',
                    }}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </DialogContent>
    </Dialog>
  );
};

// --- Main Component ---

interface AchievementsProps {
  iDiscGolfId: number;
  title?: string;
}

const Achievements: React.FC<AchievementsProps> = ({ iDiscGolfId, title }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    membersApi.getPlayerAchievements(iDiscGolfId)
      .then((res) => setAchievements(res.data.achievements))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [iDiscGolfId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="circular" width={48} height={48} />
        ))}
      </Box>
    );
  }

  if (achievements.length === 0) return null;

  // Flatten all tiers into badges, carrying the next (not-yet-earned) tier so the
  // tooltip can hint at what's next for already-earned badges.
  const badges: Array<{
    key: string;
    emoji: string;
    name: string;
    description: string;
    progress: number;
    threshold: number;
    earned: boolean;
    earnedAt: string | null;
    bgColor: string;
    ringColor: string;
    tier: string;
    nextTier: { tier: string; threshold: number } | null;
    showArcProgress: boolean;
  }> = [];

  for (const ach of achievements) {
    const bgColor = ACHIEVEMENT_BG[ach.key] ?? '#f5f5f5';
    const singleTier = ach.tiers.length === 1;
    let foundNextTier = false;
    for (let i = 0; i < ach.tiers.length; i++) {
      const t = ach.tiers[i];
      const isNextTier = !t.earned && !foundNextTier;
      if (isNextTier) foundNextTier = true;

      let badgeNextTier: { tier: string; threshold: number } | null = null;
      if (t.earned) {
        const upcoming = ach.tiers[i + 1];
        if (upcoming && !upcoming.earned) {
          badgeNextTier = { tier: upcoming.tier, threshold: upcoming.threshold };
        }
      }

      badges.push({
        key: `${ach.key}_${t.tier}`,
        emoji: ach.emoji,
        name: singleTier ? ach.name : `${ach.name} — ${tierLabel(t.tier)}`,
        description: ach.description,
        progress: t.earned ? t.threshold : t.progress,
        threshold: t.threshold,
        earned: t.earned,
        earnedAt: t.earnedAt,
        bgColor,
        ringColor: TIER_COLORS[t.tier] ?? '#9ca3af',
        tier: t.tier,
        nextTier: badgeNextTier,
        showArcProgress: isNextTier,
      });
    }
  }

  // Build earned timeline from existing data (no extra API call)
  const timeline: Array<{
    key: string;
    emoji: string;
    name: string;
    tier: string;
    threshold: number;
    earnedAt: string;
  }> = [];

  for (const ach of achievements) {
    for (const t of ach.tiers) {
      if (t.earned && t.earnedAt) {
        timeline.push({
          key: `${ach.key}_${t.tier}`,
          emoji: ach.emoji,
          name: ach.name,
          tier: t.tier,
          threshold: t.threshold,
          earnedAt: t.earnedAt,
        });
      }
    }
  }

  timeline.sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime());

  return (
    <Box>
      {title && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="overline" sx={{ letterSpacing: 1.5, color: 'text.secondary' }}>
            {title}
          </Typography>
          <IconButton size="small" onClick={() => setModalOpen(true)} sx={{ color: 'text.disabled', '&:hover': { color: 'primary.main' } }}>
            <InfoOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {badges.map((b) => (
          <ArcBadge
            key={b.key}
            emoji={b.emoji}
            name={b.name}
            description={b.description}
            progress={b.progress}
            threshold={b.threshold}
            tier={b.tier}
            ringColor={b.ringColor}
            bgColor={b.bgColor}
            earned={b.earned}
            earnedAt={b.earnedAt}
            nextTier={b.nextTier}
            showArcProgress={b.showArcProgress}
          />
        ))}
      </Box>

      {/* Earned timeline */}
      {timeline.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {timeline.map((item) => {
            const ringColor = TIER_COLORS[item.tier] ?? '#9ca3af';

            return (
              <Box
                key={item.key}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 0.5,
                  px: 0.5,
                  borderRadius: 1,
                }}
              >
                <AchievementBadge emoji={item.emoji} tier={item.tier} size={28} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }} noWrap>
                      {item.name}
                      <Typography component="span" sx={{ fontWeight: 400, fontSize: '0.7rem', color: 'text.secondary' }}>
                        {' '}({item.threshold})
                      </Typography>
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        color: ringColor,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        flexShrink: 0,
                      }}
                    >
                      {tierLabel(item.tier)}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {formatDate(item.earnedAt)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <AchievementDetailModal
        achievements={achievements}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  );
};

export default Achievements;
