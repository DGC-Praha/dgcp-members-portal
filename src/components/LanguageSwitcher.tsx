import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';

interface LanguageSwitcherProps {
  /** Set true when rendered on a dark AppBar. Defaults to light surface styling. */
  dark?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ dark = false }) => {
  const { i18n, t } = useTranslation();
  const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(i18n.language)
    ? (i18n.language as SupportedLanguage)
    : 'cs';

  const handleChange = (_: React.MouseEvent<HTMLElement>, value: SupportedLanguage | null) => {
    if (value && value !== current) {
      i18n.changeLanguage(value);
    }
  };

  const buttonBase = {
    px: 1.25,
    py: 0.25,
    fontSize: '0.72rem',
    fontWeight: 700,
    lineHeight: 1.2,
    textTransform: 'uppercase' as const,
  };

  const darkStyles = {
    bgcolor: 'rgba(255,255,255,0.08)',
    '& .MuiToggleButton-root': {
      ...buttonBase,
      color: 'rgba(255,255,255,0.75)',
      border: '1px solid rgba(255,255,255,0.25)',
    },
    '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover': {
      color: '#fff',
      bgcolor: 'rgba(255,255,255,0.22)',
    },
  } as const;

  const lightStyles = {
    '& .MuiToggleButton-root': {
      ...buttonBase,
      color: 'text.secondary',
    },
    '& .MuiToggleButton-root.Mui-selected, & .MuiToggleButton-root.Mui-selected:hover': {
      color: 'primary.contrastText',
      bgcolor: 'primary.main',
    },
  } as const;

  return (
    <Box sx={{ mr: dark ? 1 : 0 }}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={current}
        onChange={handleChange}
        aria-label={t('language.label')}
        sx={dark ? darkStyles : lightStyles}
      >
        {SUPPORTED_LANGUAGES.map((lng) => (
          <ToggleButton key={lng} value={lng} aria-label={t(`language.${lng}`)}>
            {lng.toUpperCase()}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
};

export default LanguageSwitcher;
