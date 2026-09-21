import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { KanbanCard } from '@/types';

const uploadCardImage = (cardId: string, file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post<{ data: KanbanCard }>(`/kanban/cards/${cardId}/image`, formData, {
    headers: { 'Content-Type': undefined as unknown as string },
  });
};

const deleteCardImage = (cardId: string) =>
  api.delete<{ data: KanbanCard }>(`/kanban/cards/${cardId}/image`);

export function useUploadCardImage(boardId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, file }: { cardId: string; file: File }) =>
      uploadCardImage(cardId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
      queryClient.invalidateQueries({ queryKey: ['card', variables.cardId] });
    },
  });
}

export function useDeleteCardImage(boardId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => deleteCardImage(cardId),
    onSuccess: (_data, cardId) => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
      queryClient.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });
}
