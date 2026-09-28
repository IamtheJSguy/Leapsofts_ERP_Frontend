import {
  Box,
  CircularProgress,
  Popover,
  Typography,
  useTheme,
} from '@mui/material';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import type { SvgIconComponent } from '@mui/icons-material';
import { tokens } from '@/styles/tokens';
import { formatDateTime } from '@/utils/formatters';
import { useLeadHistory } from '@/hooks/api/useLeads';
import type { LeadTimelineEventType } from '@/types';

type EventVisual = { icon: SvgIconComponent; color: string };

const EVENT_VISUALS: Record<LeadTimelineEventType, EventVisual> = {
  created: { icon: PersonAddAltOutlinedIcon, color: tokens.brand.primaryLight },
  connection: { icon: HandshakeOutlinedIcon, color: '#3B82F6' },
  message: { icon: ForumOutlinedIcon, color: '#10B981' },
  follow_up: { icon: ReplayOutlinedIcon, color: '#FBBF24' },
  qualified: { icon: StarOutlineIcon, color: tokens.brand.accent },
};

const FALLBACK_VISUAL: EventVisual = {
  icon: ForumOutlinedIcon,
  color: tokens.semantic.neutral,
};

type LeadTimelinePopoverProps = {
  leadId: string | null;
  anchorEl: HTMLElement | null;
  onClose: () => void;
};

export const LeadTimelinePopover = ({
  leadId,
  anchorEl,
  onClose,
}: LeadTimelinePopoverProps) => {
  const muiTheme = useTheme();
  const isDarkMode = muiTheme.palette.mode === 'dark';
  const { data: events = [], isLoading, isError } = useLeadHistory(leadId ?? undefined);

  const message = (text: string) => (
    <Typography
      variant="body2"
      sx={{ color: 'text.secondary', fontWeight: 600, py: 2, textAlign: 'center' }}
    >
      {text}
    </Typography>
  );

  return (
    <Popover
      open={!!anchorEl && !!leadId}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: 340,
            maxHeight: 420,
            borderRadius: '18px',
            p: 2,
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.98)' : '#fff',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: tokens.shadow.cardHover,
            backgroundImage: 'none',
          },
        },
      }}
    >
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'text.secondary',
          mb: 1.5,
        }}
      >
        Lead Activity
      </Typography>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2.5 }}>
          <CircularProgress size={22} sx={{ color: tokens.brand.primary }} />
        </Box>
      ) : isError ? (
        message("Couldn't load lead activity.")
      ) : events.length === 0 ? (
        message('No tracked changes yet')
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {events.map((event, index) => {
            const visual = EVENT_VISUALS[event.type] ?? FALLBACK_VISUAL;
            const Icon = visual.icon;
            const isLast = index === events.length - 1;

            return (
              <Box key={event.id} sx={{ display: 'flex', gap: 1.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: `${visual.color}1F`,
                      border: `1px solid ${visual.color}33`,
                      color: visual.color,
                    }}
                  >
                    <Icon sx={{ fontSize: 15 }} />
                  </Box>
                  {!isLast && (
                    <Box
                      sx={{
                        flex: 1,
                        width: '2px',
                        my: 0.5,
                        borderRadius: '1px',
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ pb: isLast ? 0 : 2, minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      color: isDarkMode ? '#fff' : tokens.text.primary,
                    }}
                  >
                    {event.label}
                  </Typography>
                  {event.detail && (
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}
                    >
                      {event.detail}
                    </Typography>
                  )}
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', color: 'text.disabled', mt: 0.25, fontWeight: 600 }}
                  >
                    {formatDateTime(event.at)}
                    {event.byName ? ` · ${event.byName}` : ''}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Popover>
  );
};
