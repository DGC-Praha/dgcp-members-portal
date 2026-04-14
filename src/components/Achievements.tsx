import React from 'react';
import { Box, Typography, Tooltip, alpha } from '@mui/material';

// --- Twemoji CDN helper ---
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

function twemoji(emoji: string): string {
  const codePoint = [...emoji]
    .map((c) => c.codePointAt(0)!.toString(16))
    .filter((cp) => cp !== 'fe0f')
    .join('-');
  return `${TWEMOJI_BASE}/${codePoint}.svg`;
}

// --- Tier system ---

interface Tier {
  level: number;
  name: string;
  requirement: string;
  ringColor: string;
}

interface AchievementDef {
  id: string;
  emoji: string;
  color: string;
  bgColor: string;
  tiers: Tier[];
}

const BRONZE = '#cd7f32';
const SILVER = '#9ca3af';
const GOLD = '#f59e0b';
const DIAMOND = '#7c3aed';
const LEGEND = '#dc2626';

const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'tournaments',
    emoji: '🥏',
    color: '#2563eb',
    bgColor: '#eff6ff',
    tiers: [
      { level: 1, name: 'First Tee', requirement: '1 turnaj', ringColor: BRONZE },
      { level: 2, name: 'Weekend Warrior', requirement: '5 turnajů', ringColor: SILVER },
      { level: 3, name: 'Card Shark', requirement: '15 turnajů', ringColor: GOLD },
      { level: 4, name: 'Tour Pro', requirement: '30 turnajů', ringColor: DIAMOND },
    ],
  },
  {
    id: 'podium',
    emoji: '🏅',
    color: '#ea580c',
    bgColor: '#fff7ed',
    tiers: [
      { level: 1, name: 'On The Box', requirement: '1× top 3', ringColor: BRONZE },
      { level: 2, name: 'Medal Collector', requirement: '3× top 3', ringColor: SILVER },
      { level: 3, name: 'Podium Machine', requirement: '10× top 3', ringColor: GOLD },
    ],
  },
  {
    id: 'tag_tournament',
    emoji: '⚔️',
    color: '#059669',
    bgColor: '#ecfdf5',
    tiers: [
      { level: 1, name: 'Tag Rookie', requirement: '1 turnajová výměna', ringColor: BRONZE },
      { level: 2, name: 'Tag Contender', requirement: '5 turnajových výměn', ringColor: SILVER },
      { level: 3, name: 'Tag Slinger', requirement: '10 turnajových výměn', ringColor: GOLD },
      { level: 4, name: 'Tag Titan', requirement: '20 turnajových výměn', ringColor: DIAMOND },
    ],
  },
  {
    id: 'above_rating',
    emoji: '🚀',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    tiers: [
      { level: 1, name: 'Hot Round', requirement: '10 nad rating', ringColor: BRONZE },
      { level: 2, name: 'Crusher', requirement: '30 nad rating', ringColor: SILVER },
      { level: 3, name: 'Beast Mode', requirement: '50 nad rating', ringColor: GOLD },
      { level: 4, name: 'Untouchable', requirement: '100 nad rating', ringColor: DIAMOND },
    ],
  },
  {
    id: 'regions',
    emoji: '🗺️',
    color: '#0891b2',
    bgColor: '#ecfeff',
    tiers: [
      { level: 1, name: 'Road Tripper', requirement: '2 kraje', ringColor: BRONZE },
      { level: 2, name: 'Explorer', requirement: '5 krajů', ringColor: SILVER },
      { level: 3, name: 'Nomad', requirement: '8 krajů', ringColor: GOLD },
      { level: 4, name: 'Globetrotter', requirement: '10 krajů', ringColor: DIAMOND },
      { level: 5, name: 'Česko znám', requirement: '14 krajů', ringColor: LEGEND },
    ],
  },
  {
    id: 'casual_exchanges',
    emoji: '🤝',
    color: '#6366f1',
    bgColor: '#eef2ff',
    tiers: [
      { level: 1, name: 'Park Player', requirement: '1 casualová výměna', ringColor: BRONZE },
      { level: 2, name: 'Casual Regular', requirement: '10 casualových výměn', ringColor: SILVER },
      { level: 3, name: 'Casual Addict', requirement: '30 casualových výměn', ringColor: GOLD },
      { level: 4, name: 'Disc Golf Lifestyle', requirement: '50 casualových výměn', ringColor: DIAMOND },
    ],
  },
  {
    id: 'jamkovka',
    emoji: '🎯',
    color: '#2e7d32',
    bgColor: '#f0fdf4',
    tiers: [
      { level: 1, name: 'Ace Chaser', requirement: 'Hraj jamkovku', ringColor: GOLD },
    ],
  },
  {
    id: 'handicap_liga',
    emoji: '📈',
    color: '#5c6bc0',
    bgColor: '#eef2ff',
    tiers: [
      { level: 1, name: 'Leveling Up', requirement: 'Hraj handicap ligu', ringColor: GOLD },
    ],
  },
  {
    id: 'below_rating',
    emoji: '🚂',
    color: '#dc2626',
    bgColor: '#fef2f2',
    tiers: [
      { level: 1, name: 'Bogey Train', requirement: 'Zahraj 50 pod rating', ringColor: BRONZE },
    ],
  },
  {
    id: 'ace',
    emoji: '🕳️',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    tiers: [
      { level: 1, name: 'Ace!', requirement: 'Hoď hole-in-one', ringColor: DIAMOND },
    ],
  },
  {
    id: 'snowman',
    emoji: '⛄',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    tiers: [
      { level: 1, name: 'Snowman', requirement: 'Zahraj jamku za 8', ringColor: BRONZE },
    ],
  },
];

