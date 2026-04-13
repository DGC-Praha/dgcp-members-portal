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
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next';
import TagBadge from '../components/TagBadge';

interface Member {
  name: string;
  iDiscGolfId: number;
  pdgaNumber: number | null;
  tagNumber: number | null;
  avatarUrl: string | null;
  iDiscGolfRating: number | null;
  pdgaRating: number | null;
  role: string;
  joinedAt: string;
  cadgMembershipActive: boolean | null;
  pdgaMembershipActive: boolean | null;
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

const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'tag' | 'rating' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const m = user?.membership;
  const badgeColor = m?.club.tagBadgeColor || '#1565c0';
  const highlightColor = m?.club.tagBadgeHighlightColor || '#0d47a1';

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.getMembers();
        setMembers(res.data);
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
    if (sortBy) {
      result = [...result].sort((a, b) => {
        let valA: number;
        let valB: number;
        if (sortBy === 'tag') {
          valA = a.tagNumber ?? Infinity;
          valB = b.tagNumber ?? Infinity;
        } else {
          valA = a.pdgaRating ?? a.iDiscGolfRating ?? 0;
          valB = b.pdgaRating ?? b.iDiscGolfRating ?? 0;
        }
        return sortDir === 'asc' ? valA - valB : valB - valA;
      });
    }
    return result;
  }, [members, search, sortBy, sortDir]);

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
                  <TableCell align="center" sx={{ fontWeight: 600 }}>ČADG</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>PDGA</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((member) => (
                  <TableRow
                    key={member.iDiscGolfId}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:last-child td': { border: 0 },
                    }}
                    onClick={() => navigate(`/clenove/${member.iDiscGolfId}`)}
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
        </>
      )}
    </Box>
  );
};

export default MembersPage;
