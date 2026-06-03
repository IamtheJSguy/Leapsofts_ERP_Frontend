import { Link, Typography, Box } from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import type { Message } from '@/types';

interface FileMessageProps {
  message: Message;
}

export const FileMessage = ({ message }: FileMessageProps) => (
  <Box className="flex items-center gap-2 p-2 border rounded">
    <InsertDriveFileIcon color="primary" />
    {message.fileUrl ? (
      <Link href={message.fileUrl} target="_blank" rel="noopener">
        {message.content || 'Download file'}
      </Link>
    ) : (
      <Typography variant="body2">{message.content}</Typography>
    )}
  </Box>
);
