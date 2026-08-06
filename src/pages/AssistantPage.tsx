import { Box, Typography, Card, useTheme } from '@mui/material';
import { AssistantChat } from '@/components/assistant/AssistantChat';
import { tokens } from '@/styles/tokens';

export default function AssistantPage() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Box className="animate-fade-in-up" sx={{ pb: 2, height: { xs: 'auto', md: 'calc(100vh - 140px)' }, minHeight: 520, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            letterSpacing: '-0.025em',
            mb: 0.5,
            color: isDarkMode ? '#fff' : tokens.text.primary,
          }}
        >
          Work Monitor
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: isDarkMode ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
            fontWeight: 500,
            fontSize: '0.92rem',
          }}
        >
          Ask about your leads, meetings, and tasks — then jump straight to the record.
        </Typography>
      </Box>

      <Card
        sx={{
          flex: 1,
          minHeight: 480,
          borderRadius: '20px',
          overflow: 'hidden',
          bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.65)' : 'rgba(255, 255, 255, 0.9)',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: tokens.shadow.card,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AssistantChat variant="full" />
      </Card>
    </Box>
  );
}
