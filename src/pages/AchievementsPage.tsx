import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { api, membersApi, type LeaderboardItem } from '../api/client';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import { useIsMobile } from '../hooks/useIsMobile';
import { TIER_BG, TIER_COLORS, TIER_GLOW, tierLabel, twemoji } from '../components/achievements/shared';
import { formatDate } from '../i18n/format';
import { SortMenu } from '../components/SortMenu';

type SortColumn = 'rarity' | 'name';

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
        <img src={twemoji(emoji)} alt="" width={iconSize} height={iconSize} style={{ pointerEvents: 'none' }} />
      </Box>
    </Box>
  );
};

const rarityBucket = (
  percent: number,
  t: TFunction,
): { label: string; color: string; bg: string } => {
  if (percent === 0) return { label: t('achievements.rarity.nobody'), color: '#6b7280', bg: '#f3f4f6' };
  if (percent < 5) return { label: t('achievements.rarity.legendary'), color: '#dc2626', bg: '#fee2e2' };
  if (percent < 15) return { label: t('achievements.rarity.rare'), color: '#7c3aed', bg: '#f5f3ff' };
  if (percent < 35) return { label: t('achievements.rarity.uncommon'), color: '#f59e0b', bg: '#fef9c3' };
  if (percent < 60) return { label: t('achievements.rarity.common'), color: '#2563eb', bg: '#dbeafe' };
  return { label: t('achievements.rarity.everyone'), color: '#059669', bg: '#d1fae5' };
};

