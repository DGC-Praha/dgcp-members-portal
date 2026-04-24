import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  TableSortLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { api, membersApi, type ClubMemberBasic } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import { useIsMobile } from '../hooks/useIsMobile';
import TagBadge from '../components/TagBadge';
import { SortMenu, type SortOption } from '../components/SortMenu';

/** Tagovacka-enriched member row, sourced client-side by joining members-api
 *  (canonical DGCP roster) with tagovacka's /api/members payload on iDiscGolfId.
 *  Fields from tagovacka are null when either iDiscGolfId is unset on the
 *  members-api row, or tagovacka doesn't have that player. */
interface Member {
  id: number;
  iDiscGolfId: number | null;
  name: string;
  pdgaNumber: number | null;
  tagNumber: number | null;
  avatarUrl: string | null;
  iDiscGolfRating: number | null;
  pdgaRating: number | null;
  dgcpMembershipActive: boolean;
  cadgMembershipActive: boolean | null;
  pdgaMembershipActive: boolean | null;
}

interface TagovackaMember {
  iDiscGolfId: number;
  name: string;
  pdgaNumber: number | null;
  tagNumber: number | null;
  avatarUrl: string | null;
  iDiscGolfRating: number | null;
  pdgaRating: number | null;
  cadgMembershipActive: boolean | null;
  pdgaMembershipActive: boolean | null;
}

function mergeMembers(clubMembers: ClubMemberBasic[], tagovackaMembers: TagovackaMember[]): Member[] {
  const byIdg = new Map<number, TagovackaMember>();
  for (const tm of tagovackaMembers) byIdg.set(tm.iDiscGolfId, tm);
  return clubMembers.map((cm) => {
    const tm = cm.iDiscGolfId != null ? byIdg.get(cm.iDiscGolfId) : undefined;
    const fullName = [cm.firstName, cm.lastName].filter(Boolean).join(' ').trim();
    return {
      id: cm.id,
      iDiscGolfId: cm.iDiscGolfId,
      name: fullName || tm?.name || `#${cm.id}`,
      pdgaNumber: tm?.pdgaNumber ?? null,
      tagNumber: tm?.tagNumber ?? null,
      avatarUrl: tm?.avatarUrl ?? null,
      iDiscGolfRating: tm?.iDiscGolfRating ?? null,
      pdgaRating: tm?.pdgaRating ?? null,
      dgcpMembershipActive: cm.membershipActive,
      cadgMembershipActive: tm?.cadgMembershipActive ?? null,
      pdgaMembershipActive: tm?.pdgaMembershipActive ?? null,
    };
  });
}

const StatusDot: React.FC<{ active: boolean | null }> = ({ active }) => {
  const color = active === true ? '#4caf50' : active === false ? '#f44336' : '#bdbdbd';
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: color,
        display: 'inline-block',
      }}
    />
  );
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

type MobileSortKey = 'name' | 'tag' | 'rating';

