import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  InputAdornment,
  Divider,
  useTheme,
} from '@mui/material';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {
  useAiConfig,
  useUpdateAiKeys,
  type AiProviderType,
} from '@/hooks/api/useAi';
import { useUIStore } from '@/store/useUIStore';
import { showApiError } from '@/utils/apiError';
import { tokens } from '@/styles/tokens';

interface AiApiKeyModalProps {
  open: boolean;
  onClose: () => void;
}

export const AiApiKeyModal = ({ open, onClose }: AiApiKeyModalProps) => {
  const { data: config } = useAiConfig({ enabled: open });
  const updateKeys = useUpdateAiKeys();
  const addToast = useUIStore((s) => s.addToast);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [preferredProvider, setPreferredProvider] = useState<AiProviderType>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showClaudeKey, setShowClaudeKey] = useState(false);

  useEffect(() => {
    if (config && open) {
      setPreferredProvider(config.preferredProvider || 'gemini');
      setGeminiKey('');
      setClaudeKey('');
    }
  }, [config, open]);

  const tokensUsed = config?.tokensUsed ?? 0;
  const tokenLimit = config?.effectiveTokenLimit ?? 10000;
  const usagePercent =
    tokenLimit > 0 ? Math.min(100, Math.round((tokensUsed / tokenLimit) * 100)) : 100;

  const handleSave = () => {
    const payload: {
      preferredProvider?: AiProviderType;
      geminiApiKey?: string | null;
      claudeApiKey?: string | null;
    } = {
      preferredProvider,
    };

    if (geminiKey.trim()) {
      payload.geminiApiKey = geminiKey.trim();
    }
    if (claudeKey.trim()) {
      payload.claudeApiKey = claudeKey.trim();
    }

    updateKeys.mutate(payload, {
      onSuccess: () => {
        addToast({
          message: 'Lumi preferences and API keys updated',
          severity: 'success',
        });
        setGeminiKey('');
        setClaudeKey('');
        onClose();
      },
      onError: (err) => showApiError(err),
    });
  };

  const handleClearKey = (provider: AiProviderType) => {
    updateKeys.mutate(
      provider === 'gemini' ? { geminiApiKey: null } : { claudeApiKey: null },
      {
        onSuccess: () => {
          addToast({
            message: `${provider === 'gemini' ? 'Gemini' : 'Claude'} API key removed`,
            severity: 'info',
          });
        },
        onError: (err) => showApiError(err),
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
        <KeyOutlinedIcon sx={{ color: tokens.brand.primary }} />
        Lumi Token Quota & Personal API Keys
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Each user receives a limited platform token allocation managed by the administrator.
          Add your own Gemini or Claude API key for unlimited personal usage.
        </Typography>

        {/* Quota Card */}
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '16px',
            bgcolor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(93, 26, 137, 0.04)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(93, 26, 137, 0.12)'}`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Platform Token Allocation
            </Typography>
            <Chip
              size="small"
              label={`${tokensUsed.toLocaleString()} / ${tokenLimit.toLocaleString()} tokens`}
              color={usagePercent >= 90 ? 'error' : usagePercent >= 70 ? 'warning' : 'primary'}
              sx={{ fontWeight: 700 }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={usagePercent}
            color={usagePercent >= 90 ? 'error' : usagePercent >= 70 ? 'warning' : 'primary'}
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            {config?.remainingTokens?.toLocaleString() ?? 0} free platform tokens remaining
            {config?.totalByokTokensUsed
              ? ` · ${config.totalByokTokensUsed.toLocaleString()} tokens used via your personal key`
              : ''}
          </Typography>
        </Box>

        {/* Preferred Model Provider */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Default Lumi Provider
          </Typography>
          <ToggleButtonGroup
            value={preferredProvider}
            exclusive
            fullWidth
            size="small"
            onChange={(_, val) => {
              if (val) setPreferredProvider(val);
            }}
          >
            <ToggleButton value="gemini" sx={{ fontWeight: 700, textTransform: 'none' }}>
              Google Gemini (2.5 Flash)
            </ToggleButton>
            <ToggleButton value="claude" sx={{ fontWeight: 700, textTransform: 'none' }}>
              Anthropic Claude (Sonnet 4)
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Gemini API Key */}
        <Box sx={{ mb: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Google Gemini API Key
            </Typography>
            {config?.hasGeminiKey && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  size="small"
                  icon={<CheckCircleOutlineIcon />}
                  label={`Saved (${config.geminiApiKeyHint})`}
                  color="success"
                  variant="outlined"
                />
                <IconButton
                  size="small"
                  color="error"
                  title="Remove saved Gemini key"
                  onClick={() => handleClearKey('gemini')}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
          <TextField
            fullWidth
            size="small"
            type={showGeminiKey ? 'text' : 'password'}
            placeholder={
              config?.hasGeminiKey
                ? 'Enter a new key to replace saved Gemini key...'
                : 'AIzaSy...'
            }
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowGeminiKey((s) => !s)}
                    edge="end"
                  >
                    {showGeminiKey ? (
                      <VisibilityOffOutlinedIcon fontSize="small" />
                    ) : (
                      <VisibilityOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Claude API Key */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Anthropic Claude API Key
            </Typography>
            {config?.hasClaudeKey && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip
                  size="small"
                  icon={<CheckCircleOutlineIcon />}
                  label={`Saved (${config.claudeApiKeyHint})`}
                  color="success"
                  variant="outlined"
                />
                <IconButton
                  size="small"
                  color="error"
                  title="Remove saved Claude key"
                  onClick={() => handleClearKey('claude')}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
          <TextField
            fullWidth
            size="small"
            type={showClaudeKey ? 'text' : 'password'}
            placeholder={
              config?.hasClaudeKey
                ? 'Enter a new key to replace saved Claude key...'
                : 'sk-ant-api03-...'
            }
            value={claudeKey}
            onChange={(e) => setClaudeKey(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowClaudeKey((s) => !s)}
                    edge="end"
                  >
                    {showClaudeKey ? (
                      <VisibilityOffOutlinedIcon fontSize="small" />
                    ) : (
                      <VisibilityOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={updateKeys.isPending}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: tokens.brand.primary,
          }}
        >
          {updateKeys.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
