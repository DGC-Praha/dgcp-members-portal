import React from 'react';
import { Box, LinearProgress, Tooltip, Typography, alpha } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { TIER_COLORS, tierLabel, twemoji } from './shared';

type NextTier = {
  tier: string;
  threshold: number;
};

export type BadgeTooltipProps = {
  children: React.ReactElement;
  emoji: string;
  name: string;
  tier: string;
  threshold: number;
  description?: string;
  earned: boolean;
  earnedAt?: string | null;
  progress?: number;
  nextTier?: NextTier | null;
};

const BadgeTooltip: React.FC<BadgeTooltipProps> = ({
  children,
  emoji,
  name,
  tier,
  threshold,
  description,
  earned,
  earnedAt,
  progress,
  nextTier,
}) => {
  const ringColor = TIER_COLORS[tier] ?? '#9ca3af';
  const pct =
    !earned && typeof progress === 'number' && threshold > 0
      ? Math.min(100, Math.round((progress / threshold) * 100))
      : 0;
  const remaining =
    !earned && typeof progress === 'number' ? Math.max(0, threshold - progress) : 0;

  const title = (
    <Box sx={{ minWidth: 220, maxWidth: 260, p: 0.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <img src={twemoji(emoji)} alt="" width={22} height={22} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
            {name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: ringColor,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.65rem',
            }}
          >
            {tierLabel(tier)} · {threshold}
          </Typography>
        </Box>
        {earned && (
          <CheckCircleIcon sx={{ color: ringColor, fontSize: 18 }} />
        )}
      </Box>

      {description && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.75, opacity: 0.85, lineHeight: 1.35 }}>
          {description}
        </Typography>
      )}

      {earned && earnedAt && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.75, fontStyle: 'italic', opacity: 0.75 }}>
          Získáno {new Date(earnedAt).toLocaleDateString('cs-CZ')}
        </Typography>
      )}

      {!earned && typeof progress === 'number' && (
        <Box sx={{ mt: 0.75 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {progress} / {threshold}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {pct}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: alpha(ringColor, 0.2),
              '& .MuiLinearProgress-bar': { backgroundColor: ringColor },
            }}
          />
          {remaining > 0 && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.8 }}>
              Zbývá {remaining} do zisku.
            </Typography>
          )}
        </Box>
      )}

      {earned && nextTier && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.75, opacity: 0.8 }}>
          Další stupeň: <b>{tierLabel(nextTier.tier)}</b> na {nextTier.threshold}.
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip
      title={title}
      arrow
      placement="top"
      enterTouchDelay={0}
      leaveTouchDelay={4000}
      slotProps={{
        tooltip: {
          sx: {
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 3,
            p: 1.25,
          },
        },
        arrow: {
          sx: { color: 'background.paper', '&::before': { border: '1px solid', borderColor: 'divider' } },
        },
      }}
    >
      {children}
    </Tooltip>
  );
};

export default BadgeTooltip;
