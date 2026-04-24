import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useTranslation } from 'react-i18next';
import type { User } from '../auth/AuthContext';

interface MembershipStatusProps {
  user: User;
}

interface MembershipRow {
  label: string;
  active: boolean | null;
  renewUrl: string | null;
  show: boolean;
}

const StatusDot: React.FC<{ active: boolean | null }> = ({ active }) => {
  const color = active === true ? '#4caf50' : active === false ? '#f44336' : '#9e9e9e';
  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: color,
        flexShrink: 0,
      }}
    />
  );
};

const MembershipStatus: React.FC<MembershipStatusProps> = ({ user }) => {
  const { t: tr } = useTranslation();

  const tag = user.tagovacka;
  const rows: MembershipRow[] = [
    {
      label: tr('membership.dgcp'),
      active: user.activeMember,
      renewUrl: 'https://tagovacka.cz',
      show: true,
    },
    {
      label: tr('membership.cadg'),
      active: tag?.cadgMembershipActive ?? null,
      renewUrl: 'https://www.cadg.cz/clenstvi/',
      show: true,
    },
    {
      label: tr('membership.pdga'),
      active: tag?.pdgaMembershipActive ?? null,
      renewUrl: 'https://www.pdga.com/membership',
      show: tag?.pdgaNumber != null,
    },
  ];

  const visibleRows = rows.filter((r) => r.show);

  return (
    <Box>
      <Typography variant="overline" sx={{ letterSpacing: 1.5, color: 'text.secondary', fontSize: '0.7rem' }}>
        {tr('membership.title')}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
        {visibleRows.map((row) => (
          <Box
            key={row.label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StatusDot active={row.active} />
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                {row.label}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              {row.active === true && (
                <Chip
                  label={tr('membership.active')}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: '#e8f5e9',
                    color: '#2e7d32',
                  }}
                />
              )}
              {row.active === false && (
                <>
                  <Chip
                    label={tr('membership.inactive')}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      bgcolor: '#ffebee',
                      color: '#c62828',
                    }}
                  />
                  {row.renewUrl && (
                    <Chip
                      label={tr('membership.renew')}
                      size="small"
                      component="a"
                      href={row.renewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      clickable
                      icon={<OpenInNewIcon sx={{ fontSize: '12px !important' }} />}
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        bgcolor: '#fff3e0',
                        color: '#e65100',
                        '&:hover': { bgcolor: '#ffe0b2' },
                        '& .MuiChip-icon': { ml: 0.5, mr: -0.25 },
                      }}
                    />
                  )}
                </>
              )}
              {row.active === null && (
                <Chip
                  label={tr('membership.unknown')}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    bgcolor: '#f5f5f5',
                    color: '#757575',
                  }}
                />
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default MembershipStatus;
