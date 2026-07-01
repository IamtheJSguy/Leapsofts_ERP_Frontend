import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Button,
  IconButton,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import DescriptionIcon from '@mui/icons-material/Description';
import TableChartIcon from '@mui/icons-material/TableChart';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useDriveFiles, useDriveAuthUrl, useDriveStatus, useDisconnectDrive } from '@/hooks/api/useDrive';
import { useSendMessage } from '@/hooks/api/useChat';
import { useChatStore } from '@/store/useChatStore';
import { tokens } from '@/styles/tokens';
import type { DriveFile } from '@/types';

/**
 * Map Google Drive MIME types to Material icons and brand colors.
 */
const getMimeInfo = (mimeType?: string): { icon: React.ReactNode; color: string; label: string } => {
  if (!mimeType) return { icon: <InsertDriveFileIcon />, color: '#607D8B', label: 'File' };
  if (mimeType.includes('folder')) return { icon: <FolderIcon />, color: '#FFA000', label: 'Folder' };
  if (mimeType.includes('document') || mimeType.includes('msword') || mimeType === 'application/vnd.google-apps.document')
    return { icon: <DescriptionIcon />, color: '#4285F4', label: 'Document' };
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType === 'application/vnd.google-apps.spreadsheet')
    return { icon: <TableChartIcon />, color: '#0F9D58', label: 'Spreadsheet' };
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || mimeType === 'application/vnd.google-apps.presentation')
    return { icon: <SlideshowIcon />, color: '#F4B400', label: 'Presentation' };
  if (mimeType === 'application/pdf')
    return { icon: <PictureAsPdfIcon />, color: '#EA4335', label: 'PDF' };
  if (mimeType.startsWith('image/'))
    return { icon: <ImageIcon />, color: '#E91E63', label: 'Image' };
  if (mimeType.startsWith('video/'))
    return { icon: <VideoFileIcon />, color: '#9C27B0', label: 'Video' };
  if (mimeType.startsWith('audio/'))
    return { icon: <AudioFileIcon />, color: '#FF5722', label: 'Audio' };
  return { icon: <InsertDriveFileIcon />, color: '#607D8B', label: 'File' };
};

interface DriveFilePickerProps {
  open: boolean;
  onClose: () => void;
}

export const DriveFilePicker = ({ open, onClose }: DriveFilePickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { refetch, data, isFetching } = useDriveFiles(searchQuery);
  const { data: driveStatus, isLoading: statusLoading } = useDriveStatus();
  const driveAuth = useDriveAuthUrl();
  const disconnectDrive = useDisconnectDrive();
  const sendMessage = useSendMessage();
  const { activeConversationId } = useChatStore();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const files = (data?.files || []) as DriveFile[];
  const isConnected = driveStatus?.connected ?? false;

  // Fetch files when dialog opens and drive is connected
  useEffect(() => {
    if (open && isConnected) {
      refetch();
    }
  }, [open, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = () => {
    driveAuth.mutate(undefined, {
      onSuccess: (url) => window.open(url, '_blank', 'width=600,height=700'),
    });
  };

  const handleDisconnect = () => {
    disconnectDrive.mutate();
  };

  const handleSearch = () => {
    if (isConnected) refetch();
  };

  const handleSelect = (file: DriveFile) => {
    if (!activeConversationId) return;

    sendMessage.mutate(
      {
        conversationId: activeConversationId,
        content: file.name,
        type: 'drive_file',
        driveFileId: file.id,
        driveFileName: file.name,
        driveMimeType: file.mimeType,
        driveWebViewLink: file.webViewLink,
        driveIconLink: file.iconLink,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDarkMode ? '#1e1b24' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
          p: 0,
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          fontWeight: 800,
          pb: 0,
          pr: 6,
          pt: 3,
          px: 3,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #4285F4, #0F9D58, #F4B400, #EA4335)',
            flexShrink: 0,
          }}
        >
          <CloudQueueIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            Google Drive
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
            {statusLoading ? (
              <CircularProgress size={12} />
            ) : isConnected ? (
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                label="Connected"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: 'rgba(15, 157, 88, 0.1)',
                  color: '#0F9D58',
                  '& .MuiChip-icon': { color: '#0F9D58' },
                }}
              />
            ) : (
              <Chip
                icon={<CloudOffIcon sx={{ fontSize: '14px !important' }} />}
                label="Not Connected"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  color: 'text.secondary',
                }}
              />
            )}
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          aria-label="Close files picker"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important', px: 3, pb: 3 }}>
        {/* Not Connected State */}
        {!isConnected && !statusLoading && (
          <Box
            sx={{
              py: 5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(66, 133, 244, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CloudQueueIcon sx={{ fontSize: 36, color: '#4285F4' }} />
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Connect Your Google Drive
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 300, lineHeight: 1.6 }}>
              Link your Google Drive account to browse and share files directly in your conversations.
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudQueueIcon />}
              onClick={handleConnect}
              disabled={driveAuth.isPending}
              sx={{
                mt: 1,
                background: 'linear-gradient(135deg, #4285F4, #1a73e8)',
                color: '#fff',
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                px: 4,
                py: 1.25,
                boxShadow: '0 4px 16px rgba(66, 133, 244, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1a73e8, #1557b0)',
                  boxShadow: '0 6px 20px rgba(66, 133, 244, 0.4)',
                },
              }}
            >
              {driveAuth.isPending ? 'Connecting…' : 'Connect Google Drive'}
            </Button>
          </Box>
        )}

        {/* Connected State */}
        {isConnected && (
          <>
            {/* Action Bar */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search files…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    fontSize: '0.85rem',
                    '& fieldset': {
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    },
                    '&:hover fieldset': {
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                    },
                  },
                }}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<LinkOffIcon sx={{ fontSize: '18px !important' }} />}
                onClick={handleDisconnect}
                disabled={disconnectDrive.isPending}
                sx={{
                  flexShrink: 0,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: '#EA4335',
                    color: '#EA4335',
                    bgcolor: 'rgba(234, 67, 53, 0.04)',
                  },
                }}
              >
                Disconnect
              </Button>
            </Box>

            {/* File List */}
            {isFetching ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                <CircularProgress size={28} sx={{ color: '#4285F4' }} />
              </Box>
            ) : files.length === 0 ? (
              <Box sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <InsertDriveFileIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {searchQuery ? 'No files match your search.' : 'No files found in your Drive.'}
                </Typography>
              </Box>
            ) : (
              <List
                sx={{
                  maxHeight: 360,
                  overflow: 'auto',
                  mx: -1,
                  '&::-webkit-scrollbar': { width: '5px' },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': {
                    background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    borderRadius: '10px',
                  },
                }}
              >
                {files.map((file) => {
                  const { icon, color, label } = getMimeInfo(file.mimeType);
                  return (
                    <ListItemButton
                      key={file.id}
                      onClick={() => handleSelect(file)}
                      disabled={sendMessage.isPending}
                      sx={{
                        px: 2,
                        py: 1.5,
                        mb: 0.5,
                        borderRadius: '14px',
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}`,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
                          borderColor: color,
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 44 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            bgcolor: `${color}14`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: color,
                            '& svg': { fontSize: 20 },
                          }}
                        >
                          {icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {file.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
                            {label}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
