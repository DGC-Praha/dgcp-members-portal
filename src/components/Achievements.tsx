import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tooltip,
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
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';

// --- Twemoji CDN helper ---
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

function twemoji(emoji: string): string {
  const codePoint = [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== 'fe0f')
    .join('-');
  return `${TWEMOJI_BASE}/${codePoint}.svg`;
}

// --- Tier colors ---
const TIER_COLORS: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#9ca3af',
  gold: '#f59e0b',
  diamond: '#7c3aed',
  legend: '#dc2626',
};

const TIER_BG: Record<string, string> = {
  bronze: '#f5e6d3',
  silver: '#f3f4f6',
  gold: '#fef9c3',
  diamond: '#f5f3ff',
  legend: '#fee2e2',
};

const TIER_GLOW: Record<string, string> = {
  gold: '0 0 8px rgba(245, 158, 11, 0.4)',
  diamond: '0 0 10px rgba(124, 58, 237, 0.45)',
  legend: '0 0 12px rgba(220, 38, 38, 0.5)',
};

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
  tiers: AchievementTier[];
}

// --- Achievement descriptions (frontend i18n) ---
const ACHIEVEMENT_DESCRIPTIONS: Record<string, string> = {
  tournaments_played: 'Počet odehraných turnajů s finalizovanými výsledky v daném roce.',
  podium: 'Top 3 umístění v tvé divizi na turnaji.',
  tag_tournament: 'Výměny tagů na turnaji v rámci klubu.',
  casual_exchanges: 'Casualové výměny tagů v rámci klubu.',
  regions_visited: 'Počet různých krajů, kde jsi hrál turnaj.',
  above_rating: 'Nejlepší kolo nad tvůj PDGA rating. Pouze PDGA turnaje.',
  below_rating: 'Kolo 50+ bodů pod tvým PDGA ratingem.',
  ace: 'Hoď hole-in-one na turnaji.',
  snowman: 'Zahraj jamku za 8 nebo více.',
  jamkovka: 'Účast v jamkovce (ace liga).',
  handicap_liga: 'Účast v handicap lize.',
};

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

const ArcBadge: React.FC<{
  emoji: string;
  name: string;
  progress: number;
  threshold: number;
  earned: boolean;
  bgColor: string;
  ringColor: string;
  tier: string;
}> = ({ emoji, name, progress, threshold, earned, bgColor, ringColor, tier }) => {
  const pct = earned ? 100 : Math.min((progress / threshold) * 100, 100);
  const glow = earned ? TIER_GLOW[tier] : undefined;

  const tooltipContent = earned ? (
    <Typography variant="body2" sx={{ fontWeight: 700 }}>{name}</Typography>
  ) : (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{name}</Typography>
      <Typography variant="caption" sx={{ opacity: 0.8 }}>{progress} / {threshold}</Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Box
        sx={{
          position: 'relative',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: earned
            ? `conic-gradient(${ringColor} 0% 100%, #e0e0e0 100% 100%)`
            : pct > 0
              ? `conic-gradient(${ringColor} 0% ${pct}%, #e0e0e0 ${pct}% 100%)`
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
          ...(!earned && pct > 0 && {
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
            filter: earned ? 'none' : pct > 0 ? 'none' : 'grayscale(1) brightness(0.9)',
            opacity: earned ? 1 : pct > 0 ? 0.7 : 0.3,
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
    </Tooltip>
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
          const desc = ACHIEVEMENT_DESCRIPTIONS[ach.key] ?? '';
          const singleTier = ach.tiers.length === 1;

          return (
            <Box key={ach.key} sx={{ mb: 3, '&:last-child': { mb: 0 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <img src={twemoji(ach.emoji)} alt={ach.name} width={28} height={28} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {ach.name}
                  </Typography>
                  {desc && (
                    <Typography variant="caption" color="text.secondary">
                      {desc}
                    </Typography>
                  )}
                </Box>
              </Box>

              {!singleTier ? (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', ml: 5.5 }}>
                  {ach.tiers.map((t) => (
                    <Chip
                      key={t.tier}
                      label={`${t.tier.charAt(0).toUpperCase() + t.tier.slice(1)}: ${t.threshold}`}
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
    api.getPlayerAchievements(iDiscGolfId)
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

  // Flatten all tiers into badges
  const badges: Array<{
    key: string;
    emoji: string;
    name: string;
    progress: number;
    threshold: number;
    earned: boolean;
    bgColor: string;
    ringColor: string;
    tier: string;
  }> = [];

  for (const ach of achievements) {
    const bgColor = ACHIEVEMENT_BG[ach.key] ?? '#f5f5f5';
    const singleTier = ach.tiers.length === 1;
    let foundNextTier = false;
    for (const t of ach.tiers) {
      const isNextTier = !t.earned && !foundNextTier;
      if (isNextTier) foundNextTier = true;
      badges.push({
        key: `${ach.key}_${t.tier}`,
        emoji: ach.emoji,
        name: singleTier ? ach.name : `${ach.name} — ${t.tier.charAt(0).toUpperCase() + t.tier.slice(1)}`,
        progress: t.earned ? t.threshold : isNextTier ? t.progress : 0,
        threshold: t.threshold,
        earned: t.earned,
        bgColor,
        ringColor: singleTier ? '#1565c0' : (TIER_COLORS[t.tier] ?? '#9ca3af'),
        tier: t.tier,
      });
    }
  }

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
            progress={b.progress}
            threshold={b.threshold}
            tier={b.tier}
            ringColor={b.ringColor}
            bgColor={b.bgColor}
            earned={b.earned}
          />
        ))}
      </Box>

      <AchievementDetailModal
        achievements={achievements}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  );
};

export default Achievements;
