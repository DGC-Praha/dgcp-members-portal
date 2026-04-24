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
  Drawer,
  Divider,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
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

const MobileTournamentRow: React.FC<{ t: AllTournament }> = ({ t }) => (
  <Card variant="outlined" sx={{ mb: 0.75, borderRadius: 1 }}>
    <CardActionArea
      component="a"
      href={`https://idiscgolf.cz/turnaje/${t.iDiscGolfTournamentId}`}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ py: 1.25, px: 1.5, minHeight: 64, display: 'block' }}
    >
      {/* Row 1: name (grow) | date (flush right). No bell here, no padding
          reserved — date anchors to the right edge on every card. */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
      {/* Row 2: tier/region chips (grow) | members count | bell (if any). */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75, minHeight: 32 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          {t.cadgTier && (
            <Chip
              label={t.cadgTier}
              size="small"
              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#fff3e0', color: '#e65100' }}
            />
          )}
          {t.pdgaTournamentId && (
            <Chip
              label={t.pdgaTier || 'PDGA'}
              size="small"
              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }}
            />
          )}
          {t.region && (
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1, ml: 0.25 }} noWrap>
              {t.region}
            </Typography>
          )}
        </Box>
        {t.clubMemberCount > 0 && (
          <Chip
            icon={<PeopleOutlineIcon sx={{ fontSize: '14px !important' }} />}
            label={t.clubMemberCount}
            size="small"
            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#e8eaf6', color: '#3949ab', flexShrink: 0 }}
          />
        )}
        {t.registrationPhases.length > 0 && (
          <Box
            // Pull the bell right by the IconButton's internal padding so the
            // visible icon glyph — not the invisible button box — aligns with
            // the card's right edge (and with the row-1 date).
            sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', mr: -0.75 }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <RegistrationWatchdog
              tournamentIdgId={t.iDiscGolfTournamentId}
              registrationPhases={t.registrationPhases}
            />
          </Box>
        )}
      </Box>
    </CardActionArea>
  </Card>
);

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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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
  const activeFilterCount =
    regions.length +
    cadgTiers.length +
    (pdgaFilter !== 'all' ? 1 : 0) +
    (regFilter !== 'all' ? 1 : 0);

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
      {isMobile ? (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            fullWidth
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
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={
              <Badge badgeContent={activeFilterCount} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', height: 16, minWidth: 16 } }}>
                <FilterListIcon fontSize="small" />
              </Badge>
            }
            onClick={() => setMobileFiltersOpen(true)}
            sx={{ flexShrink: 0, textTransform: 'none', minHeight: 40 }}
          >
            {tr('tournaments.filter.filtersButton')}
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 2fr) repeat(2, minmax(200px, 2fr)) repeat(2, minmax(150px, 1fr))',
            gap: 1.5,
            mb: 3,
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            label={tr('tournaments.filter.search')}
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
          />
          <Autocomplete
            multiple
            size="small"
            options={filterOptions.regions}
            value={regions}
            onChange={(_e, v) => { setRegions(v); setPage(1); }}
            renderInput={(params) => <TextField {...params} label={tr('tournaments.filter.region')} />}
            limitTags={2}
          />
          <Autocomplete
            multiple
            size="small"
            options={filterOptions.cadgTiers}
            value={cadgTiers}
            onChange={(_e, v) => { setCadgTiers(v); setPage(1); }}
            renderInput={(params) => <TextField {...params} label={tr('tournaments.filter.cadgTier')} />}
            limitTags={2}
          />
          <FormControl size="small">
            <InputLabel id="pdga-filter-label">PDGA</InputLabel>
            <Select
              labelId="pdga-filter-label"
              label="PDGA"
              value={pdgaFilter}
              onChange={(e) => { setPdgaFilter(e.target.value as 'all' | 'yes' | 'no'); setPage(1); }}
            >
              <MenuItem value="all">{tr('tournaments.filter.all')}</MenuItem>
              <MenuItem value="yes">{tr('tournaments.filter.yes')}</MenuItem>
              <MenuItem value="no">{tr('tournaments.filter.no')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="reg-filter-label">{tr('tournaments.filter.registration')}</InputLabel>
            <Select
              labelId="reg-filter-label"
              label={tr('tournaments.filter.registration')}
              value={regFilter}
              onChange={(e) => { setRegFilter(e.target.value as 'all' | 'yes' | 'no'); setPage(1); }}
            >
              <MenuItem value="all">{tr('tournaments.filter.all')}</MenuItem>
              <MenuItem value="yes">{tr('tournaments.filter.yes')}</MenuItem>
              <MenuItem value="no">{tr('tournaments.filter.no')}</MenuItem>
            </Select>
          </FormControl>
          {hasFilters && (
            <Button
              size="small"
              startIcon={<FilterListOffIcon />}
              onClick={clearFilters}
              sx={{
                gridColumn: '1 / -1',
                justifySelf: 'end',
                color: 'text.secondary',
                textTransform: 'none',
              }}
            >
              {tr('tournaments.filter.clear')}
            </Button>
          )}
        </Box>
      )}

      {/* Mobile filter bottom sheet */}
      <Drawer
        anchor="bottom"
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '85vh',
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {tr('tournaments.filter.title')}
          </Typography>
          <IconButton onClick={() => setMobileFiltersOpen(false)} aria-label={tr('tournaments.filter.close')}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Stack spacing={2.5} sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
          <Autocomplete
            multiple
            size="small"
            options={filterOptions.regions}
            value={regions}
            onChange={(_e, v) => { setRegions(v); setPage(1); }}
            renderInput={(params) => <TextField {...params} label={tr('tournaments.filter.region')} />}
            limitTags={3}
          />
          <Autocomplete
            multiple
            size="small"
            options={filterOptions.cadgTiers}
            value={cadgTiers}
            onChange={(_e, v) => { setCadgTiers(v); setPage(1); }}
            renderInput={(params) => <TextField {...params} label={tr('tournaments.filter.cadgTier')} />}
            limitTags={3}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              PDGA
            </Typography>
            <ToggleButtonGroup
              value={pdgaFilter}
              exclusive
              fullWidth
              onChange={(_e, v) => { if (v) { setPdgaFilter(v); setPage(1); } }}
              size="small"
            >
              <ToggleButton value="all" sx={{ textTransform: 'none' }}>{tr('tournaments.filter.all')}</ToggleButton>
              <ToggleButton value="yes" sx={{ textTransform: 'none' }}>{tr('tournaments.filter.yes')}</ToggleButton>
              <ToggleButton value="no" sx={{ textTransform: 'none' }}>{tr('tournaments.filter.no')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
              {tr('tournaments.filter.registration')}
            </Typography>
            <ToggleButtonGroup
              value={regFilter}
              exclusive
              fullWidth
              onChange={(_e, v) => { if (v) { setRegFilter(v); setPage(1); } }}
              size="small"
            >
              <ToggleButton value="all" sx={{ textTransform: 'none' }}>{tr('tournaments.filter.all')}</ToggleButton>
              <ToggleButton value="yes" sx={{ textTransform: 'none' }}>{tr('tournaments.filter.yes')}</ToggleButton>
              <ToggleButton value="no" sx={{ textTransform: 'none' }}>{tr('tournaments.filter.no')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Stack>
        <Divider />
        <Box sx={{ p: 2, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          <Button
            onClick={clearFilters}
            disabled={!hasFilters}
            startIcon={<FilterListOffIcon />}
            sx={{ textTransform: 'none' }}
          >
            {tr('tournaments.filter.clear')}
          </Button>
          <Button
            variant="contained"
            onClick={() => setMobileFiltersOpen(false)}
            sx={{ textTransform: 'none', minWidth: 120 }}
          >
            {tr('tournaments.filter.apply')}
          </Button>
        </Box>
      </Drawer>

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
