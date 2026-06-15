import { Box, Card, CardContent, Skeleton, useTheme } from '@mui/material';

export const StatCardSkeleton = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card
      sx={{
        borderRadius: '20px',
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.4)' : '#fff',
        boxShadow: isDarkMode ? 'none' : '0 4px 20px rgba(26, 22, 37, 0.03)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Skeleton variant="text" width={120} height={20} sx={{ mb: 1, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
            <Skeleton variant="text" width={160} height={16} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
          </Box>
          <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mt: 3 }}>
          <Skeleton variant="text" width={100} height={50} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
        </Box>
      </CardContent>
    </Card>
  );
};

export const ChartSkeleton = ({ height = 300 }: { height?: number }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card
      sx={{
        borderRadius: '24px',
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.4)' : '#fff',
        boxShadow: isDarkMode ? 'none' : '0 4px 20px rgba(26, 22, 37, 0.03)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
        height: '100%',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Skeleton variant="text" width={180} height={32} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
        <Skeleton variant="rectangular" width={100} height={32} sx={{ borderRadius: '12px', bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
      </Box>
      <Skeleton 
        variant="rectangular" 
        height={height} 
        sx={{ 
          borderRadius: '16px', 
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          flex: 1 
        }} 
      />
    </Card>
  );
};

export const ActivitySkeleton = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Card
      sx={{
        borderRadius: '24px',
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.4)' : '#fff',
        boxShadow: isDarkMode ? 'none' : '0 4px 20px rgba(26, 22, 37, 0.03)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
        height: '100%',
      }}
    >
      <Box sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="text" width={150} height={32} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
      </Box>
      <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.5, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
              <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
};
