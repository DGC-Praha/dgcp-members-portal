import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  Skeleton,
  Autocomplete,
  Pagination,
  Button,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Stack,
  Card,
  CardActionArea,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import SearchIcon from '@mui/icons-material/Search';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { api } from '../api/client';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatDateRange } from '../components/UpcomingTournaments';
import type { RegistrationPhase } from '../components/UpcomingTournaments';
import RegistrationWatchdog from '../components/RegistrationWatchdog';
import { useIsMobile } from '../hooks/useIsMobile';

interface AllTournament {
  id: number;
  name: string;
  dateStart: string | null;
  dateEnd: string;
  cadgTier: string | null;
  pdgaTier: string | null;
  region: string | null;
  league: string | null;
  playerLimit: number | null;
  totalPlayers: number;
  registrationStatus: string | null;
  iDiscGolfTournamentId: number;
  pdgaTournamentId: number | null;
  clubMemberCount: number;
  registrationPhases: RegistrationPhase[];
}

interface FilterOptions {
  leagues: string[];
  regions: string[];
  cadgTiers: string[];
  pdgaTiers: string[];
}

const MobileTournamentRow: React.FC<{ t: AllTournament }> = ({ t }) => {
  const regText = (() => {
    const parts: string[] = [];
    if (t.registrationStatus) parts.push(t.registrationStatus);
    if (t.totalPlayers > 0) {
      parts.push(t.playerLimit ? `${t.totalPlayers}/${t.playerLimit}` : `${t.totalPlayers}`);
    }
    return parts.join(' · ');
  })();

  return (
    <Card
      variant="outlined"
      sx={{ mb: 1, borderRadius: 2, position: 'relative' }}
    >
      <CardActionArea
        component="a"
        href={`https://idiscgolf.cz/turnaje/${t.iDiscGolfTournamentId}`}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ p: 1.5, minHeight: 72, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
      >
        <Box sx={{ mt: 0.25, flexShrink: 0, color: '#e65100' }}>
          <EmojiEventsIcon sx={{ fontSize: 22 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, pr: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, lineHeight: 1.3, flex: 1, minWidth: 0 }}
              noWrap
            >
              {t.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.3 }}
            >
              {formatDateRange(t.dateStart, t.dateEnd)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
            {t.cadgTier && (
              <Chip
                label={t.cadgTier}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#fff3e0', color: '#e65100' }}
              />
            )}
            {t.pdgaTournamentId && (
              <Chip
                label={t.pdgaTier || 'PDGA'}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }}
              />
            )}
            {t.region && (
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
                {t.region}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
            {t.clubMemberCount > 0 && (
              <Chip
                icon={<PeopleOutlineIcon sx={{ fontSize: '14px !important' }} />}
                label={t.clubMemberCount}
                size="small"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#e8eaf6', color: '#3949ab' }}
              />
            )}
            {regText && (
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
                {regText}
              </Typography>
            )}
          </Box>
        </Box>
      </CardActionArea>
      {t.registrationPhases.length > 0 && (
        <Box
          sx={{ position: 'absolute', top: 8, right: 8 }}
          onClick={(e) => e.stopPropagation()}
        >
          <RegistrationWatchdog
            tournamentIdgId={t.iDiscGolfTournamentId}
            registrationPhases={t.registrationPhases}
          />
        </Box>
      )}
    </Card>
  );
};

const TournamentsPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<AllTournament[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ leagues: [], regions: [], cadgTiers: [], pdgaTiers: [] });

  const [regions, setRegions] = useState<string[]>([]);
  const [cadgTiers, setCadgTiers] = useState<string[]>([]);
  const [pdgaFilter, setPdgaFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [regFilter, setRegFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 25;
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const { t: tr } = useTranslation();
  const isMobile = useIsMobile();
  usePageTitle(tr('pageTitle.tournaments'));

  useEffect(() => {
    api.getTournamentFilterOptions()
      .then((res) => setFilterOptions(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const fetchTournaments = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number | string[]> = { page, limit };
    if (regions.length) params.region = regions;
    if (cadgTiers.length) params.cadgTier = cadgTiers;
    if (pdgaFilter === 'yes') params.pdga = 1;
    if (pdgaFilter === 'no') params.pdga = 0;
    if (regFilter === 'yes') params.registration = 1;
    if (regFilter === 'no') params.registration = 0;
    if (debouncedSearch) params.search = debouncedSearch;

    api.getAllTournaments(params)
      .then((res) => {
        setTournaments(res.data.tournaments);
        setTotal(res.data.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, regions, cadgTiers, pdgaFilter, regFilter, debouncedSearch]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const hasFilters = regions.length > 0 || cadgTiers.length > 0 || pdgaFilter !== 'all' || regFilter !== 'all' || debouncedSearch;

  const clearFilters = () => {
    setRegions([]);
    setCadgTiers([]);
    setPdgaFilter('all');
    setRegFilter('all');
    setSearch('');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
        {tr('tournaments.all')}
      </Typography>

      {/* Filter bar */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={tr('tournaments.filter.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 200 }}
        />
        <Autocomplete
          multiple
          size="small"
          options={filterOptions.regions}
          value={regions}
          onChange={(_e, v) => { setRegions(v); setPage(1); }}
          renderInput={(params) => <TextField {...params} label={tr('tournaments.filter.region')} />}
          sx={{ minWidth: 200 }}
          limitTags={2}
        />
        <Autocomplete
          multiple
          size="small"
          options={filterOptions.cadgTiers}
          value={cadgTiers}
          onChange={(_e, v) => { setCadgTiers(v); setPage(1); }}
          renderInput={(params) => <TextField {...params} label={tr('tournaments.filter.cadgTier')} />}
          sx={{ minWidth: 200 }}
          limitTags={2}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            PDGA
          </Typography>
          <ToggleButtonGroup
            value={pdgaFilter}
            exclusive
            onChange={(_e, v) => { if (v) { setPdgaFilter(v); setPage(1); } }}
            size="small"
            sx={{ height: 32 }}
          >
            <ToggleButton value="all" sx={{ px: 1.5, fontSize: '0.7rem', textTransform: 'none' }}>
              {tr('tournaments.filter.all')}
            </ToggleButton>
            <ToggleButton value="yes" sx={{ px: 1.5, fontSize: '0.7rem', textTransform: 'none' }}>
              {tr('tournaments.filter.yes')}
            </ToggleButton>
            <ToggleButton value="no" sx={{ px: 1.5, fontSize: '0.7rem', textTransform: 'none' }}>
              {tr('tournaments.filter.no')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {tr('tournaments.filter.registration')}
          </Typography>
          <ToggleButtonGroup
            value={regFilter}
            exclusive
            onChange={(_e, v) => { if (v) { setRegFilter(v); setPage(1); } }}
            size="small"
            sx={{ height: 32 }}
          >
            <ToggleButton value="all" sx={{ px: 1.5, fontSize: '0.7rem', textTransform: 'none' }}>
              {tr('tournaments.filter.all')}
            </ToggleButton>
            <ToggleButton value="yes" sx={{ px: 1.5, fontSize: '0.7rem', textTransform: 'none' }}>
              {tr('tournaments.filter.yes')}
            </ToggleButton>
            <ToggleButton value="no" sx={{ px: 1.5, fontSize: '0.7rem', textTransform: 'none' }}>
              {tr('tournaments.filter.no')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {hasFilters && (
          <Button
            size="small"
            startIcon={<FilterListOffIcon />}
            onClick={clearFilters}
            sx={{ color: 'text.secondary' }}
          >
            {tr('tournaments.filter.clear')}
          </Button>
        )}
      </Box>

      {/* Results count */}
      {!loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {tr('tournaments.totalCount', { count: total })}
        </Typography>
      )}

      {/* Tournament table / card list */}
      {loading ? (
        [1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} variant="rounded" height={36} sx={{ mb: 0.5 }} />
        ))
      ) : tournaments.length === 0 ? (
        <Typography color="text.secondary">{tr('tournaments.empty')}</Typography>
      ) : isMobile ? (
        <Stack>
          {tournaments.map((t) => (
            <MobileTournamentRow key={t.id} t={t} />
          ))}
        </Stack>
      ) : (
        <TableContainer>
          <Table size="small" sx={{ '& td, & th': { py: 0.75, fontSize: '0.8rem' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>{tr('tournaments.name')}</TableCell>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{tr('tournaments.date')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{tr('tournaments.filter.cadgTier')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{tr('tournaments.filter.region')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>PDGA</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{tr('tournaments.filter.registration')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{tr('tournaments.members')}</TableCell>
                <TableCell sx={{ width: 36 }} />
                <TableCell sx={{ width: 36 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {tournaments.map((t) => {
                const regText = (() => {
                  const parts: string[] = [];
                  if (t.registrationStatus) parts.push(t.registrationStatus);
                  if (t.totalPlayers > 0) {
                    parts.push(t.playerLimit ? `${t.totalPlayers}/${t.playerLimit}` : `${t.totalPlayers}`);
                  }
                  return parts.join(' · ');
                })();

                return (
                  <TableRow
                    key={t.id}
                    hover
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell sx={{ maxWidth: 280, fontWeight: 600 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }} noWrap>
                        {t.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                      {formatDateRange(t.dateStart, t.dateEnd)}
                    </TableCell>
                    <TableCell>
                      {t.cadgTier && (
                        <Chip
                          label={t.cadgTier}
                          size="small"
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#fff3e0', color: '#e65100' }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {t.region}
                    </TableCell>
                    <TableCell>
                      {t.pdgaTournamentId && (
                        <Chip
                          label={t.pdgaTier || 'PDGA'}
                          size="small"
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.75rem' }}>
                      {regText}
                    </TableCell>
                    <TableCell align="center">
                      {t.clubMemberCount > 0 && (
                        <Chip
                          icon={<PeopleOutlineIcon sx={{ fontSize: '14px !important' }} />}
                          label={t.clubMemberCount}
                          size="small"
                          sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#e8eaf6', color: '#3949ab' }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ px: 0 }}>
                      {t.registrationPhases.length > 0 && (
                        <RegistrationWatchdog
                          tournamentIdgId={t.iDiscGolfTournamentId}
                          registrationPhases={t.registrationPhases}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ px: 0 }}>
                      <Tooltip title="iDiscGolf" arrow>
                        <IconButton
                          size="small"
                          component="a"
                          href={`https://idiscgolf.cz/turnaje/${t.iDiscGolfTournamentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: '#2e7d32' }}
                        >
                          <OpenInNewIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_e, p) => setPage(p)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default TournamentsPage;
