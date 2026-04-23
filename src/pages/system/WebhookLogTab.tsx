import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslation } from 'react-i18next';
import {
  membersApi,
  type WebhookLogDetail,
  type WebhookLogSummary,
  type WebhookOutcome,
} from '../../api/client';

const OUTCOME_OPTIONS: WebhookOutcome[] = [
  'accepted',
  'duplicate',
  'invalid_signature',
  'malformed',
  'processing_error',
];

function outcomeChipColor(outcome: WebhookOutcome): 'success' | 'default' | 'warning' | 'error' {
  switch (outcome) {
    case 'accepted':
      return 'success';
    case 'duplicate':
      return 'default';
    case 'invalid_signature':
      return 'error';
    case 'malformed':
      return 'warning';
    case 'processing_error':
      return 'error';
  }
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'medium' });
}

function formatRelative(value: string): string {
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return '';
  const diffMs = Date.now() - d;
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `před ${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `před ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `před ${hr} h`;
  const day = Math.round(hr / 24);
  return `před ${day} dny`;
}

const WebhookLogTab: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<WebhookLogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<WebhookOutcome | ''>('');
  const [eventType, setEventType] = useState('');
  const [detail, setDetail] = useState<WebhookLogDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(
    async (append: boolean, cursorId: number | null) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await membersApi.listWebhookLog({
          cursor: cursorId,
          limit: 50,
          outcome: outcome || undefined,
          eventType: eventType.trim() || undefined,
        });
        setItems((prev) => (append ? [...prev, ...res.data.items] : res.data.items));
        setCursor(res.data.nextCursor);
      } catch (e) {
        const msg = (e as { message?: string })?.message ?? String(e);
        setError(msg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [outcome, eventType],
  );

  useEffect(() => {
    load(false, null);
  }, [load]);

  const openDetail = async (id: number) => {
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await membersApi.getWebhookLogEntry(id);
      setDetail(res.data);
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? String(e);
      setError(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <TextField
          size="small"
          select
          label={t('system.webhooks.filter.outcome')}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as WebhookOutcome | '')}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">{t('system.webhooks.filter.any')}</MenuItem>
          {OUTCOME_OPTIONS.map((o) => (
            <MenuItem key={o} value={o}>{t(`system.webhooks.outcome.${o}`)}</MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label={t('system.webhooks.filter.eventType')}
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          placeholder="tournament.results_finalized"
          sx={{ minWidth: 280 }}
        />
        <Tooltip title={t('system.webhooks.refresh')}>
          <IconButton onClick={() => load(false, null)} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {t('system.webhooks.empty')}
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('system.webhooks.col.receivedAt')}</TableCell>
                <TableCell>{t('system.webhooks.col.eventType')}</TableCell>
                <TableCell>{t('system.webhooks.col.outcome')}</TableCell>
                <TableCell align="right">{t('system.webhooks.col.httpStatus')}</TableCell>
                <TableCell align="right">{t('system.webhooks.col.processingMs')}</TableCell>
                <TableCell>{t('system.webhooks.col.sourceIp')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => openDetail(row.id)}
                >
                  <TableCell>
                    <Tooltip title={formatDate(row.receivedAt)}>
                      <span>{formatRelative(row.receivedAt)}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {row.eventType ?? <span style={{ color: '#999' }}>—</span>}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={outcomeChipColor(row.outcome)}
                      label={t(`system.webhooks.outcome.${row.outcome}`)}
                    />
                  </TableCell>
                  <TableCell align="right">{row.httpStatus}</TableCell>
                  <TableCell align="right">{row.processingMs ?? '—'}</TableCell>
                  <TableCell>{row.sourceIp ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {cursor !== null && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button onClick={() => load(true, cursor)} disabled={loadingMore} variant="outlined">
            {loadingMore ? <CircularProgress size={18} /> : t('system.webhooks.loadMore')}
          </Button>
        </Box>
      )}

      <Dialog
        open={detail !== null || detailLoading}
        onClose={() => {
          setDetail(null);
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{t('system.webhooks.detail.title')}</span>
          <IconButton onClick={() => setDetail(null)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading && !detail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : detail ? (
            <Stack spacing={1.5}>
              <Row label={t('system.webhooks.col.receivedAt')} value={formatDate(detail.receivedAt)} />
              <Row label={t('system.webhooks.col.eventType')} value={detail.eventType ?? '—'} />
              <Row label="Event ID" value={detail.eventId ?? '—'} />
              <Row
                label={t('system.webhooks.col.outcome')}
                value={
                  <Chip
                    size="small"
                    color={outcomeChipColor(detail.outcome)}
                    label={t(`system.webhooks.outcome.${detail.outcome}`)}
                  />
                }
              />
              <Row label={t('system.webhooks.col.httpStatus')} value={String(detail.httpStatus)} />
              <Row label={t('system.webhooks.col.sourceIp')} value={detail.sourceIp ?? '—'} />
              <Row
                label={t('system.webhooks.detail.signature')}
                value={
                  detail.signatureValid
                    ? t('system.webhooks.detail.signatureOk')
                    : `${t('system.webhooks.detail.signatureBad')}: ${detail.signatureFailureReason ?? '—'}`
                }
              />
              {detail.processingError && (
                <Row
                  label={t('system.webhooks.detail.processingError')}
                  value={<code style={{ whiteSpace: 'pre-wrap' }}>{detail.processingError}</code>}
                />
              )}
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2">{t('system.webhooks.detail.payload')}</Typography>
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  bgcolor: '#0d1117',
                  color: '#e6edf3',
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 400,
                  fontSize: '0.78rem',
                }}
              >
                {detail.payloadJson !== null
                  ? JSON.stringify(detail.payloadJson, null, 2)
                  : detail.payloadRaw}
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160 }}>{label}</Typography>
    <Box sx={{ flex: 1 }}>{typeof value === 'string' ? <Typography variant="body2">{value}</Typography> : value}</Box>
  </Box>
);

export default WebhookLogTab;
