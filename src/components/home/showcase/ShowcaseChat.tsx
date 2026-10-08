import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Badge,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SentimentSatisfiedAltOutlinedIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import TextFormatOutlinedIcon from '@mui/icons-material/TextFormatOutlined';
import SendIcon from '@mui/icons-material/Send';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { tokens } from '@/styles/tokens';

export const ShowcaseChat: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeConv, setActiveConv] = useState('sarah');
  const [messageInput, setMessageInput] = useState('');

  const conversations = [
    {
      id: 'nordic',
      initials: 'EB',
      name: 'Enterprise Board',
      tag: 'Board',
      date: 'Today, 5:42 PM',
      preview: 'Updated "Nordic Enterprise Deal" - closed...',
      online: true,
    },
    {
      id: 'sarah',
      initials: 'SJ',
      name: 'Sarah Jenkins',
      tag: 'VP Sales',
      date: 'Today, 5:16 PM',
      preview: 'Confirmed, reviewed and approved.',
      online: true,
    },
    {
      id: 'eng',
      initials: 'PE',
      name: 'Product Engineering',
      tag: 'Board',
      date: 'Yesterday, 8:20 PM',
      preview: 'Sprint 42 deployment verified on staging...',
      online: true,
    },
    {
      id: 'alex',
      initials: 'AR',
      name: 'Alex Rivera',
      date: 'Oct 6, 4:15 PM',
      preview: 'WebSocket latency benchmark report attached.',
      online: true,
    },
    {
      id: 'marcus',
      initials: 'MV',
      name: 'Marcus Vance',
      date: 'Oct 5, 2:10 PM',
      preview: 'Database sharding migration completed.',
      online: false,
    },
    {
      id: 'elena',
      initials: 'ER',
      name: 'Elena Rostova',
      date: 'Oct 4, 11:30 AM',
      preview: 'New design system tokens exported to GitHub.',
      online: true,
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        height: '480px',
        bgcolor: isDark ? '#14111B' : '#FAF8FD',
        overflow: 'hidden',
      }}
    >
      {/* 1. Left Conversation List Panel */}
      <Box
        sx={{
          width: { xs: '90px', sm: '240px' },
          flexShrink: 0,
          borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
          bgcolor: isDark ? 'rgba(24, 20, 31, 0.7)' : '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search Bar + Add Chat Button */}
        <Box sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <TextField
            size="small"
            placeholder="Search chats..."
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                fontSize: '0.74rem',
                py: 0.2,
                '& fieldset': { borderColor: 'transparent' },
              },
            }}
          />
          <IconButton
            size="small"
            sx={{
              bgcolor: tokens.brand.primary,
              color: '#FFFFFF',
              p: 0.6,
              borderRadius: '10px',
              flexShrink: 0,
              '&:hover': { bgcolor: tokens.brand.primaryDark },
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>

        {/* Conversation Items */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {conversations.map((conv) => {
            const isSelected = activeConv === conv.id;
            return (
              <Box
                key={conv.id}
                onClick={() => setActiveConv(conv.id)}
                sx={{
                  p: 1.25,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  cursor: 'pointer',
                  bgcolor: isSelected
                    ? isDark
                      ? 'rgba(93, 26, 137, 0.28)'
                      : '#F4EEF9'
                    : 'transparent',
                  border: '1px solid',
                  borderColor: isSelected
                    ? isDark
                      ? 'rgba(168, 85, 247, 0.3)'
                      : 'rgba(93, 26, 137, 0.15)'
                    : 'transparent',
                  transition: 'all 0.18s ease',
                  '&:hover': {
                    bgcolor: isSelected
                      ? isDark
                        ? 'rgba(93, 26, 137, 0.35)'
                        : '#F0E8F7'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.03)'
                      : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: conv.online ? '#10B981' : '#9CA3AF',
                      boxShadow: `0 0 0 2px ${isDark ? '#14111B' : '#FFFFFF'}`,
                      minWidth: 10,
                      height: 10,
                      borderRadius: '50%',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#EBE6F3',
                      color: tokens.brand.primary,
                      fontWeight: 800,
                      fontSize: '0.85rem',
                    }}
                  >
                    {conv.initials}
                  </Avatar>
                </Badge>

                <Box sx={{ minWidth: 0, flex: 1, display: { xs: 'none', sm: 'block' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 750,
                          fontSize: '0.82rem',
                          color: isDark ? '#FFFFFF' : tokens.text.primary,
                        }}
                        noWrap
                      >
                        {conv.name}
                      </Typography>
                      {conv.tag && (
                        <Chip
                          label={conv.tag}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.58rem',
                            fontWeight: 750,
                            bgcolor: 'rgba(93, 26, 137, 0.1)',
                            color: tokens.brand.primary,
                            borderRadius: '4px',
                            px: 0.2,
                          }}
                        />
                      )}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: '0.62rem',
                        fontWeight: 600,
                        color: isDark ? 'rgba(255,255,255,0.4)' : tokens.text.muted,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {conv.date}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      color: isDark ? 'rgba(255, 255, 255, 0.55)' : tokens.text.secondary,
                    }}
                    noWrap
                  >
                    {conv.preview}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* 2. Right Conversation Window */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header Bar */}
        <Box
          sx={{
            px: 2.5,
            py: 1.25,
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            bgcolor: isDark ? 'rgba(24, 20, 31, 0.5)' : '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#10B981',
                  boxShadow: `0 0 0 2px ${isDark ? '#14111B' : '#FFFFFF'}`,
                  minWidth: 10,
                  height: 10,
                  borderRadius: '50%',
                },
              }}
            >
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor: tokens.brand.primary,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                }}
              >
                SJ
              </Avatar>
            </Badge>
            <Box>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  lineHeight: 1.2,
                }}
              >
                Sarah Jenkins
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.7rem',
                  color: isDark ? 'rgba(255, 255, 255, 0.45)' : tokens.text.secondary,
                }}
              >
                VP of Growth & Sales · Active now
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <SearchIcon sx={{ fontSize: 19 }} />
            </IconButton>
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <FolderOutlinedIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Message Thread Stream */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {/* 1. Received: Proposals delivered */}
          <Box sx={{ alignSelf: 'flex-start', maxWidth: '75%' }}>
            <Typography sx={{ fontSize: '0.65rem', color: tokens.text.muted, fontWeight: 600, mb: 0.4, ml: 4.5 }}>
              Sarah Jenkins · 04:45 PM
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: tokens.brand.primary, fontSize: '0.7rem', fontWeight: 800 }}>
                SJ
              </Avatar>
              <Box
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                  px: 2,
                  py: 1,
                  borderRadius: '18px 18px 18px 4px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                Hey Huzaifa, the Enterprise Tier proposals have been delivered to our top 5 inbound prospects today.
              </Box>
            </Box>
          </Box>

          {/* 2. Sent: Question */}
          <Box sx={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
            <Box
              sx={{
                bgcolor: '#d1a7fc',
                color: '#000000',
                px: 2,
                py: 0.9,
                borderRadius: '18px 18px 4px 18px',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              Excellent progress Sarah. Did Acme Corp confirm the multi-year SLA terms?
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.4 }}>
              <Typography sx={{ fontSize: '0.62rem', color: tokens.text.muted, fontWeight: 600 }}>
                04:48 PM
              </Typography>
              <DoneAllIcon sx={{ fontSize: 14, color: '#26c6da' }} />
            </Box>
          </Box>

          {/* 3. Received: Contract confirmation */}
          <Box sx={{ alignSelf: 'flex-start', maxWidth: '75%' }}>
            <Typography sx={{ fontSize: '0.65rem', color: tokens.text.muted, fontWeight: 600, mb: 0.4, ml: 4.5 }}>
              Sarah Jenkins · 04:52 PM
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: tokens.brand.primary, fontSize: '0.7rem', fontWeight: 800 }}>
                SJ
              </Avatar>
              <Box
                sx={{
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                  color: isDark ? '#FFFFFF' : tokens.text.primary,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
                  px: 2,
                  py: 1,
                  borderRadius: '18px 18px 18px 4px',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                }}
              >
                Yes! Legal signed off on the enterprise data privacy addendum. We are officially locking in the contract.
              </Box>
            </Box>
          </Box>

          {/* 4. Sent: thanks (with red heart reaction!) */}
          <Box sx={{ alignSelf: 'flex-end', maxWidth: '75%', position: 'relative' }}>
            <Box
              sx={{
                bgcolor: '#d1a7fc',
                color: '#000000',
                px: 2.2,
                py: 0.9,
                borderRadius: '18px 18px 4px 18px',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                position: 'relative',
              }}
            >
              Outstanding work team! Let&apos;s schedule the kickoff sync tomorrow morning.
            </Box>

            {/* Reaction Badge ❤️ */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 12,
                left: 10,
                bgcolor: '#FFFFFF',
                borderRadius: '999px',
                px: 0.8,
                py: 0.2,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.72rem',
                border: '1px solid rgba(0,0,0,0.08)',
              }}
            >
              ❤️
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.4 }}>
              <Typography sx={{ fontSize: '0.62rem', color: tokens.text.muted, fontWeight: 600 }}>
                04:55 PM
              </Typography>
              <DoneAllIcon sx={{ fontSize: 14, color: '#26c6da' }} />
            </Box>
          </Box>

          {/* 5. Sent: Confirmed, reviewed and approved */}
          <Box sx={{ alignSelf: 'flex-end', maxWidth: '75%' }}>
            <Box
              sx={{
                bgcolor: '#d1a7fc',
                color: '#000000',
                px: 2,
                py: 0.9,
                borderRadius: '18px 18px 4px 18px',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              Confirmed, reviewed and approved.
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.4 }}>
              <Typography sx={{ fontSize: '0.62rem', color: tokens.text.muted, fontWeight: 600 }}>
                05:16 PM
              </Typography>
              <DoneAllIcon sx={{ fontSize: 14, color: '#26c6da' }} />
            </Box>
          </Box>
        </Box>

        {/* 3. Bottom Capsule Input Bar */}
        <Box
          sx={{
            p: 1.75,
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            bgcolor: isDark ? 'rgba(24, 20, 31, 0.6)' : '#FFFFFF',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F6F4F9',
              borderRadius: '28px',
              px: 2,
              py: 0.75,
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'}`,
            }}
          >
            <IconButton size="small" sx={{ color: 'text.secondary', p: 0.5 }}>
              <AttachFileIcon sx={{ fontSize: 19 }} />
            </IconButton>

            <TextField
              size="small"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.85rem',
                  p: 0,
                  '& fieldset': { border: 'none' },
                },
              }}
            />

            <IconButton size="small" sx={{ color: 'text.secondary', p: 0.5 }}>
              <TextFormatOutlinedIcon sx={{ fontSize: 19 }} />
            </IconButton>

            <IconButton size="small" sx={{ color: 'text.secondary', p: 0.5 }}>
              <SentimentSatisfiedAltOutlinedIcon sx={{ fontSize: 19 }} />
            </IconButton>

            <IconButton
              size="small"
              sx={{
                bgcolor: tokens.brand.primary,
                color: '#FFFFFF',
                p: 0.75,
                '&:hover': { bgcolor: tokens.brand.primaryDark },
              }}
            >
              <SendIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
