import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Box, IconButton, useTheme, Tooltip, Paper, Popover, Collapse } from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import HighlightIcon from '@mui/icons-material/Highlight';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import TextFormatIcon from '@mui/icons-material/TextFormat';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { tokens } from '@/styles/tokens';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const RichTextEditor = ({ value, onChange, onSubmit, placeholder = 'Type a message...', autoFocus }: RichTextEditorProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLButtonElement | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onSelectionUpdate: ({ editor }) => {
      const { empty } = editor.state.selection;
      setHasSelection(!empty);
    },
    onUpdate: ({ editor }) => {
      if (editor.isEmpty) {
        onChange('');
      } else {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose focus:outline-none max-w-none w-full tiptap-editor-content',
        style: `min-height: 24px; max-height: 200px; overflow-y: auto; padding: 12px 14px; font-family: inherit; font-size: 0.95rem; line-height: 1.5; color: ${isDarkMode ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.85)'};`,
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          let inList = false;
          const { $from } = view.state.selection;
          for (let i = $from.depth; i > 0; i--) {
            if ($from.node(i).type.name === 'listItem') {
              inList = true;
              break;
            }
          }
          
          if (inList) {
            return false;
          }

          event.preventDefault();
          onSubmit();
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && value === '' && !editor.isEmpty) {
      editor.commands.setContent('');
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor && autoFocus) {
      editor.commands.focus();
    }
  }, [editor, autoFocus]);

  if (!editor) return null;

  const [colorAnchorEl, setColorAnchorEl] = useState<HTMLButtonElement | null>(null);

  const menuButtonSx = {
    p: 0.5,
    borderRadius: '8px',
    color: 'text.secondary',
    '&:hover': {
      bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      color: tokens.brand.primary,
    },
    '&.is-active': {
      color: tokens.brand.primary,
      bgcolor: isDarkMode ? 'rgba(93, 26, 137, 0.25)' : 'rgba(93, 26, 137, 0.1)',
    },
  };

  const renderToolbarButtons = () => (
    <>
      <Tooltip title="Bold (Cmd+B)" arrow placement="top">
        <IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''} sx={menuButtonSx}>
          <FormatBoldIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="Italic (Cmd+I)" arrow placement="top">
        <IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''} sx={menuButtonSx}>
          <FormatItalicIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Underline (Cmd+U)" arrow placement="top">
        <IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''} sx={menuButtonSx}>
          <FormatUnderlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Strikethrough" arrow placement="top">
        <IconButton size="small" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''} sx={menuButtonSx}>
          <FormatStrikethroughIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Box sx={{ width: '1px', height: '20px', bgcolor: 'divider', mx: 0.5 }} />

      <Tooltip title="Text Color" arrow placement="top">
        <IconButton size="small" onClick={(e) => setColorAnchorEl(e.currentTarget)} sx={menuButtonSx}>
          <FormatColorTextIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Highlight" arrow placement="top">
        <IconButton size="small" onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'is-active' : ''} sx={menuButtonSx}>
          <HighlightIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Box sx={{ width: '1px', height: '20px', bgcolor: 'divider', mx: 0.5 }} />

      <Tooltip title="Bullet List" arrow placement="top">
        <IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''} sx={menuButtonSx}>
          <FormatListBulletedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Ordered List" arrow placement="top">
        <IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''} sx={menuButtonSx}>
          <FormatListNumberedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </>
  );

  return (
    <Box id="rich-text-editor-wrapper" sx={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {/* Unified toolbar: shows when A is clicked OR when text is selected */}
      <Collapse in={isToolbarVisible || hasSelection}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            p: 0.75,
            px: 1.5,
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            bgcolor: isDarkMode ? 'rgba(30, 27, 36, 0.9)' : 'rgba(248, 245, 255, 0.95)',
          }}
        >
          {renderToolbarButtons()}
        </Box>
      </Collapse>
      
      <Box sx={{ display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            '.tiptap-editor-content .ProseMirror': {
              maxHeight: '160px',
              overflowY: 'auto',
              outline: 'none',
              paddingRight: '4px',
              '&::-webkit-scrollbar': { width: '4px' },
              '&::-webkit-scrollbar-thumb': { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', borderRadius: '4px' },
            },
            '.tiptap-editor-content p.is-editor-empty:first-of-type::before': {
              content: 'attr(data-placeholder)',
              float: 'left',
              color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              pointerEvents: 'none',
              height: 0,
            },
            '.tiptap-editor-content p': {
              margin: 0,
            },
            '.tiptap-editor-content ul': {
              margin: '0.25rem 0',
              paddingLeft: '1.5rem',
              listStyleType: 'disc',
            },
            '.tiptap-editor-content ol': {
              margin: '0.25rem 0',
              paddingLeft: '1.5rem',
              listStyleType: 'decimal',
            },
            '.tiptap-editor-content a': {
              color: tokens.brand.primary,
              textDecoration: 'underline',
              cursor: 'pointer',
            },
            '.tiptap-editor-content mark': {
              backgroundColor: '#ffcc00',
              color: '#000',
              borderRadius: '2px',
              padding: '0 2px',
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>

        {/* Inline Tools (A button and Emoji) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pb: '10px', pr: '10px' }}>
          <Tooltip title="Formatting options" arrow>
            <IconButton 
              size="small" 
              onClick={() => setIsToolbarVisible(!isToolbarVisible)}
              sx={{
                color: isToolbarVisible ? tokens.brand.primary : 'text.secondary',
                bgcolor: isToolbarVisible ? (isDarkMode ? 'rgba(93, 26, 137, 0.25)' : 'rgba(93, 26, 137, 0.1)') : 'transparent',
                '&:hover': {
                  bgcolor: isToolbarVisible 
                    ? (isDarkMode ? 'rgba(93, 26, 137, 0.35)' : 'rgba(93, 26, 137, 0.15)') 
                    : (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                }
              }}
            >
              <TextFormatIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Insert Emoji" arrow>
            <IconButton 
              size="small" 
              onClick={(e) => setEmojiAnchorEl(e.currentTarget)}
              sx={{ 
                color: emojiAnchorEl ? tokens.brand.primary : 'text.secondary',
                '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }
              }}
            >
              <SentimentSatisfiedAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Popover
        open={Boolean(colorAnchorEl)}
        anchorEl={colorAnchorEl}
        onClose={() => setColorAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{ paper: { sx: { borderRadius: 2, p: 1, display: 'flex', gap: 0.5 } } }}
      >
        {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map((color) => (
          <IconButton 
            key={color}
            size="small"
            onClick={() => {
              editor.chain().focus().setColor(color).run();
              setColorAnchorEl(null);
            }}
            sx={{ width: 28, height: 28, bgcolor: color, '&:hover': { bgcolor: color, opacity: 0.8 } }}
          />
        ))}
        <IconButton
            size="small"
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              setColorAnchorEl(null);
            }}
            sx={{ width: 28, height: 28, border: '1px solid', borderColor: 'divider' }}
          >
           <FormatColorTextIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Popover>

      <Popover
        open={Boolean(emojiAnchorEl)}
        anchorEl={emojiAnchorEl}
        onClose={() => setEmojiAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{ 
          paper: { 
            sx: { 
              borderRadius: 3, 
              mt: -1, 
              width: 352, // Fixed width so MUI calculates bounds correctly
              height: 435, // Fixed height
              boxShadow: isDarkMode ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)', 
              bgcolor: 'transparent',
              overflow: 'hidden'
            } 
          } 
        }}
      >
        <Picker 
          data={data} 
          onEmojiSelect={(emoji: any) => {
            editor.chain().focus().insertContent(emoji.native).run();
            setEmojiAnchorEl(null);
          }}
          theme={isDarkMode ? 'dark' : 'light'}
          autoFocus={true}
        />
      </Popover>
    </Box>
  );
};
