import { Card, CardContent, Typography } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { chartSeries, tokens } from '@/styles/tokens';

interface WeeklyActivityChartProps {
  data: { date: string; connections: number; messages: number }[];
}

export const WeeklyActivityChart = ({ data }: WeeklyActivityChartProps) => (
  <Card>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontSize: 16 }}>
        Weekly activity
      </Typography>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={tokens.surface.border} />
          <XAxis dataKey="date" tick={{ fill: tokens.text.secondary, fontSize: 12 }} />
          <YAxis tick={{ fill: tokens.text.secondary, fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.surface.border}`,
              boxShadow: tokens.shadow.card,
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="connections"
            stroke={chartSeries.connections}
            strokeWidth={2}
            dot={{ fill: chartSeries.connections, r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="messages"
            stroke={chartSeries.messages}
            strokeWidth={2}
            dot={{ fill: chartSeries.messages, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);
