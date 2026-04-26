import React from 'react';
import { Box } from '@mui/material';
import { TIER_BG, TIER_COLORS, TIER_GLOW, twemoji } from './shared';

/**
 * Static tier-coloured medal: outer ring tinted by tier, inner circle filled
 * by the tier's pastel, twemoji centred. Use whenever a non-interactive
 * representation of an earned tier is needed (timeline rows, leaderboard
 * cells, recent-achievement feed). For player-progress badges with progress
 * arcs and hover effects, see ArcBadge in Achievements.tsx.
 */
const AchievementBadge: React.FC<{ emoji: string; tier: string; size?: number }> = ({
  emoji,
  tier,
  size = 40,
}) => {
  const ringColor = TIER_COLORS[tier] ?? '#9ca3af';
  const bgColor = TIER_BG[tier] ?? '#f5f5f5';
  const glow = TIER_GLOW[tier];
  const innerSize = size - 5;
  const iconSize = Math.round(size * 0.45);

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        background: ringColor,
        flexShrink: 0,
        ...(glow && { boxShadow: glow }),
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '2.5px',
          left: '2.5px',
          width: innerSize,
          height: innerSize,
          borderRadius: '50%',
          bgcolor: bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={twemoji(emoji)}
          alt=""
          width={iconSize}
          height={iconSize}
          style={{ pointerEvents: 'none' }}
        />
      </Box>
    </Box>
  );
};

export default AchievementBadge;
