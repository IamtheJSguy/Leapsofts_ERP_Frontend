import { useState } from 'react';
import { Box, IconButton, Modal, Typography, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Message, User } from '@/types';
import { chatMentionSx, sanitizeChatHtml } from '@/utils/chatHtml';
import { tokens } from '@/styles/tokens';

interface FileMessageProps {
  message: Message;
  isOwn?: boolean;
  mentionableUsers?: User[];
}

export const FileMessage = ({ message, isOwn = false, mentionableUsers = [] }: FileMessageProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!message.fileUrl) {
    return <Typography variant="body2">{message.content || 'Attachment'}</Typography>;
  }

  const alt = message.content || 'Chat image';

  return (
    <Box sx={{ width: '100%' }}>
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
          overflow: 'hidden',
          borderRadius: message.content?.trim() ? '16px 16px 0 0' : '16px',
        }}
      >
        <Box
          component="img"
          src={message.fileUrl}
          alt={alt}
          sx={{
            display: 'block',
            width: '100%',
            maxWidth: '100%',
            maxHeight: 360,
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
        <Box
          className="prose tiptap-content"
          sx={{
            px: 1.75,
            pt: 1.25,
            pb: 1.25,
            fontSize: '0.85rem',
            fontWeight: 500,
            lineHeight: 1.5,
            wordBreak: 'break-word',
            color: isOwn ? '#000' : 'text.primary',
            '& p': { m: 0 },
            '& ul': { m: 0, pl: 2, listStyleType: 'disc' },
            '& ol': { m: 0, pl: 2, listStyleType: 'decimal' },
            '& a': {
              color: isOwn ? '#000' : tokens.brand.primary,
              textDecoration: 'underline',
            },
            '& mark': {
              backgroundColor: '#ffcc00',
              color: '#000',
              borderRadius: '2px',
              padding: '0 2px',
            },
            ...chatMentionSx,
          }}
          dangerouslySetInnerHTML={{
            __html: sanitizeChatHtml(message.content, mentionableUsers),
          }}
        />
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
