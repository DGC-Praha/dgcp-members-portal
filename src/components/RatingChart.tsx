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
    return d.toLocaleDateString('cs-CZ', { month: 'short', year: '2-digit' });
  };

  return (
    <Box>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={{ stroke: theme.palette.divider }}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={false}
            width={40}
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
              dot={{ r: 3, fill: '#2e7d32' }}
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
              dot={{ r: 3, fill: '#1565c0' }}
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
