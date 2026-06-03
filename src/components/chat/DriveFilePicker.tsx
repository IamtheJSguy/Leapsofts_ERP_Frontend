import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Button,
} from '@mui/material';
import { useDriveFiles, useDriveAuthUrl, useShareDriveFile } from '@/hooks/api/useDrive';
import { useChatStore } from '@/store/useChatStore';

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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth onTransitionEnter={handleOpen}>
      <DialogTitle>Google Drive Files</DialogTitle>
      <DialogContent>
        <Button onClick={handleConnect} sx={{ mb: 2 }}>
          Connect Google Drive
        </Button>
        {isFetching ? (
          <CircularProgress />
        ) : (
          <List>
            {(files as DriveFile[]).map((file) => (
              <ListItemButton key={file.id} onClick={() => handleShare(file)}>
                <ListItemText primary={file.name} />
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};
