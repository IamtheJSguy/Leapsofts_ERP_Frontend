import { Card, CardContent, Typography } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { chartColors, tokens } from '@/styles/tokens';

interface ConnectionRatioChartProps {
  data: { label: string; value: number }[];
}

export const ConnectionRatioChart = ({ data }: ConnectionRatioChartProps) => (
  <Card>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, fontSize: 16 }}>
        Connection ratios
      </Typography>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: tokens.radius.md,
              border: `1px solid ${tokens.surface.border}`,
              boxShadow: tokens.shadow.card,
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);
