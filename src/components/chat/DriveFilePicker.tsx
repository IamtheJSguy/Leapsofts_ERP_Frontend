import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Button,
  IconButton,
  Box,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { useDriveFiles, useDriveAuthUrl, useShareDriveFile } from '@/hooks/api/useDrive';
import { useChatStore } from '@/store/useChatStore';
import { tokens } from '@/styles/tokens';

interface DriveFile {
  id: string;
  name: string;
}

interface DriveFilePickerProps {
  open: boolean;
  onClose: () => void;
}

export const DriveFilePicker = ({ open, onClose }: DriveFilePickerProps) => {
  const { refetch, data: files = [], isFetching } = useDriveFiles();
  const driveAuth = useDriveAuthUrl();
  const shareFile = useShareDriveFile();
  const { activeConversationId } = useChatStore();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleOpen = () => {
    refetch();
  };

  const handleConnect = () => {
    driveAuth.mutate(undefined, {
      onSuccess: (url) => window.open(url, '_blank', 'width=600,height=700'),
    });
  };

  const handleShare = (file: DriveFile) => {
    if (!activeConversationId) return;
    shareFile.mutate(
      { fileId: file.id, conversationId: activeConversationId },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      onTransitionEnter={handleOpen}
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDarkMode ? '#1e1b24' : '#fff',
          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
          p: 1.5,
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1, pr: 6, position: 'relative' }}>
        Google Drive Files
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 16, top: 16, color: 'text.secondary' }}
          aria-label="Close files picker"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '12px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Share document files directly into the active team chat room.
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudQueueIcon />}
            onClick={handleConnect}
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#fff',
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: tokens.brand.primaryDark,
                boxShadow: 'none',
              },
            }}
          >
            Connect Drive
          </Button>
        </Box>

        {isFetching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
            <CircularProgress size={24} sx={{ color: tokens.brand.primary }} />
          </Box>
        ) : files.length === 0 ? (
          <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <FolderSharedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              No shared files found. Connect Google Drive to select documents.
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 320, overflow: 'auto' }}>
            {(files as DriveFile[]).map((file) => (
              <ListItemButton
                key={file.id}
                onClick={() => handleShare(file)}
                sx={{
                  px: 2,
                  py: 1.5,
                  mb: 0.75,
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'}`,
                  '&:hover': {
                    bgcolor: isDarkMode ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.008)',
                    borderColor: tokens.brand.primary,
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {file.name}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
