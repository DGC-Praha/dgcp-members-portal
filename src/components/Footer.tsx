import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

type Partner = {
  name: string;
  url: string;
  logo: string;
  // Source asset is white-on-transparent — invert so it reads on the light footer.
  invert?: boolean;
};

const partners: Partner[] = [
  { name: 'Ultimo', url: 'https://www.ultimo.cz', logo: '/partners/ultimo.png' },
  { name: 'Lazerfun', url: 'https://www.lazerfunpraha.cz/', logo: '/partners/lazerfun.png', invert: true },
  { name: 'BigHub.ai', url: 'https://bighub.ai', logo: '/partners/bighub.svg' },
  { name: 'Sécheron', url: 'https://www.secheron.com/', logo: '/partners/secheron.svg' },
];

const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Box
      component="footer"
      sx={{
        mt: 6,
        pt: 3,
        pb: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mb: 1.5,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 600,
        }}
      >
        {t('footer.partners')}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 2, sm: 3.5 },
        }}
      >
        {partners.map((p) => (
          <Box
            key={p.name}
            component="a"
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={p.name}
            title={p.name}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 36,
              filter: 'grayscale(100%)',
              opacity: 0.65,
              transition: 'filter 200ms ease, opacity 200ms ease',
              '&:hover, &:focus-visible': {
                filter: 'none',
                opacity: 1,
              },
            }}
          >
            <Box
              component="img"
              src={p.logo}
              alt={p.name}
              sx={{
                height: '100%',
                width: 'auto',
                maxWidth: { xs: 110, sm: 140 },
                objectFit: 'contain',
                display: 'block',
                ...(p.invert && { filter: 'invert(1)' }),
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default Footer;
