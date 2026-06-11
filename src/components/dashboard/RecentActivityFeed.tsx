import { Card, CardContent, Typography, Box, useTheme, alpha } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { tokens } from '@/styles/tokens';

const mockActivities = [
  { id: 1, type: 'connection', text: 'Sarah Connor accepted connection', time: '2 hours ago' },
  { id: 2, type: 'reply', text: 'Bruce Wayne replied to follow-up', time: '4 hours ago' },
  { id: 3, type: 'meeting', text: 'Meeting scheduled with Stark Industries', time: '1 day ago' },
  { id: 4, type: 'campaign', text: 'Weekly automated sync completed', time: '2 days ago' },
];

const getIcon = (type: string, color: string) => {
  const sx = { fontSize: 16, color };
  if (type === 'connection') return <CheckCircleOutlinedIcon sx={sx} />;
  if (type === 'reply') return <ChatBubbleOutlineOutlinedIcon sx={sx} />;
  if (type === 'meeting') return <CalendarTodayOutlinedIcon sx={sx} />;
  return <InfoOutlinedIcon sx={sx} />;
};

const getColor = (type: string) => {
  if (type === 'connection') return tokens.semantic.success;
  if (type === 'reply') return tokens.brand.primaryMuted;
  if (type === 'meeting') return tokens.brand.accent;
  return tokens.semantic.neutral;
};

export const RecentActivityFeed = () => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

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
            mb: 2.5,
            color: isDarkMode ? '#FFF' : tokens.text.primary,
            letterSpacing: '-0.01em',
          }}
        >
          Recent Activity
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {mockActivities.map((act) => {
            const color = getColor(act.type);
            return (
              <Box key={act.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(color, isDarkMode ? 0.12 : 0.06),
                    border: `1px solid ${alpha(color, isDarkMode ? 0.2 : 0.1)}`,
                    mt: 0.25,
                  }}
                >
                  {getIcon(act.type, color)}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.82rem',
                      color: isDarkMode ? 'rgba(255,255,255,0.85)' : tokens.text.primary,
                      lineHeight: 1.3,
                    }}
                  >
                    {act.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDarkMode ? 'rgba(255,255,255,0.4)' : tokens.text.muted,
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      display: 'block',
                      mt: 0.5,
                    }}
                  >
                    {act.time}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};
