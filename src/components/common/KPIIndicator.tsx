import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import { getKpiIndicatorColor } from '@/utils/colorUtils';
import { formatPercent } from '@/utils/formatters';
import { tokens } from '@/styles/tokens';

interface KPIIndicatorProps {
  title: string;
  current: number;
  target: number;
  unit?: string;
}

export const KPIIndicator = ({ title, current, target, unit = '' }: KPIIndicatorProps) => {
  const rate = target > 0 ? (current / target) * 100 : 100;
  const color = getKpiIndicatorColor(current, target);

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover': {
          boxShadow: tokens.shadow.cardHover,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 600, fontSize: 13 }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: tokens.brand.primary50,
              color: tokens.brand.primary,
            }}
          >
            <TrendingUpOutlinedIcon fontSize="small" />
          </Box>
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 700, color, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {current}
          {unit}
          <Typography
            component="span"
            variant="body2"
            color="text.secondary"
            sx={{ fontWeight: 500, ml: 0.5 }}
          >
            / {target}
            {unit}
          </Typography>
        </Typography>

        <Box sx={{ mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(rate, 100)}
            sx={{
              height: 8,
              borderRadius: tokens.radius.pill,
              bgcolor: tokens.surface.borderLight,
              '& .MuiLinearProgress-bar': {
                borderRadius: tokens.radius.pill,
                bgcolor: color,
              },
            }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontWeight: 500 }}>
          {formatPercent(rate)} of target
        </Typography>
      </CardContent>
    </Card>
  );
};
