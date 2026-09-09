import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type Ref,
} from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
} from '@mui/material';
import { ReactRenderer } from '@tiptap/react';
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';
import type { MentionNodeAttrs } from '@tiptap/extension-mention';
import type { User } from '@/types';
import { getDisplayName } from '@/utils/formatters';

export type MentionSuggestionItem = MentionNodeAttrs & {
  email?: string;
};

export type MentionListHandle = {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
};

type MentionListProps = SuggestionProps<MentionSuggestionItem, MentionNodeAttrs>;

const MentionSuggestionList = forwardRef(function MentionSuggestionList(
  props: MentionListProps,
  ref: Ref<MentionListHandle>,
) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items, props.query]);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (!item?.id) return;
    props.command({
      id: item.id,
      label: item.label,
      mentionSuggestionChar: item.mentionSuggestionChar ?? '@',
    });
  };

  useImperativeHandle(
    ref,
    () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((prev) =>
            props.items.length ? (prev + props.items.length - 1) % props.items.length : 0,
          );
          return true;
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((prev) => (props.items.length ? (prev + 1) % props.items.length : 0));
          return true;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }),
    [props.items, selectedIndex],
  );

  const virtualEl = {
    getBoundingClientRect: () => props.clientRect?.() ?? new DOMRect(),
  };

  if (!props.items.length) return null;

  return (
    <Popper
      open
      anchorEl={virtualEl}
      placement="top-start"
      sx={{ zIndex: 1400 }}
      modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
    >
      <Paper elevation={4} sx={{ minWidth: 220, maxHeight: 240, overflowY: 'auto' }}>
        <List dense disablePadding>
          {props.items.map((item, index) => (
            <ListItemButton
              key={item.id || `${item.label}-${index}`}
              selected={index === selectedIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectItem(index)}
            >
              <ListItemText
                primary={item.label || 'User'}
                secondary={item.email}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 600 }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </Popper>
  );
});

export const createMentionSuggestion = (
  getUsers: () => User[],
  onOpenChange: (open: boolean) => void,
): Omit<SuggestionOptions<MentionSuggestionItem, MentionNodeAttrs>, 'editor'> => ({
  char: '@',
  allowSpaces: false,
  placement: 'top-start',
  items: ({ query }) => {
    const q = query.toLowerCase();
    return getUsers()
      .filter((user) => {
        const name = getDisplayName(user).toLowerCase();
        const email = (user.email || '').toLowerCase();
        return !q || name.includes(q) || email.includes(q);
      })
      .slice(0, 8)
      .map((user) => ({
        id: user._id,
        label: getDisplayName(user),
        email: user.email,
        mentionSuggestionChar: '@',
      }));
  },
  allow: () => getUsers().length > 0,
  render: () => {
    let component: ReactRenderer<MentionListHandle, MentionListProps> | null = null;

    const syncOpen = (items: MentionSuggestionItem[]) => {
      onOpenChange(items.length > 0);
    };

    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionSuggestionList, {
          editor: props.editor,
          props,
        });
        document.body.appendChild(component.element);
        syncOpen(props.items);
      },
      onUpdate: (props) => {
        component?.updateProps(props);
        syncOpen(props.items);
      },
      onKeyDown: (props) => {
        if (props.event.key === 'Escape') {
          onOpenChange(false);
          return true;
        }
        return component?.ref?.onKeyDown(props) ?? false;
      },
      onExit: () => {
        onOpenChange(false);
        component?.element.remove();
        component?.destroy();
        component = null;
      },
    };
  },
});
