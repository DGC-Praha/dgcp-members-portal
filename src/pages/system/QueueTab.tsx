import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { membersApi, type QueueSummary } from '../../api/client';
import { formatDateTime, formatRelativeTime } from '../../i18n/format';

function formatRelative(value: string | null): string {
  if (value === null) return '—';
  return formatRelativeTime(value) || value;
}

function formatAvailability(value: string | null): string {
  if (value === null) return '—';
  return formatRelativeTime(value) || value;
}

function formatAbsolute(value: string | null): string {
  if (value === null) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return formatDateTime(d, { dateStyle: 'short', timeStyle: 'medium' });
}

function shortClass(fqn: string): string {
  return fqn.split('\\').pop() ?? fqn;
}

const QueueTab: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<QueueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await membersApi.getQueueSummary();
      setData(res.data);
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = async (id: string) => {
    setActingOn(id);
    try {
      await membersApi.retryFailedMessage(id);
      setToast(t('system.queue.action.retrySuccess'));
      await load();
    } catch (e) {
      setError((e as { message?: string })?.message ?? String(e));
    } finally {
      setActingOn(null);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(t('system.queue.action.confirmRemove'))) return;
    setActingOn(id);
    try {
      await membersApi.removeFailedMessage(id);
      setToast(t('system.queue.action.removeSuccess'));
      await load();
    } catch (e) {
      setError((e as { message?: string })?.message ?? String(e));
    } finally {
      setActingOn(null);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} alignItems="center">
        <Box sx={{ flex: 1 }} />
        <Tooltip title={t('system.queue.refresh')}>
          <IconButton onClick={load} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && data === null ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : data === null ? null : (
        <>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <CountCard
              label={t('system.queue.counts.pending')}
              hint={t('system.queue.pendingHint')}
              value={data.counts.pending}
              color="primary.main"
            />
            <CountCard
              label={t('system.queue.counts.scheduled')}
              hint={t('system.queue.scheduledHint')}
              value={data.counts.scheduled}
              color="text.secondary"
            />
            <CountCard
              label={t('system.queue.counts.inFlight')}
              hint={t('system.queue.inFlightHint')}
              value={data.counts.inFlight}
              color="text.secondary"
            />
            <CountCard
              label={t('system.queue.counts.failed')}
              hint={t('system.queue.failedHint')}
              value={data.counts.failed}
              color={data.counts.failed > 0 ? 'error.main' : 'text.secondary'}
            />
          </Stack>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {data.oldestPendingAt === null
                ? t('system.queue.oldestPendingNone')
                : (
                  <>
                    {t('system.queue.oldestPending')}{' '}
                    <Tooltip title={formatAbsolute(data.oldestPendingAt)}>
                      <strong>{formatRelative(data.oldestPendingAt)}</strong>
                    </Tooltip>
                  </>
                )}
            </Typography>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
            {t('system.queue.failedTitle')}
          </Typography>

          {data.failed.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              {t('system.queue.failedEmpty')}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('system.queue.col.id')}</TableCell>
                    <TableCell>{t('system.queue.col.messageType')}</TableCell>
                    <TableCell>{t('system.queue.col.messagePreview')}</TableCell>
                    <TableCell>{t('system.queue.col.errorClass')}</TableCell>
                    <TableCell>{t('system.queue.col.errorMessage')}</TableCell>
                    <TableCell>{t('system.queue.col.failedAt')}</TableCell>
                    <TableCell align="right">{t('system.queue.col.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.failed.map((m) => (
                    <TableRow key={m.id ?? m.messageClass}>
                      <TableCell>{m.id ?? '—'}</TableCell>
                      <TableCell>
                        <Tooltip title={m.messageClass}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {shortClass(m.messageClass)}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {m.messagePreview || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={m.errorClass ?? ''}>
                          <span style={{ fontSize: '0.8rem' }}>
                            {m.errorClass !== null ? (m.errorClass.split('\\').pop() ?? '—') : '—'}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 360 }}>
                        <Typography
                          variant="body2"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={m.errorMessage ?? ''}
                        >
                          {m.errorMessage ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={formatAbsolute(m.failedAt)}>
                          <span>{formatRelative(m.failedAt)}</span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Button
                            size="small"
                            startIcon={<ReplayIcon />}
                            onClick={() => m.id && retry(m.id)}
                            disabled={m.id === null || actingOn === m.id}
                          >
                            {t('system.queue.action.retry')}
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => m.id && remove(m.id)}
                            disabled={m.id === null || actingOn === m.id}
                          >
                            {t('system.queue.action.remove')}
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
            {t('system.queue.queuedTitle')}
          </Typography>

          {data.queued.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              {t('system.queue.queuedEmpty')}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('system.queue.col.id')}</TableCell>
                    <TableCell>{t('system.queue.col.messageType')}</TableCell>
                    <TableCell>{t('system.queue.col.messagePreview')}</TableCell>
                    <TableCell align="right">{t('system.queue.col.retryCount')}</TableCell>
                    <TableCell>{t('system.queue.col.availableAt')}</TableCell>
                    <TableCell>{t('system.queue.col.redeliveredAt')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.queued.map((m) => (
                    <TableRow key={m.id ?? m.messageClass}>
                      <TableCell>{m.id ?? '—'}</TableCell>
                      <TableCell>
                        <Tooltip title={m.messageClass}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {shortClass(m.messageClass)}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {m.messagePreview || '—'}
                        </span>
                      </TableCell>
                      <TableCell align="right">{m.retryCount}</TableCell>
                      <TableCell>
                        {m.availableAt === null ? '—' : (
                          <Tooltip title={formatAbsolute(m.availableAt)}>
                            <span>{formatAvailability(m.availableAt)}</span>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {m.redeliveredAt === null ? '—' : (
                          <Tooltip title={formatAbsolute(m.redeliveredAt)}>
                            <span>{formatRelative(m.redeliveredAt)}</span>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <Snackbar
        open={toast !== null}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast ?? ''}
      />
    </Box>
  );
};

interface CountCardProps {
  label: string;
  hint: string;
  value: number;
  color: string;
}

const CountCard: React.FC<CountCardProps> = ({ label, hint, value, color }) => (
  <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}
    </Typography>
    <Typography variant="h4" sx={{ fontWeight: 700, color, lineHeight: 1.1, my: 0.5 }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {hint}
    </Typography>
  </Paper>
);

export default QueueTab;
