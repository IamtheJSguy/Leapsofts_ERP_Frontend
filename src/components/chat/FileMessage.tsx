import { Box, Typography } from '@mui/material';
import type { Message } from '@/types';
import { LinkifiedText } from './LinkifiedText';

interface FileMessageProps {
  message: Message;
  isOwn?: boolean;
}

export const FileMessage = ({ message, isOwn = false }: FileMessageProps) => {
  if (!message.fileUrl) {
    return <Typography variant="body2">{message.content || 'Attachment'}</Typography>;
  }

  return (
    <Box>
      <Box
        component="a"
        href={message.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: 'block', lineHeight: 0 }}
      >
        <Box
          component="img"
          src={message.fileUrl}
          alt={message.content || 'Chat image'}
          sx={{
            display: 'block',
            maxWidth: { xs: 240, sm: 320 },
            maxHeight: 280,
            width: '100%',
            objectFit: 'cover',
            cursor: 'zoom-in',
          }}
        />
      </Box>
      {message.content?.trim() ? (
        <Typography
          variant="body2"
          sx={{
            px: 1.5,
            pt: 1,
            fontSize: '0.85rem',
            fontWeight: 500,
            wordBreak: 'break-word',
            color: isOwn ? '#fff' : 'inherit',
          }}
        >
          <LinkifiedText text={message.content} />
        </Typography>
      ) : null}
    </Box>
  );
};
