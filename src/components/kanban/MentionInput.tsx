import { useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  TextField,
  type TextFieldProps,
} from '@mui/material';
import type { User } from '@/types';
import { getDisplayName } from '@/utils/formatters';
import { formatMentionsForDisplay, parseDisplayToStorage } from '@/utils/mentionUtils';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  mentionableUsers: User[];
  placeholder?: string;
  disabled?: boolean;
  onSubmit?: () => void;
  endAdornment?: ReactNode;
  sx?: TextFieldProps['sx'];
  size?: TextFieldProps['size'];
  fullWidth?: boolean;
}

export const MentionInput = ({
  value,
  onChange,
  mentionableUsers,
  placeholder,
  disabled,
  onSubmit,
  endAdornment,
  sx,
  size = 'small',
  fullWidth = true,
}: MentionInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  const displayValue = useMemo(
    () => formatMentionsForDisplay(value, mentionableUsers),
    [value, mentionableUsers],
  );

  const filteredUsers = useMemo(() => {
    const query = mentionQuery.toLowerCase();
    return mentionableUsers
      .filter((user) => {
        const name = getDisplayName(user).toLowerCase();
        const email = (user.email || '').toLowerCase();
        return !query || name.includes(query) || email.includes(query);
      })
      .slice(0, 8);
  }, [mentionableUsers, mentionQuery]);

  const detectMention = (text: string, cursor: number) => {
    const beforeCursor = text.slice(0, cursor);
    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex === -1) return null;

    const query = beforeCursor.slice(atIndex + 1);
    if (query.includes('\n') || query.includes('[')) {
      return null;
    }

    return { start: atIndex, query };
  };

  const closeMentionMenu = () => {
    setAnchorEl(null);
    setMentionQuery('');
    setMentionStart(null);
  };

  const handleChange: TextFieldProps['onChange'] = (event) => {
    const nextDisplayValue = event.target.value;
    onChange(parseDisplayToStorage(nextDisplayValue, mentionableUsers));

    const cursor = event.target.selectionStart ?? nextDisplayValue.length;
    const mention = detectMention(nextDisplayValue, cursor);

    if (mention && mentionableUsers.length > 0) {
      setMentionStart(mention.start);
      setMentionQuery(mention.query);
      setAnchorEl(event.target);
      return;
    }

    closeMentionMenu();
  };

  const insertMention = (user: User) => {
    if (mentionStart === null) return;

    const input = inputRef.current;
    const cursor = input?.selectionStart ?? displayValue.length;
    const before = displayValue.slice(0, mentionStart);
    const after = displayValue.slice(cursor);
    const mentionLabel = `@${getDisplayName(user)}`;
    const nextDisplayValue = `${before}${mentionLabel} `;

    onChange(parseDisplayToStorage(`${before}${mentionLabel} ${after}`, mentionableUsers));
    closeMentionMenu();

    requestAnimationFrame(() => {
      if (!input) return;
      const nextCursor = nextDisplayValue.length;
      input.focus();
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && anchorEl) {
      event.preventDefault();
      if (filteredUsers[0]) {
        insertMention(filteredUsers[0]);
      }
      return;
    }

    if (event.key === 'Escape' && anchorEl) {
      event.preventDefault();
      closeMentionMenu();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey && onSubmit) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <>
      <TextField
        fullWidth={fullWidth}
        size={size}
        placeholder={placeholder}
        value={displayValue}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        inputRef={inputRef}
        InputProps={{ endAdornment }}
        sx={sx}
      />

      <Popper
        open={Boolean(anchorEl) && filteredUsers.length > 0}
        anchorEl={anchorEl}
        placement="top-start"
        sx={{ zIndex: 1400 }}
      >
        <Paper elevation={4} sx={{ mt: -1, minWidth: 220, maxHeight: 240, overflowY: 'auto' }}>
          <List dense disablePadding>
            {filteredUsers.map((user) => (
              <ListItemButton key={user._id} onMouseDown={(event) => event.preventDefault()} onClick={() => insertMention(user)}>
                <ListItemText
                  primary={getDisplayName(user)}
                  secondary={user.email}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                  secondaryTypographyProps={{ fontSize: '0.75rem' }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      </Popper>
    </>
  );
};
