import { useVirtualizer } from '@tanstack/react-virtual';
import { Box } from '@mui/material';
import type { RefObject, ReactNode } from 'react';

type ChatVirtualMessageListProps<T> = {
  items: T[];
  scrollRef: RefObject<HTMLDivElement | null>;
  getItemKey: (item: T, index: number) => string;
  renderItem: (item: T, index: number) => ReactNode;
  enabled?: boolean;
};

export function ChatVirtualMessageList<T>({
  items,
  scrollRef,
  getItemKey,
  renderItem,
  enabled = true,
}: ChatVirtualMessageListProps<T>) {
  const shouldVirtualize = enabled && items.length > 40;

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 104,
    overscan: 10,
  });

  if (!shouldVirtualize) {
    return (
      <>
        {items.map((item, index) => (
          <Box key={getItemKey(item, index)} sx={{ width: '100%', minWidth: 0 }}>
            {renderItem(item, index)}
          </Box>
        ))}
      </>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <Box
      sx={{
        height: virtualizer.getTotalSize(),
        width: '100%',
        position: 'relative',
      }}
    >
      {virtualItems.map((virtualRow) => {
        const item = items[virtualRow.index];
        return (
          <Box
            key={getItemKey(item, virtualRow.index)}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(item, virtualRow.index)}
          </Box>
        );
      })}
    </Box>
  );
}
