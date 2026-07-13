import { Card, CardContent, Typography, Box, LinearProgress, useTheme, alpha } from '@mui/material';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { getKpiIndicatorColor } from '@/utils/colorUtils';
import { formatPercent } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';

interface KPIIndicatorProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
}

const getIcon = (title: string, color: string) => {
  const normalized = title.toLowerCase();
  const sx = { fontSize: 20, color };
  if (normalized.includes('connection')) return <PeopleAltOutlinedIcon sx={sx} />;
  if (normalized.includes('accept')) return <CheckCircleOutlinedIcon sx={sx} />;
  if (normalized.includes('message')) return <MessageOutlinedIcon sx={sx} />;
  if (normalized.includes('meeting')) return <CalendarTodayOutlinedIcon sx={sx} />;
  return <TrendingUpOutlinedIcon sx={sx} />;
};

export const KPIIndicator = ({ title, current, target, unit = '' }: KPIIndicatorProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const rate = target > 0 ? (current / target) * 100 : 100;
  const color = getKpiIndicatorColor(current, target);

  // Dynamic mockup trend data based on current target completion
  const trendText = rate >= 100 ? '+18.4%' : rate >= 70 ? '+5.2%' : '-2.1%';
  const trendColor = rate >= 100 ? tokens.semantic.success : rate >= 70 ? tokens.brand.accent : tokens.semantic.error;

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 4,
        bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.4)' : '#FFFFFF',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
        /* backdropFilter: isDarkMode (removed for performance) */ ? 'blur(8px)' : 'none',
        boxShadow: isDarkMode 
          ? '0 4px 20px rgba(0, 0, 0, 0.15)' 
          : '0 4px 20px rgba(26, 22, 37, 0.02)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDarkMode 
            ? '0 12px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(93, 26, 137, 0.15)' 
            : '0 12px 30px rgba(26, 22, 37, 0.06), 0 0 0 1px rgba(93, 26, 137, 0.08)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="body2"
            sx={{ 
              fontWeight: 700, 
              fontSize: '0.82rem', 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : tokens.text.secondary,
              letterSpacing: '0.01em'
            }}
          >
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Trend percentage badge */}
            <Box
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: trendColor,
                bgcolor: alpha(trendColor, isDarkMode ? 0.12 : 0.08),
                border: `1px solid ${alpha(trendColor, isDarkMode ? 0.2 : 0.1)}`,
              }}
            >
              {trendText}
            </Box>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(color, isDarkMode ? 0.12 : 0.08),
                border: `1px solid ${alpha(color, isDarkMode ? 0.25 : 0.15)}`,
              }}
            >
              {getIcon(title, color)}
            </Box>
          </Box>
        </Box>

        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            color: isDarkMode ? '#FFF' : tokens.text.primary, 
            letterSpacing: '-0.03em', 
            lineHeight: 1.2,
            mb: 1
          }}
        >
          {current}
          {unit}
          <Typography
            component="span"
            variant="body2"
            sx={{ 
              fontWeight: 500, 
              ml: 0.5, 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : tokens.text.secondary 
            }}
          >
            / {target}
            {unit}
          </Typography>
        </Typography>

        {/* Dynamic Vector Sparkline SVG Graphic */}
        <Box sx={{ height: 35, width: '100%', mt: 1.5, mb: 1, opacity: 0.75 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`sparkline-grad-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,25 Q15,8 30,18 T60,4 T90,14 L100,6 L100,30 L0,30 Z"
              fill={`url(#sparkline-grad-${title.replace(/\s+/g, '-')})`}
            />
            <path
              d="M0,25 Q15,8 30,18 T60,4 T90,14 L100,6"
              fill="none"
              stroke={color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Box>

        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(rate, 100)}
            sx={{
              height: 4,
              borderRadius: tokens.radius.pill,
              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : tokens.surface.borderLight,
              '& .MuiLinearProgress-bar': {
                borderRadius: tokens.radius.pill,
                bgcolor: color,
              },
            }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : tokens.text.muted, 
              fontWeight: 600,
              fontSize: '0.72rem'
            }}
          >
            {formatPercent(rate)} completed
          </Typography>
          {rate >= 100 && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: tokens.semantic.success, 
                fontWeight: 700,
                fontSize: '0.72rem'
              }}
            >
              Target Met
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
