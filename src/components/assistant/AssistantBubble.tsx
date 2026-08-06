import { Fab, Drawer, Box, IconButton, useTheme, useMediaQuery, Tooltip } from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { AssistantChat } from './AssistantChat';
import { tokens } from '@/styles/tokens';

export const AssistantBubble = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const location = useLocation();

  const open = useUIStore((s) => s.assistantBubbleOpen);
  const setOpen = useUIStore((s) => s.setAssistantBubbleOpen);
  const toggle = useUIStore((s) => s.toggleAssistantBubble);

  // Hide FAB on the dedicated assistant page to avoid duplication
  const onAssistantPage = location.pathname.startsWith('/assistant');

  const panelWidth = isMobile ? '100%' : 400;
  const panelHeight = isMobile ? '85vh' : 560;

  return (
    <>
      {!onAssistantPage && (
        <Tooltip title="Work Monitor assistant" placement="left">
          <Fab
            color="primary"
            aria-label="Open Work Monitor assistant"
            onClick={toggle}
            sx={{
              position: 'fixed',
              right: { xs: 16, sm: 24 },
              bottom: { xs: 16, sm: 24 },
              zIndex: (t) => t.zIndex.speedDial,
              bgcolor: tokens.brand.primary,
              width: 56,
              height: 56,
              boxShadow: `0 8px 24px ${`color-mix(in srgb, ${tokens.brand.primary} 40%, transparent)`}`,
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
              },
            }}
          >
            <SmartToyOutlinedIcon />
          </Fab>
        </Tooltip>
      )}

      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: panelWidth,
            height: isMobile ? panelHeight : '100%',
            maxHeight: isMobile ? panelHeight : '100%',
            borderRadius: isMobile ? '20px 20px 0 0' : 0,
            bgcolor: isDarkMode ? 'rgba(22, 20, 28, 0.98)' : '#fff',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ flex: 1, minHeight: 0, height: '100%' }}>
          <AssistantChat
            variant="compact"
            onNavigateAway={() => setOpen(false)}
            headerActions={
              <>
                <Tooltip title="Open full page">
                  <IconButton
                    size="small"
                    aria-label="Open full assistant page"
                    onClick={() => {
                      setOpen(false);
                      navigate('/assistant');
                    }}
                  >
                    <OpenInFullIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <IconButton
                  size="small"
                  aria-label="Close assistant"
                  onClick={() => setOpen(false)}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </>
            }
          />
        </Box>
      </Drawer>
    </>
  );
};
