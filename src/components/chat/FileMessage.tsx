import { useState } from 'react';
import { Box, IconButton, Modal, Typography, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Message } from '@/types';
import { LinkifiedText } from './LinkifiedText';

interface FileMessageProps {
  message: Message;
  isOwn?: boolean;
}

export const FileMessage = ({ message, isOwn = false }: FileMessageProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!message.fileUrl) {
    return <Typography variant="body2">{message.content || 'Attachment'}</Typography>;
  }

  const alt = message.content || 'Chat image';

  return (
    <Box>
      <Box
        component="button"
        type="button"
        onClick={() => !message.isPending && setLightboxOpen(true)}
        aria-label="View image larger"
        sx={{
          display: 'block',
          lineHeight: 0,
          p: 0,
          m: 0,
          border: 'none',
          background: 'transparent',
          width: '100%',
          cursor: message.isPending ? 'default' : 'zoom-in',
          textAlign: 'left',
          position: 'relative',
        }}
      >
        <Box
          component="img"
          src={message.fileUrl}
          alt={alt}
          sx={{
            display: 'block',
            maxWidth: { xs: 240, sm: 320 },
            maxHeight: 280,
            width: '100%',
            objectFit: 'cover',
            filter: message.isPending ? 'blur(3px) brightness(0.85)' : 'none',
            transition: 'filter 0.3s ease',
          }}
        />
        {message.isPending && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'rgba(0,0,0,0.4)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <CircularProgress size={24} thickness={4} sx={{ color: '#fff' }} />
          </Box>
        )}
      </Box>
      {message.content?.trim() ? (
        <Typography
          variant="body2"
          sx={{
            px: 2,
            pt: 1,
            pb: 1,
            fontSize: '0.85rem',
            fontWeight: 500,
            wordBreak: 'break-word',
            color: isOwn ? '#fff' : 'inherit',
          }}
        >
          <LinkifiedText text={message.content} />
        </Typography>
      ) : null}

      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        aria-label="Image preview"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, sm: 4 },
        }}
      >
        <Box
          sx={{
            position: 'relative',
            outline: 'none',
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconButton
            aria-label="Close image preview"
            onClick={() => setLightboxOpen(false)}
            sx={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 1,
              color: '#fff',
              bgcolor: 'rgba(0,0,0,0.45)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={message.fileUrl}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            sx={{
              display: 'block',
              maxWidth: '96vw',
              maxHeight: '90vh',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: 1,
              boxShadow: '0 12px 48px rgba(0,0,0,0.45)',
            }}
          />
        </Box>
      </Modal>
    </Box>
  );
};
