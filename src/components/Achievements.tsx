import React from 'react';
import { Box, Typography, Tooltip, alpha } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsIcon from '@mui/icons-material/Groups';
import ExploreIcon from '@mui/icons-material/Explore';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AdjustIcon from '@mui/icons-material/Adjust';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import Filter8Icon from '@mui/icons-material/Filter8';

// --- Tier system ---

interface Tier {
  level: number;
  name: string;
  requirement: string;
  ringColor: string;
}

interface AchievementDef {
  id: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  tiers: Tier[];
}

interface EarnedAchievement {
  def: AchievementDef;
  tier: Tier;
}

// Tier ring colors
const BRONZE = '#cd7f32';
const SILVER = '#9ca3af';
const GOLD = '#f59e0b';
const DIAMOND = '#7c3aed';
const LEGEND = '#dc2626';

const ACHIEVEMENTS: AchievementDef[] = [
  // --- Hraj na turnaji ---
  {
    id: 'tournaments',
    icon: <StarIcon />,
    color: '#f59e0b',
    bgColor: '#fef3c7',
    tiers: [
      { level: 1, name: 'First Tee', requirement: '1 turnaj', ringColor: BRONZE },
      { level: 2, name: 'Weekend Warrior', requirement: '5 turnajů', ringColor: SILVER },
      { level: 3, name: 'Card Shark', requirement: '15 turnajů', ringColor: GOLD },
      { level: 4, name: 'Tour Pro', requirement: '30 turnajů', ringColor: DIAMOND },
    ],
  },
  // --- Podium (top 3) ---
  {
    id: 'podium',
    icon: <EmojiEventsIcon />,
    color: '#ea580c',
    bgColor: '#fff7ed',
    tiers: [
      { level: 1, name: 'On The Box', requirement: '1× top 3', ringColor: BRONZE },
      { level: 2, name: 'Medal Collector', requirement: '3× top 3', ringColor: SILVER },
      { level: 3, name: 'Podium Machine', requirement: '10× top 3', ringColor: GOLD },
    ],
  },
  // --- Hraj o tag na turnaji ---
  {
    id: 'tag_tournament',
    icon: <TrendingUpIcon />,
    color: '#059669',
    bgColor: '#d1fae5',
    tiers: [
      { level: 1, name: 'Tag Rookie', requirement: '1 turnajová výměna', ringColor: BRONZE },
      { level: 2, name: 'Tag Contender', requirement: '5 turnajových výměn', ringColor: SILVER },
      { level: 3, name: 'Tag Slinger', requirement: '10 turnajových výměn', ringColor: GOLD },
      { level: 4, name: 'Tag Titan', requirement: '20 turnajových výměn', ringColor: DIAMOND },
    ],
  },
  // --- Zahraj nad rating ---
  {
    id: 'above_rating',
    icon: <RocketLaunchIcon />,
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    tiers: [
      { level: 1, name: 'Hot Round', requirement: '10 nad rating', ringColor: BRONZE },
      { level: 2, name: 'Crusher', requirement: '30 nad rating', ringColor: SILVER },
      { level: 3, name: 'Beast Mode', requirement: '50 nad rating', ringColor: GOLD },
      { level: 4, name: 'Untouchable', requirement: '100 nad rating', ringColor: DIAMOND },
    ],
  },
  // --- Hraj turnaj v různých krajích ---
  {
    id: 'regions',
    icon: <ExploreIcon />,
    color: '#0891b2',
    bgColor: '#cffafe',
    tiers: [
      { level: 1, name: 'Road Tripper', requirement: '2 kraje', ringColor: BRONZE },
      { level: 2, name: 'Explorer', requirement: '5 krajů', ringColor: SILVER },
      { level: 3, name: 'Nomad', requirement: '8 krajů', ringColor: GOLD },
      { level: 4, name: 'Globetrotter', requirement: '10 krajů', ringColor: DIAMOND },
      { level: 5, name: 'Česko znám', requirement: '14 krajů', ringColor: LEGEND },
    ],
  },
  // --- Hraj o tag v casual game ---
  {
    id: 'casual_exchanges',
    icon: <GroupsIcon />,
    color: '#6366f1',
    bgColor: '#e0e7ff',
    tiers: [
      { level: 1, name: 'Parkový hráč', requirement: '1 casualová výměna', ringColor: BRONZE },
      { level: 2, name: 'Casual Regular', requirement: '10 casualových výměn', ringColor: SILVER },
      { level: 3, name: 'Casual Addict', requirement: '30 casualových výměn', ringColor: GOLD },
      { level: 4, name: 'Disc Golf Lifestyle', requirement: '50 casualových výměn', ringColor: DIAMOND },
    ],
  },
  // --- Single-tier achievements ---
  {
    id: 'jamkovka',
    icon: <AdjustIcon />,
    color: '#2e7d32',
    bgColor: '#e8f5e9',
    tiers: [
      { level: 1, name: 'Ace Chaser', requirement: 'Hraj jamkovku', ringColor: GOLD },
    ],
  },
  {
    id: 'handicap_liga',
    icon: <LeaderboardIcon />,
    color: '#5c6bc0',
    bgColor: '#e8eaf6',
    tiers: [
      { level: 1, name: 'Leveling Up', requirement: 'Hraj handicap ligu', ringColor: GOLD },
    ],
  },
  {
    id: 'below_rating',
    icon: <TrendingDownIcon />,
    color: '#dc2626',
    bgColor: '#fee2e2',
    tiers: [
      { level: 1, name: 'Bogey Train', requirement: 'Zahraj 50 pod rating', ringColor: BRONZE },
    ],
  },
  {
    id: 'ace',
    icon: <GpsFixedIcon />,
    color: '#f59e0b',
    bgColor: '#fef3c7',
    tiers: [
      { level: 1, name: 'Ace!', requirement: 'Hoď hole-in-one', ringColor: DIAMOND },
    ],
  },
  {
    id: 'snowman',
    icon: <Filter8Icon />,
    color: '#0284c7',
    bgColor: '#e0f2fe',
    tiers: [
      { level: 1, name: 'Snowman', requirement: 'Zahraj jamku za 8', ringColor: BRONZE },
    ],
  },
];

