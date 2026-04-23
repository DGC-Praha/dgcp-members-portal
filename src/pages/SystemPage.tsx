import React from 'react';
import { Box, Paper, Tab, Tabs, Typography } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import WebhookLogTab from './system/WebhookLogTab';
import QueueTab from './system/QueueTab';
import RecomputeTab from './system/RecomputeTab';

type TabKey = 'webhooks' | 'queue' | 'recompute';

const TAB_ORDER: TabKey[] = ['webhooks', 'queue', 'recompute'];

function isTabKey(v: string | null): v is TabKey {
  return v !== null && (TAB_ORDER as string[]).includes(v);
}

const SystemPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  usePageTitle(t('pageTitle.system'));

  const raw = searchParams.get('tab');
  const active: TabKey = isTabKey(raw) ? raw : 'webhooks';

  const handleChange = (_: React.SyntheticEvent, value: TabKey) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        {t('system.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t('system.subtitle')}
      </Typography>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={active}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab value="webhooks" label={t('system.tabs.webhooks')} />
          <Tab value="queue" label={t('system.tabs.queue')} />
          <Tab value="recompute" label={t('system.tabs.recompute')} />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {active === 'webhooks' && <WebhookLogTab />}
          {active === 'queue' && <QueueTab />}
          {active === 'recompute' && <RecomputeTab />}
        </Box>
      </Paper>
    </Box>
  );
};

export default SystemPage;
