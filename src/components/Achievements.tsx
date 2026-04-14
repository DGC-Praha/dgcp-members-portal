import React, { useEffect, useState } from 'react';
import { Box, Typography, Tooltip, alpha, LinearProgress, Skeleton } from '@mui/material';
import { api } from '../api/client';

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

// --- Components ---

interface AchievementsProps {
  iDiscGolfId: number;
}

const Badge: React.FC<{
  emoji: string;
  name: string;
  requirement: string;
  ringColor: string;
  bgColor: string;
  earned: boolean;
}> = ({ emoji, name, requirement, ringColor, bgColor, earned }) => (
  <Tooltip
    title={
      <Box sx={{ textAlign: 'center', p: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{name}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>{requirement}</Typography>
      </Box>
    }
    arrow
    placement="top"
  >
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: earned ? bgColor : '#f5f5f5',
        border: '2.5px solid',
        borderColor: earned ? ringColor : '#e0e0e0',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        filter: earned ? 'none' : 'grayscale(1) brightness(0.9)',
        opacity: earned ? 1 : 0.3,
        ...(earned && {
          boxShadow: `0 2px 8px ${alpha(ringColor, 0.3)}`,
          '&:hover': {
            transform: 'scale(1.18) translateY(-2px)',
            boxShadow: `0 6px 20px ${alpha(ringColor, 0.45)}`,
          },
        }),
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
  </Tooltip>
);

// Map achievement key to a soft background color
const ACHIEVEMENT_BG: Record<string, string> = {
  tournaments_played: '#eff6ff',
  podium: '#fff7ed',
  tag_tournament: '#ecfdf5',
  casual_exchanges: '#eef2ff',
  regions_visited: '#ecfeff',
};

const Achievements: React.FC<AchievementsProps> = ({ iDiscGolfId }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

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
          <Skeleton key={i} variant="circular" width={44} height={44} />
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
    tier: string;
    threshold: number;
    progress: number;
    earned: boolean;
    bgColor: string;
    ringColor: string;
  }> = [];

  for (const ach of achievements) {
    const bgColor = ACHIEVEMENT_BG[ach.key] ?? '#f5f5f5';
    const singleTier = ach.tiers.length === 1;
    for (const t of ach.tiers) {
      badges.push({
        key: `${ach.key}_${t.tier}`,
        emoji: ach.emoji,
        name: singleTier ? ach.name : `${ach.name} — ${t.tier.charAt(0).toUpperCase() + t.tier.slice(1)}`,
        tier: t.tier,
        threshold: t.threshold,
        progress: t.progress,
        earned: t.earned,
        bgColor,
        ringColor: singleTier ? '#1565c0' : (TIER_COLORS[t.tier] ?? '#9ca3af'),
      });
    }
  }

  // Find the next unearned tier to show progress for
  const nextGoal = achievements
    .map((ach) => {
      const nextTier = ach.tiers.find((t) => !t.earned);
      if (!nextTier) return null;
      const singleTier = ach.tiers.length === 1;
      return { name: ach.name, emoji: ach.emoji, progress: nextTier.progress, threshold: nextTier.threshold, tier: singleTier ? null : nextTier.tier };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.progress / b!.threshold) - (a!.progress / a!.threshold))
    [0];

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {badges.map((b) => (
          <Badge
            key={b.key}
            emoji={b.emoji}
            name={b.name}
            requirement={`${b.progress} / ${b.threshold}`}
            ringColor={b.ringColor}
            bgColor={b.bgColor}
            earned={b.earned}
          />
        ))}
      </Box>

      {nextGoal && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {nextGoal.emoji} {nextGoal.name}{nextGoal.tier ? ` — ${nextGoal.tier}` : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {nextGoal.progress}/{nextGoal.threshold}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min((nextGoal.progress / nextGoal.threshold) * 100, 100)}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: '#f0f0f0',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                bgcolor: nextGoal.tier ? (TIER_COLORS[nextGoal.tier] ?? '#9ca3af') : '#1565c0',
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

export default Achievements;