/**
 * Returns earned achievements for a player (hardcoded showcase).
 * In the future, this will be computed by the backend.
 */
function getPlayerAchievements(iDiscGolfId: number): { earned: EarnedAchievement[]; locked: AchievementDef[] } {
  // Hardcoded: achievement_id → earned tier level
  const earnedMap: Record<number, Record<string, number>> = {
    8460: {
      tournaments: 3,        // 15 tournaments = gold
      podium: 1,             // 1× top 3 = bronze
      tag_tournament: 2,     // 5 tournament exchanges = silver
      above_rating: 2,       // 30 above rating = silver
      regions: 2,            // 5 regions = silver
      casual_exchanges: 3,   // 30 casuals = gold
      jamkovka: 1,
      handicap_liga: 1,
      snowman: 1,
    },
  };

  const playerMap = earnedMap[iDiscGolfId] ?? { tournaments: 1 };
  const earned: EarnedAchievement[] = [];
  const locked: AchievementDef[] = [];

  for (const def of ACHIEVEMENTS) {
    const earnedLevel = playerMap[def.id];
    if (earnedLevel) {
      const tier = def.tiers.find((t) => t.level === earnedLevel);
      if (tier) {
        earned.push({ def, tier });
      }
    } else {
      locked.push(def);
    }
  }

  return { earned, locked };
}

interface AchievementsProps {
  iDiscGolfId: number;
}

const AchievementTile: React.FC<{
  def: AchievementDef;
  tier: Tier | null;
  isLocked: boolean;
  maxLevel?: number;
}> = ({ def, tier, isLocked, maxLevel }) => {
  const tooltipContent = isLocked ? (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{def.tiers[0].name}</Typography>
      <Typography variant="caption" sx={{ opacity: 0.8 }}>{def.tiers[0].requirement}</Typography>
    </Box>
  ) : (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>{tier!.name}</Typography>
      <Typography variant="caption" sx={{ opacity: 0.8 }}>{tier!.requirement}</Typography>
      {maxLevel && maxLevel > 1 && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.25, opacity: 0.6 }}>
          Level {tier!.level}/{maxLevel}
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow>
      <Box
        sx={{
          position: 'relative',
          width: 56,
          height: 56,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isLocked ? '#f5f5f5' : def.bgColor,
          color: isLocked ? '#bdbdbd' : def.color,
          border: '2.5px solid',
          borderColor: isLocked ? '#e0e0e0' : tier!.ringColor,
          transition: 'all 0.2s ease',
          cursor: 'default',
          opacity: isLocked ? 0.4 : 1,
          ...(!isLocked && {
            '&:hover': {
              transform: 'scale(1.12)',
              boxShadow: `0 4px 20px ${alpha(def.color, 0.35)}`,
              borderColor: def.color,
            },
          }),
          '& .MuiSvgIcon-root': { fontSize: 26 },
        }}
      >
        {def.icon}
        {/* Level badge */}
        {!isLocked && tier && def.tiers.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              bgcolor: tier.ringColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.6rem',
              fontWeight: 800,
              border: '1.5px solid #fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {tier.level}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
};

const Achievements: React.FC<AchievementsProps> = ({ iDiscGolfId }) => {
  const { earned, locked } = getPlayerAchievements(iDiscGolfId);

  return (
    <Box>
      {earned.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: locked.length > 0 ? 2 : 0 }}>
          {earned.map((a) => (
            <AchievementTile
              key={a.def.id}
              def={a.def}
              tier={a.tier}
              isLocked={false}
              maxLevel={a.def.tiers.length}
            />
          ))}
        </Box>
      )}

      {locked.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {locked.map((def) => (
            <AchievementTile key={def.id} def={def} tier={null} isLocked />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Achievements;