// --- Flatten all tiers into individual badges ---

interface FlatBadge {
  key: string;
  emoji: string;
  name: string;
  requirement: string;
  bgColor: string;
  ringColor: string;
  earned: boolean;
}

function buildBadgeGrid(iDiscGolfId: number): FlatBadge[] {
  const earnedMap: Record<number, Record<string, number>> = {
    8460: {
      tournaments: 4,
      podium: 2,
      tag_tournament: 3,
      above_rating: 3,
      regions: 3,
      casual_exchanges: 4,
      jamkovka: 1,
      handicap_liga: 1,
      below_rating: 1,
      snowman: 1,
    },
  };

  const playerMap = earnedMap[iDiscGolfId] ?? { tournaments: 1 };
  const badges: FlatBadge[] = [];

  for (const def of ACHIEVEMENTS) {
    const earnedLevel = playerMap[def.id] ?? 0;
    for (const tier of def.tiers) {
      badges.push({
        key: `${def.id}_${tier.level}`,
        emoji: def.emoji,
        name: tier.name,
        requirement: tier.requirement,
        bgColor: def.bgColor,
        ringColor: tier.ringColor,
        earned: tier.level <= earnedLevel,
      });
    }
  }

  return badges;
}

// --- Components ---

interface AchievementsProps {
  iDiscGolfId: number;
}

const Badge: React.FC<{ badge: FlatBadge }> = ({ badge }) => (
  <Tooltip
    title={
      <Box sx={{ textAlign: 'center', p: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>{badge.name}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>{badge.requirement}</Typography>
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
        bgcolor: badge.earned ? badge.bgColor : '#f5f5f5',
        border: '2.5px solid',
        borderColor: badge.earned ? badge.ringColor : '#e0e0e0',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        filter: badge.earned ? 'none' : 'grayscale(1) brightness(0.9)',
        opacity: badge.earned ? 1 : 0.3,
        ...(badge.earned && {
          boxShadow: `0 2px 8px ${alpha(badge.ringColor, 0.3)}`,
          '&:hover': {
            transform: 'scale(1.18) translateY(-2px)',
            boxShadow: `0 6px 20px ${alpha(badge.ringColor, 0.45)}`,
          },
        }),
      }}
    >
      <img
        src={twemoji(badge.emoji)}
        alt={badge.name}
        width={22}
        height={22}
        style={{ pointerEvents: 'none' }}
      />
    </Box>
  </Tooltip>
);

const Achievements: React.FC<AchievementsProps> = ({ iDiscGolfId }) => {
  const badges = buildBadgeGrid(iDiscGolfId);

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {badges.map((b) => (
        <Badge key={b.key} badge={b} />
      ))}
    </Box>
  );
};

export default Achievements;
