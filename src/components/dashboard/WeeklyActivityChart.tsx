import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
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
import { chartSeries, tokens } from '@/styles/tokens';

interface WeeklyActivityChartProps {
  data: { date: string; connections: number; messages: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'rgba(30, 27, 36, 0.85)',
          /* backdropFilter: 'blur(10px)' (removed for performance) */
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          p: 1.5,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        }}
      >
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, mb: 1, fontSize: '0.75rem' }}>
          {label}
        </Typography>
        {payload.map((pld: any) => (
          <Box key={pld.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, '&:last-child': { mb: 0 } }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: pld.color }} />
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>
              {pld.name === 'connections' ? 'Connections' : 'Messages'}
            </Typography>
            <Typography variant="body2" sx={{ color: pld.color, fontWeight: 700, fontSize: '0.8rem', ml: 'auto' }}>
              {pld.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

export const WeeklyActivityChart = ({ data }: WeeklyActivityChartProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card
      sx={{
        borderRadius: 4,
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.4)' : '#FFFFFF',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
        /* backdropFilter: isDarkMode (removed for performance) */
        boxShadow: isDarkMode 
          ? '0 4px 20px rgba(0, 0, 0, 0.15)' 
          : '0 4px 20px rgba(26, 22, 37, 0.02)',
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 800, 
            fontSize: '0.96rem',
            mb: 3,
            color: isDarkMode ? '#FFF' : tokens.text.primary,
            letterSpacing: '-0.01em',
          }}
        >
          Weekly Activity
        </Typography>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorConnections" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartSeries.connections} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={chartSeries.connections} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartSeries.messages} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={chartSeries.messages} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke={isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} 
            />
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tick={{ fill: isDarkMode ? 'rgba(255,255,255,0.4)' : tokens.text.secondary, fontSize: 11 }} 
              dy={8}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tick={{ fill: isDarkMode ? 'rgba(255,255,255,0.4)' : tokens.text.secondary, fontSize: 11 }} 
              dx={-8}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 15 }} />
            <Area
              type="monotone"
              name="connections"
              dataKey="connections"
              stroke={chartSeries.connections}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorConnections)"
            />
            <Area
              type="monotone"
              name="messages"
              dataKey="messages"
              stroke={chartSeries.messages}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMessages)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
