import { Box, Typography, Paper } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { tokens } from '@/styles/tokens';
import type { AppUsageBucket } from '@/types';

export const formatDurationSec = (sec: number) => {
  const total = Math.max(0, Math.round(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

export const UsageBucketChart = ({
  buckets,
  isDarkMode,
  emptyLabel,
}: {
  buckets: AppUsageBucket[];
  isDarkMode: boolean;
  emptyLabel: string;
}) => {
  const chartData = [...buckets]
    .sort((a, b) => b.activeSec - a.activeSec)
    .slice(0, 12)
    .map((b) => ({
      name: b.key.length > 28 ? `${b.key.slice(0, 26)}…` : b.key,
      fullName: b.key,
      activeSec: b.activeSec,
      durationSec: b.durationSec,
      segments: b.segments,
    }));

  if (chartData.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', py: 4, textAlign: 'center' }}>
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Box>
      <Box sx={{ width: '100%', height: Math.max(220, chartData.length * 36) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke={isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
            />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDarkMode ? 'rgba(255,255,255,0.55)' : tokens.text.secondary, fontSize: 11 }}
              tickFormatter={(v) => formatDurationSec(Number(v))}
            />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              width={140}
              tick={{ fill: isDarkMode ? 'rgba(255,255,255,0.7)' : tokens.text.secondary, fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => formatDurationSec(Number(value))}
              contentStyle={{
                backgroundColor: isDarkMode ? 'rgba(30, 27, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                borderRadius: '12px',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                fontSize: '0.8rem',
              }}
            />
            <Legend
              formatter={(value) => (value === 'activeSec' ? 'Active time' : 'Duration')}
              wrapperStyle={{ fontSize: '0.75rem', fontWeight: 700 }}
            />
            <Bar dataKey="activeSec" fill={tokens.brand.primary} radius={[0, 8, 8, 0]} barSize={10} />
            <Bar dataKey="durationSec" fill={isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(93, 26, 137, 0.22)'} radius={[0, 8, 8, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </Box>

      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {chartData.map((row) => (
          <Paper
            key={row.fullName}
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: '12px',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              alignItems: 'center',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap sx={{ fontWeight: 750 }}>
                {row.fullName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {row.segments} segment{row.segments === 1 ? '' : 's'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: tokens.brand.primary }}>
                {formatDurationSec(row.activeSec)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatDurationSec(row.durationSec)} duration
              </Typography>
            </Box>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};