const MobileLeaderboardCard: React.FC<{
  item: LeaderboardItem;
  totalMembers: number;
  rank: number;
  avatarMap: Map<number, string | null>;
  onEarnerClick: (iDiscGolfId: number) => void;
}> = ({ item, totalMembers, rank, avatarMap, onEarnerClick }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const tierColor = TIER_COLORS[item.tier] ?? '#9ca3af';
  const bucket = rarityBucket(item.rarityPercent, t);
  const hasEarners = item.earners.length > 0;

  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box
        onClick={() => hasEarners && setOpen((o) => !o)}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.5,
          p: 1.5,
          cursor: hasEarners ? 'pointer' : 'default',
          '&:active': hasEarners ? { bgcolor: 'action.hover' } : undefined,
          '&:hover': hasEarners ? { bgcolor: 'action.hover' } : undefined,
        }}
      >
        <AchievementBadge emoji={item.achievementEmoji || '🏆'} tier={item.tier} size={48} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                  {item.achievementName}
                </Typography>
                {item.manual && (
                  <Tooltip title={t('achievements.manualTooltip')}>
                    <Chip
                      label={t('achievements.manualBadge')}
                      size="small"
                      sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#f3f4f6', color: '#6b7280' }}
                    />
                  </Tooltip>
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.3,
                  mt: 0.25,
                }}
              >
                {item.achievementDescription}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.disabled', flexShrink: 0 }}
            >
              #{rank}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, flexWrap: 'wrap' }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: '0.65rem',
                color: tierColor,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {tierLabel(item.tier)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              ≥ {item.threshold}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.72rem' }}>
              {item.rarityPercent}%
            </Typography>
            <Chip
              label={bucket.label}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 700,
                bgcolor: bucket.bg,
                color: bucket.color,
              }}
            />
          </Box>

          <Box sx={{ mt: 0.75 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(item.rarityPercent, 100)}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: '#f3f4f6',
                '& .MuiLinearProgress-bar': { bgcolor: bucket.color },
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {t('achievements.rarityCountOf', { count: item.earnedCount, total: totalMembers })}
            </Typography>
          </Box>
        </Box>

        {hasEarners && (
          <Box sx={{ flexShrink: 0, mt: 0.25 }}>
            <IconButton size="small" sx={{ pointerEvents: 'none', p: 0.25 }}>
              {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
          </Box>
        )}
      </Box>

      {hasEarners && (
        <Collapse in={open} unmountOnExit>
          <Box sx={{ pl: 2, pr: 2, pb: 1.5, bgcolor: '#fafbfc' }}>
            <Table size="small" sx={{ '& td, & th': { py: 0.75, fontSize: '0.75rem', border: 0 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 36 }} />
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>
                    {t('members.name')}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5, width: 100 }}>
                    {t('achievements.colEarnedAt')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {item.earners.map((earner) => (
                  <TableRow
                    key={earner.iDiscGolfId}
                    hover
                    onClick={(e) => {
                      e.stopPropagation();
                      onEarnerClick(earner.iDiscGolfId);
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ width: 36 }}>
                      <Avatar
                        src={avatarMap.get(earner.iDiscGolfId) ?? undefined}
                        alt={earner.name}
                        sx={{ width: 26, height: 26, bgcolor: tierColor, color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}
                      >
                        {earner.name
                          .split(' ')
                          .filter(Boolean)
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase() || '?'}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{earner.name}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      {formatDate(earner.earnedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

const LeaderboardRow: React.FC<{
  item: LeaderboardItem;
  totalMembers: number;
  rank: number;
  avatarMap: Map<number, string | null>;
  onEarnerClick: (iDiscGolfId: number) => void;
}> = ({ item, totalMembers, rank, avatarMap, onEarnerClick }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const tierColor = TIER_COLORS[item.tier] ?? '#9ca3af';
  const bucket = rarityBucket(item.rarityPercent, t);
  const hasEarners = item.earners.length > 0;

  return (
    <>
      <TableRow
        hover
        onClick={() => hasEarners && setOpen((o) => !o)}
        sx={{
          cursor: hasEarners ? 'pointer' : 'default',
          ...(hasEarners && open && { '& > *': { borderBottom: 'unset' } }),
        }}
      >
        <TableCell sx={{ width: 40, color: 'text.disabled', fontSize: '0.75rem', fontWeight: 600 }}>
          {rank}
        </TableCell>
        <TableCell sx={{ px: 1, width: 56 }}>
          <AchievementBadge emoji={item.achievementEmoji || '🏆'} tier={item.tier} />
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {item.achievementName}
            </Typography>
            {item.manual && (
              <Tooltip title={t('achievements.manualTooltip')}>
                <Chip
                  label={t('achievements.manualBadge')}
                  size="small"
                  sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600, bgcolor: '#f3f4f6', color: '#6b7280' }}
                />
              </Tooltip>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
            {item.achievementDescription}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                fontSize: '0.65rem',
                color: tierColor,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {tierLabel(item.tier)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              ≥ {item.threshold}
            </Typography>
          </Box>
        </TableCell>
        <TableCell sx={{ minWidth: 180 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(item.rarityPercent, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#f3f4f6',
                  '& .MuiLinearProgress-bar': { bgcolor: bucket.color },
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.75rem', minWidth: 40, textAlign: 'right' }}>
              {item.rarityPercent}%
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            {t('achievements.rarityCountOf', { count: item.earnedCount, total: totalMembers })}
          </Typography>
        </TableCell>
        <TableCell align="center" sx={{ width: 110 }}>
          <Chip
            label={bucket.label}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 700,
              bgcolor: bucket.bg,
              color: bucket.color,
            }}
          />
        </TableCell>
        <TableCell sx={{ width: 40 }}>
          {hasEarners && (
            <IconButton size="small" aria-label="expand" sx={{ pointerEvents: 'none' }}>
              {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
          )}
        </TableCell>
      </TableRow>
      {hasEarners && (
        <TableRow>
          <TableCell colSpan={7} sx={{ p: 0, borderBottom: open ? '1px solid rgba(224,224,224,1)' : 'none' }}>
            <Collapse in={open} unmountOnExit>
              <Box sx={{ pl: 7, pr: 2, py: 1.5, bgcolor: '#fafbfc' }}>
                <Table size="small" sx={{ '& td, & th': { py: 0.75, fontSize: '0.75rem', border: 0 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 40 }} />
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>
                        {t('members.name')}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5, width: 120 }}>
                        {t('achievements.colEarnedAt')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {item.earners.map((earner) => (
                      <TableRow
                        key={earner.iDiscGolfId}
                        hover
                        onClick={(e) => {
                          e.stopPropagation();
                          onEarnerClick(earner.iDiscGolfId);
                        }}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ width: 40 }}>
                          <Avatar
                            src={avatarMap.get(earner.iDiscGolfId) ?? undefined}
                            alt={earner.name}
                            sx={{ width: 28, height: 28, bgcolor: tierColor, color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}
                          >
                            {earner.name
                              .split(' ')
                              .filter(Boolean)
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase() || '?'}
                          </Avatar>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{earner.name}</TableCell>
                        <TableCell align="right" sx={{ color: 'text.secondary' }}>
                          {formatDate(earner.earnedAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const AchievementsPage: React.FC = () => {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [year, setYear] = useState(0);
  const [avatarMap, setAvatarMap] = useState<Map<number, string | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortColumn>('rarity');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  usePageTitle(t('pageTitle.achievements'));

  useEffect(() => {
    const fetch = async () => {
      try {
        // Leaderboard is the hard blocker; avatars are cosmetic — if tagovacka
        // is slow/down we still render initials-only chips.
        const [leaderboardRes, membersRes] = await Promise.allSettled([
          membersApi.getAchievementsLeaderboard(),
          api.getMembers(),
        ]);
        if (leaderboardRes.status === 'rejected') {
          setError(t('achievements.loadError'));
          return;
        }
        setItems(leaderboardRes.value.data.items);
        setTotalMembers(leaderboardRes.value.data.totalMembers);
        setYear(leaderboardRes.value.data.year);
        if (membersRes.status === 'fulfilled') {
          const map = new Map<number, string | null>();
          for (const member of membersRes.value.data as Array<{ iDiscGolfId: number; avatarUrl: string | null }>) {
            map.set(member.iDiscGolfId, member.avatarUrl);
          }
          setAvatarMap(map);
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [t]);

  const handleSort = (column: SortColumn) => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir(column === 'rarity' ? 'asc' : 'asc');
    }
  };

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      if (sortBy === 'rarity') {
        const diff = a.rarityPercent - b.rarityPercent;
        return sortDir === 'asc' ? diff : -diff;
      }
      const cmp = a.achievementName.localeCompare(b.achievementName, 'cs');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [items, sortBy, sortDir]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const earnedRows = items.filter((i) => i.earnedCount > 0).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsOutlinedIcon sx={{ color: '#f59e0b' }} />
            {t('achievements.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('achievements.subtitle', { year })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: isMobile ? 0.5 : 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ textAlign: 'center', px: isMobile ? 1 : 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.6rem' : '0.65rem', letterSpacing: 1 }}>
              {t('achievements.statBadges')}
            </Typography>
            <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ fontWeight: 700, lineHeight: 1 }}>
              {items.length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', px: isMobile ? 1 : 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.6rem' : '0.65rem', letterSpacing: 1 }}>
              {t('achievements.statAwarded')}
            </Typography>
            <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ fontWeight: 700, lineHeight: 1 }}>
              {earnedRows}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center', px: isMobile ? 1 : 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.6rem' : '0.65rem', letterSpacing: 1 }}>
              {t('achievements.statMembers')}
            </Typography>
            <Typography variant={isMobile ? 'body1' : 'h6'} sx={{ fontWeight: 700, lineHeight: 1 }}>
              {totalMembers}
            </Typography>
          </Box>
        </Box>
      </Box>

      {items.length === 0 ? (
        <Alert severity="info">{t('achievements.empty')}</Alert>
      ) : isMobile ? (
        <>
          <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
            <SortMenu<SortColumn>
              options={[
                { key: 'rarity', label: t('achievements.sortByRarity'), defaultDir: 'desc' },
                { key: 'name', label: t('achievements.sortByName') },
              ]}
              value={sortBy}
              direction={sortDir}
              onChange={(k, d) => { setSortBy(k); setSortDir(d); }}
            />
          </Box>
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            {sorted.map((item, idx) => (
              <MobileLeaderboardCard
                key={`${item.achievementKey}-${item.tier}`}
                item={item}
                totalMembers={totalMembers}
                rank={idx + 1}
                avatarMap={avatarMap}
                onEarnerClick={(id) => navigate(`/clenove/${id}`)}
              />
            ))}
          </Box>
        </>
      ) : (
        <TableContainer>
          <Table size="small" sx={{ '& td, & th': { py: 1, fontSize: '0.8rem' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40, fontWeight: 600 }}>#</TableCell>
                <TableCell sx={{ width: 56 }} />
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortDir : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    {t('achievements.colBadge')}
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t('achievements.colTier')}
                </TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 180 }}>
                  <TableSortLabel
                    active={sortBy === 'rarity'}
                    direction={sortBy === 'rarity' ? sortDir : 'asc'}
                    onClick={() => handleSort('rarity')}
                  >
                    {t('achievements.colRarity')}
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>
                  {t('achievements.colBucket')}
                </TableCell>
                <TableCell sx={{ width: 40 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((item, idx) => (
                <LeaderboardRow
                  key={`${item.achievementKey}-${item.tier}`}
                  item={item}
                  totalMembers={totalMembers}
                  rank={idx + 1}
                  avatarMap={avatarMap}
                  onEarnerClick={(id) => navigate(`/clenove/${id}`)}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AchievementsPage;
