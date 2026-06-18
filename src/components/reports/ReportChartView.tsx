import { Box, Typography } from '@mui/material';
import { tokens } from '@/styles/tokens';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ReportChartViewProps {
  data: { name: string; value: number }[];
  title?: string;
}

export const ReportChartView = ({ data, title }: ReportChartViewProps) => (
  <Box
    sx={{
      width: '100%',
      height: 320,
      p: 3,
      borderRadius: '20px',
      border: `1px solid ${tokens.surface.borderLight}`,
      backgroundColor: '#FFFFFF',
      boxShadow: tokens.shadow.card,
    }}
  >
    {title && (
      <Typography variant="subtitle1" fontWeight={600} color={tokens.brand.primary} mb={2}>
        {title}
      </Typography>
    )}
    <ResponsiveContainer width="100%" height="85%">
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={tokens.brand.primary} stopOpacity={0.4} />
            <stop offset="95%" stopColor={tokens.brand.primary} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E4EF" />
        <XAxis dataKey="name" tick={{ fill: tokens.text.muted, fontSize: 12 }} />
        <YAxis tick={{ fill: tokens.text.muted, fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            border: `1px solid ${tokens.surface.border}`,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="value"
          stroke={tokens.brand.primary}
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorValue)"
          name="Action Count"
        />
      </AreaChart>
    </ResponsiveContainer>
  </Box>
);
