import { Box, Button } from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ForumIcon from '@mui/icons-material/Forum';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { tokens } from '@/styles/tokens';

interface QuickAccessPresetsProps {
  activePreset: string | null;
  onSelectPreset: (preset: string) => void;
}

const PRESETS = [
  { id: 'agent_performance', label: 'Agent Performance', icon: BarChartIcon },
  { id: 'outreach_funnel', label: 'Outreach Funnel', icon: TrendingUpIcon },
  { id: 'template_sentiment', label: 'Template Sentiment', icon: ForumIcon },
  { id: 'monthly_exports', label: 'Monthly Exports', icon: FileDownloadIcon },
];

export const QuickAccessPresets = ({ activePreset, onSelectPreset }: QuickAccessPresetsProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mb: 4,
      }}
    >
      {PRESETS.map((preset) => {
        const Icon = preset.icon;
        const isActive = activePreset === preset.id;
        return (
          <Button
            key={preset.id}
            onClick={() => onSelectPreset(preset.id)}
            variant={isActive ? 'contained' : 'outlined'}
            startIcon={<Icon sx={{ color: isActive ? '#FFFFFF' : tokens.brand.primary }} />}
            sx={{
              borderRadius: '16px',
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.9rem',
              borderColor: tokens.surface.border,
              backgroundColor: isActive ? tokens.brand.primary : 'transparent',
              color: isActive ? '#FFFFFF' : tokens.text.primary,
              boxShadow: isActive ? '0 8px 16px rgba(93, 26, 137, 0.15)' : 'none',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              '&:hover': {
                backgroundColor: isActive ? tokens.brand.primaryDark : tokens.brand.primary50,
                borderColor: tokens.brand.primary,
                transform: 'translateY(-2px)',
                boxShadow: isActive ? '0 12px 20px rgba(93, 26, 137, 0.2)' : 'none',
              },
            }}
          >
            {preset.label}
          </Button>
        );
      })}
    </Box>
  );
};
