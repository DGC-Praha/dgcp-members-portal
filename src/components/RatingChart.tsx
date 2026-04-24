import React, { useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useIsMobile } from '../hooks/useIsMobile';

interface RatingEntry {
  type: string;
  rating: number;
  date: string;
}

interface RatingChartProps {
  ratingHistory: RatingEntry[];
  height?: number;
}

const RatingChart: React.FC<RatingChartProps> = ({ ratingHistory, height = 220 }) => {
  const theme = useTheme();
  const isMobile = useIsMobile();

  const chartData = useMemo(() => {
    // Collect all unique dates, merge iDG and PDGA into single rows
    const dateMap = new Map<string, { date: string; idiscgolf?: number; pdga?: number }>();

    for (const entry of ratingHistory) {
      const existing = dateMap.get(entry.date) ?? { date: entry.date };
      if (entry.type === 'idiscgolf') {
        existing.idiscgolf = entry.rating;
      } else if (entry.type === 'pdga') {
        existing.pdga = entry.rating;
      }
      dateMap.set(entry.date, existing);
    }

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [ratingHistory]);

  const hasIdg = ratingHistory.some((e) => e.type === 'idiscgolf');
  const hasPdga = ratingHistory.some((e) => e.type === 'pdga');

  if (chartData.length < 2) return null;

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  };

  return (
    <Box>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: isMobile ? 4 : 10, left: isMobile ? -16 : -10, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={theme.palette.divider}
            vertical={!isMobile}
          />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: isMobile ? 10 : 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={{ stroke: theme.palette.divider }}
            interval="preserveStartEnd"
            minTickGap={isMobile ? 30 : 10}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: isMobile ? 10 : 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 32 : 40}
          />
          <Tooltip
            labelFormatter={(label) => formatDate(String(label))}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              fontSize: 13,
            }}
          />
          {hasIdg && (
            <Line
              type="monotone"
              dataKey="idiscgolf"
              name="iDiscGolf"
              stroke="#2e7d32"
              strokeWidth={2}
              dot={{ r: isMobile ? 2 : 3, fill: '#2e7d32' }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          )}
          {hasPdga && (
            <Line
              type="monotone"
              dataKey="pdga"
              name="PDGA"
              stroke="#1565c0"
              strokeWidth={2}
              dot={{ r: isMobile ? 2 : 3, fill: '#1565c0' }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default RatingChart;
