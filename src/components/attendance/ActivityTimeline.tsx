import { useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Avatar,
  LinearProgress,
  Dialog,
} from '@mui/material';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import MouseIcon from '@mui/icons-material/Mouse';
import InsightsIcon from '@mui/icons-material/Insights';
import { tokens } from '@/styles/tokens';
import { useShiftActivitySamples } from '@/hooks/api/useShifts';
import { format } from 'date-fns';
import type { ActivitySample } from '@/types';

const activityMetricColor = (pct: number) => {
  if (pct >= 60) return tokens.semantic.success;
  if (pct >= 30) return tokens.semantic.warning;
  return tokens.semantic.error;
};

export const ActivityTimeline = ({
  shiftId,
  enabled,
  isDarkMode,
  samples: samplesOverride,
  isLoading: loadingOverride,
}: {
  shiftId?: string;
  enabled: boolean;
  isDarkMode: boolean;
  samples?: ActivitySample[];
  isLoading?: boolean;
}) => {
  const { data: fetchedSamples, isLoading: fetchLoading } = useShiftActivitySamples(
    enabled && !samplesOverride ? shiftId : undefined
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const samples = samplesOverride ?? fetchedSamples;
  const isLoading = loadingOverride ?? fetchLoading;

  const sortedSamples = useMemo(
    () => [...(samples || [])].sort((a, b) => new Date(a.windowStart).getTime() - new Date(b.windowStart).getTime()),
    [samples]
  );

  if (!enabled) return null;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={22} sx={{ color: tokens.brand.primary }} />
      </Box>
    );
  }

  if (sortedSamples.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', display: 'block', py: 1 }}>
        No activity samples recorded.
      </Typography>
    );
  }

  const metric = (label: string, icon: ReactNode, pct: number) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 62 }} title={label}>
      {icon}
      <Box sx={{ flexGrow: 1 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, pct))}
          sx={{
            height: 5,
            borderRadius: 3,
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: activityMetricColor(pct) },
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ fontWeight: 700, color: activityMetricColor(pct), minWidth: 30, textAlign: 'right' }}>
        {Math.round(pct)}%
      </Typography>
    </Box>
  );

  return (
    <>
      <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <InsightsIcon sx={{ fontSize: 14 }} /> Screen Activity
        </Typography>
        {sortedSamples.map((sample: ActivitySample) => (
          <Box
            key={sample._id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              p: 1,
              borderRadius: '10px',
              bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}`,
            }}
          >
            <Avatar
              variant="rounded"
              src={sample.imageUrl}
              onClick={() => setPreviewImage(sample.imageUrl)}
              sx={{ width: 44, height: 32, cursor: 'pointer', borderRadius: '6px', bgcolor: 'rgba(0,0,0,0.08)' }}
            />
            <Typography variant="caption" sx={{ fontWeight: 700, minWidth: 92, color: 'text.secondary' }}>
              {format(new Date(sample.windowStart), 'HH:mm')} -{' '}
              {format(new Date(new Date(sample.windowStart).getTime() + 10 * 60 * 1000), 'HH:mm')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexGrow: 1, flexWrap: 'wrap' }}>
              {metric('Keyboard', <KeyboardIcon sx={{ fontSize: 15, color: 'text.secondary' }} />, sample.keyboardPct)}
              {metric('Mouse', <MouseIcon sx={{ fontSize: 15, color: 'text.secondary' }} />, sample.mousePct)}
              {metric('Combined', <InsightsIcon sx={{ fontSize: 15, color: 'text.secondary' }} />, sample.combinedPct)}
            </Box>
          </Box>
        ))}
      </Box>

      <Dialog open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} maxWidth="lg">
        {previewImage && (
          <Box sx={{ p: 0, lineHeight: 0 }}>
            <img src={previewImage} alt="Activity screenshot" style={{ display: 'block', maxWidth: '100%', maxHeight: '80vh' }} />
          </Box>
        )}
      </Dialog>
    </>
  );
};
