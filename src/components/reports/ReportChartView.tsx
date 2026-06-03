import { Box } from '@mui/material';
import { chartSeries } from '@/styles/tokens';
import {
  BarChart,
  Bar,
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
  <Box sx={{ width: '100%', height: 300, mt: 2 }}>
    {title && (
      <Box component="p" sx={{ fontWeight: 600, mb: 1 }}>
        {title}
      </Box>
    )}
    <ResponsiveContainer>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill={chartSeries.primary} />
      </BarChart>
    </ResponsiveContainer>
  </Box>
);
