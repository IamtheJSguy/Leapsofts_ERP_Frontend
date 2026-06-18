import { Card, CardContent, Typography, Box, useTheme } from '@mui/material';
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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <Box
        sx={{
          bgcolor: 'rgba(30, 27, 36, 0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          p: 1.5,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: data.payload.fill || data.color }} />
        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>
          {data.name}:
        </Typography>
        <Typography variant="body2" sx={{ color: data.payload.fill || data.color, fontWeight: 700, fontSize: '0.8rem' }}>
          {data.value}
        </Typography>
      </Box>
    );
  }
  return null;
};

export const ConnectionRatioChart = ({ data }: ConnectionRatioChartProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card
      sx={{
        borderRadius: 4,
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.4)' : '#FFFFFF',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
        backdropFilter: isDarkMode ? 'blur(8px)' : 'none',
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
          Connection Ratios
        </Typography>
        <Box sx={{ position: 'relative', width: '100%', height: 260 }}>
          {/* Centered Summary Text Inside Doughnut */}
          <Box
            sx={{
              position: 'absolute',
              top: '46%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 900, 
                color: isDarkMode ? '#FFF' : tokens.text.primary, 
                lineHeight: 1,
                fontSize: '1.4rem',
                letterSpacing: '-0.03em',
              }}
            >
              {total}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : tokens.text.secondary, 
                fontSize: '0.62rem', 
                fontWeight: 700,
                letterSpacing: '0.05em',
                display: 'block', 
                mt: 0.5 
              }}
            >
              TOTAL LEADS
            </Typography>
          </Box>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={80}
                paddingAngle={2}
                stroke={isDarkMode ? 'rgba(30, 27, 36, 0.4)' : '#FFF'}
                strokeWidth={2}
              >
                {data.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 15 }} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};
