import { useState } from 'react';
import {
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import CheckIcon from '@mui/icons-material/Check';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useTranslation } from 'react-i18next';

export interface SortOption<K extends string> {
  key: K;
  label: string;
  /** Default direction when this key is freshly selected (e.g. ratings default desc). */
  defaultDir?: 'asc' | 'desc';
}

interface SortMenuProps<K extends string> {
  options: SortOption<K>[];
  value: K;
  direction: 'asc' | 'desc';
  onChange: (key: K, direction: 'asc' | 'desc') => void;
  /** Override default label resolution (defaults to the active option's `label`). */
  buttonLabel?: string;
}

export function SortMenu<K extends string>({
  options,
  value,
  direction,
  onChange,
  buttonLabel,
}: SortMenuProps<K>) {
  const { t } = useTranslation();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const active = options.find((o) => o.key === value) ?? options[0];
  const DirArrow = direction === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon;

  const handleSelect = (key: K) => {
    if (key === value) {
      onChange(key, direction === 'asc' ? 'desc' : 'asc');
    } else {
      const picked = options.find((o) => o.key === key);
      onChange(key, picked?.defaultDir ?? 'asc');
    }
    setAnchor(null);
  };

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        color="inherit"
        startIcon={<SortIcon fontSize="small" />}
        endIcon={<DirArrow sx={{ fontSize: 16 }} />}
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-label={t('sort.ariaLabel')}
        sx={{
          textTransform: 'none',
          borderColor: 'divider',
          color: 'text.primary',
          minHeight: 36,
          px: 1.5,
          fontWeight: 500,
        }}
      >
        {buttonLabel ?? active.label}
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { minWidth: 200 } } }}
      >
        {options.map((o) => {
          const isActive = o.key === value;
          return (
            <MenuItem key={o.key} selected={isActive} onClick={() => handleSelect(o.key)}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {isActive ? <CheckIcon fontSize="small" /> : null}
              </ListItemIcon>
              <ListItemText primary={o.label} />
              {isActive && <DirArrow sx={{ fontSize: 16, ml: 1, color: 'text.secondary' }} />}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}

export default SortMenu;