const MobileMemberCard: React.FC<{
  member: Member;
  badgeColor: string;
  highlightColor: string;
  onClick?: () => void;
}> = ({ member, badgeColor, highlightColor, onClick }) => (
  <Box
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      p: 1.5,
      borderBottom: '1px solid',
      borderColor: 'divider',
      cursor: onClick ? 'pointer' : 'default',
      opacity: onClick ? 1 : 0.7,
      '&:active': onClick ? { bgcolor: 'action.hover' } : undefined,
      '&:hover': onClick ? { bgcolor: 'action.hover' } : undefined,
      minHeight: 56,
    }}
  >
    <Avatar
      src={member.avatarUrl || undefined}
      alt={member.name}
      sx={{ width: 40, height: 40, bgcolor: '#0d47a1', fontSize: '0.85rem', flexShrink: 0 }}
    >
      {getInitials(member.name)}
    </Avatar>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
        {member.name}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
        {member.iDiscGolfRating && (
          <Chip
            label={member.iDiscGolfRating}
            size="small"
            sx={{ height: 18, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#e8f5e9', color: '#2e7d32' }}
          />
        )}
        {member.pdgaRating && (
          <Chip
            label={member.pdgaRating}
            size="small"
            sx={{ height: 18, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#e3f2fd', color: '#1565c0' }}
          />
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 0.25 }}>
          <StatusDotLabeled active={member.dgcpMembershipActive} label="DGCP" />
          <StatusDotLabeled active={member.cadgMembershipActive} label="ČADG" />
          {member.pdgaNumber != null && (
            <StatusDotLabeled active={member.pdgaMembershipActive} label="PDGA" />
          )}
        </Box>
      </Box>
    </Box>
    <Box sx={{ flexShrink: 0, ml: 0.5 }}>
      <TagBadge number={member.tagNumber} size="small" badgeColor={badgeColor} highlightColor={highlightColor} />
    </Box>
  </Box>
);

const StatusDotLabeled: React.FC<{ active: boolean | null; label: string }> = ({ active, label }) => {
  const color = active === true ? '#4caf50' : active === false ? '#f44336' : '#bdbdbd';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
};

const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'tag' | 'rating' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [mobileSortKey, setMobileSortKey] = useState<MobileSortKey>('name');
  // Separate from desktop `sortDir` so that crossing the breakpoint mid-session
  // doesn't carry a nonsensical direction across (e.g. mobile rating-desc leaking
  // into desktop tag sort).
  const [mobileSortDir, setMobileSortDir] = useState<'asc' | 'desc'>('asc');
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  usePageTitle(t('pageTitle.members'));

  const m = user?.tagovacka?.membership;
  const badgeColor = m?.club.tagBadgeColor || '#1565c0';
  const highlightColor = m?.club.tagBadgeHighlightColor || '#0d47a1';

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Canonical DGCP roster from members-api (public endpoint; name + iDG
        // only) joined with tagovacka enrichment (avatar/ratings/tag/…) by iDG.
        // Tagovacka failure is non-fatal — we still render names from members-api.
        const [clubRes, tagRes] = await Promise.allSettled([
          membersApi.listMembersBasic(),
          api.getMembers(),
        ]);
        if (clubRes.status === 'rejected') {
          setError(t('members.loadError'));
          return;
        }
        const tagovacka = tagRes.status === 'fulfilled' ? (tagRes.value.data as TagovackaMember[]) : [];
        setMembers(mergeMembers(clubRes.value.data, tagovacka));
      } catch {
        setError(t('members.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [t]);

  const handleSort = (column: 'tag' | 'rating') => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = members;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    // Mobile has its own sort key (includes 'name' as an explicit option);
    // desktop uses the table-header sortBy + alphabetical fallback.
    const effectiveKey: 'name' | 'tag' | 'rating' = isMobile
      ? mobileSortKey
      : (sortBy ?? 'name');
    const effectiveDir = isMobile ? mobileSortDir : sortDir;
    if (effectiveKey === 'name') {
      result = [...result].sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, 'cs');
        return effectiveDir === 'asc' ? cmp : -cmp;
      });
    } else {
      result = [...result].sort((a, b) => {
        let valA: number;
        let valB: number;
        if (effectiveKey === 'tag') {
          valA = a.tagNumber ?? Infinity;
          valB = b.tagNumber ?? Infinity;
        } else {
          valA = a.pdgaRating ?? a.iDiscGolfRating ?? 0;
          valB = b.pdgaRating ?? b.iDiscGolfRating ?? 0;
        }
        return effectiveDir === 'asc' ? valA - valB : valB - valA;
      });
    }
    return result;
  }, [members, search, sortBy, sortDir, isMobile, mobileSortKey, mobileSortDir]);

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t('members.title')}
          <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1.5 }}>
            {members.length}
          </Typography>
        </Typography>
      </Box>

      {members.length === 0 ? (
        <Alert severity="info">{t('members.empty')}</Alert>
      ) : (
        <>
          <TextField
            size="small"
            placeholder={t('members.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ mb: 2, maxWidth: 320 }}
            fullWidth
          />
          {isMobile ? (
            <>
              <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
                <SortMenu<MobileSortKey>
                  options={[
                    { key: 'name', label: t('members.sortByName') },
                    { key: 'tag', label: t('members.sortByTag') },
                    { key: 'rating', label: t('members.sortByRating'), defaultDir: 'desc' },
                  ] as SortOption<MobileSortKey>[]}
                  value={mobileSortKey}
                  direction={mobileSortDir}
                  onChange={(k, d) => { setMobileSortKey(k); setMobileSortDir(d); }}
                />
              </Box>
              <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                {filtered.map((member) => (
                  <MobileMemberCard
                    key={member.id}
                    member={member}
                    badgeColor={badgeColor}
                    highlightColor={highlightColor}
                    onClick={
                      member.iDiscGolfId != null
                        ? () => navigate(`/clenove/${member.iDiscGolfId}`)
                        : undefined
                    }
                  />
                ))}
              </Box>
            </>
          ) : (
          <TableContainer>
            <Table size="small" sx={{ '& td, & th': { py: 0.75, fontSize: '0.8rem' } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={{ fontWeight: 600 }}>{t('members.name')}</TableCell>
                  <TableCell sx={{ width: 48, fontWeight: 600 }} align="center">
                    <TableSortLabel
                      active={sortBy === 'tag'}
                      direction={sortBy === 'tag' ? sortDir : 'asc'}
                      onClick={() => handleSort('tag')}
                    >
                      Tag
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <TableSortLabel
                      active={sortBy === 'rating'}
                      direction={sortBy === 'rating' ? sortDir : 'desc'}
                      onClick={() => handleSort('rating')}
                    >
                      {t('tournaments.rating')}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>DGCP</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>ČADG</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>PDGA</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((member) => (
                  <TableRow
                    key={member.id}
                    hover={member.iDiscGolfId != null}
                    sx={{
                      cursor: member.iDiscGolfId != null ? 'pointer' : 'default',
                      opacity: member.iDiscGolfId != null ? 1 : 0.7,
                      '&:last-child td': { border: 0 },
                    }}
                    onClick={
                      member.iDiscGolfId != null
                        ? () => navigate(`/clenove/${member.iDiscGolfId}`)
                        : undefined
                    }
                  >
                    <TableCell sx={{ px: 1 }}>
                      <Avatar
                        src={member.avatarUrl || undefined}
                        alt={member.name}
                        sx={{ width: 32, height: 32, bgcolor: '#0d47a1', fontSize: '0.75rem' }}
                      >
                        {getInitials(member.name)}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {member.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <TagBadge
                          number={member.tagNumber}
                          size="tiny"
                          badgeColor={badgeColor}
                          highlightColor={highlightColor}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {member.iDiscGolfRating && (
                          <Chip
                            label={member.iDiscGolfRating}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#e8f5e9', color: '#2e7d32' }}
                          />
                        )}
                        {member.pdgaRating && (
                          <Chip
                            label={member.pdgaRating}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, bgcolor: '#e3f2fd', color: '#1565c0' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <StatusDot active={member.dgcpMembershipActive} />
                    </TableCell>
                    <TableCell align="center">
                      <StatusDot active={member.cadgMembershipActive} />
                    </TableCell>
                    <TableCell align="center">
                      <StatusDot active={member.pdgaMembershipActive} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          )}
        </>
      )}
    </Box>
  );
};

export default MembersPage;
