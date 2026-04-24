import { useState, type MouseEvent } from 'react';
import {
  Chip,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  Divider,
  Box,
  Button,
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Visual language for list-page facet filters — a single pill that shows its
 * current state in the label and opens a menu on click.
 *
 * Empty state: outlined grey, label only, with a dropdown chevron.
 * Active state: filled primary, label + current value, with a clear (×) action.
 *
 * Mirrors Linear / GitHub Issues / Airbnb filter bars.
 */

const chipBaseSx = {
  height: 36,
  fontSize: '0.875rem',
  fontWeight: 500,
  borderRadius: 18,
  '& .MuiChip-label': { px: 1.25 },
  '& .MuiChip-icon': { ml: '6px', mr: '-4px' },
  '& .MuiChip-deleteIcon': { mr: '4px' },
} as const;

interface TriStateProps {
  label: string;
  value: 'all' | 'yes' | 'no';
  onChange: (v: 'all' | 'yes' | 'no') => void;
  allLabel: string;
  yesLabel: string;
  noLabel: string;
}

export function TriStateFilterChip({ label, value, onChange, allLabel, yesLabel, noLabel }: TriStateProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const active = value !== 'all';
  const displayValue = value === 'yes' ? yesLabel : value === 'no' ? noLabel : '';

  const handleOpen = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const handleClear = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onChange('all');
  };

  return (
    <>
      <Chip
        clickable
        onClick={handleOpen}
        label={active ? `${label}: ${displayValue}` : label}
        color={active ? 'primary' : 'default'}
        variant={active ? 'filled' : 'outlined'}
        icon={!active ? <ArrowDropDownIcon /> : undefined}
        deleteIcon={active ? <CloseIcon /> : undefined}
        onDelete={active ? handleClear : undefined}
        sx={chipBaseSx}
      />
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 160, mt: 0.5 } } }}
      >
        {([['all', allLabel], ['yes', yesLabel], ['no', noLabel]] as const).map(([opt, lbl]) => (
          <MenuItem
            key={opt}
            selected={value === opt}
            onClick={() => { onChange(opt); setAnchor(null); }}
          >
            {lbl}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

interface MultiSelectProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  clearLabel: string;
}

export function MultiSelectFilterChip({ label, options, value, onChange, clearLabel }: MultiSelectProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const active = value.length > 0;
  const summary = value.length === 1 ? value[0] : String(value.length);

  const toggle = (opt: string) => {
    onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt]);
  };

  const handleOpen = (e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget);
  const handleClear = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <>
      <Chip
        clickable
        onClick={handleOpen}
        label={active ? `${label}: ${summary}` : label}
        color={active ? 'primary' : 'default'}
        variant={active ? 'filled' : 'outlined'}
        icon={!active ? <ArrowDropDownIcon /> : undefined}
        deleteIcon={active ? <CloseIcon /> : undefined}
        onDelete={active ? handleClear : undefined}
        sx={chipBaseSx}
      />
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { maxHeight: 360, minWidth: 220, mt: 0.5 } } }}
      >
        {options.map((opt) => (
          <MenuItem key={opt} onClick={() => toggle(opt)} dense>
            <Checkbox size="small" edge="start" checked={value.includes(opt)} sx={{ p: 0, mr: 1 }} />
            <ListItemText primary={opt} />
          </MenuItem>
        ))}
        {active && (
          <>
            <Divider />
            <Box sx={{ px: 1, py: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => { onChange([]); setAnchor(null); }} sx={{ textTransform: 'none' }}>
                {clearLabel}
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}
