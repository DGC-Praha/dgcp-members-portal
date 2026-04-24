import { useMediaQuery, useTheme } from '@mui/material';

/**
 * True when the viewport is below MUI's `md` breakpoint (<900px).
 * Use this to branch between desktop tables and mobile card layouts.
 */
export function useIsMobile(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('md'));
}
