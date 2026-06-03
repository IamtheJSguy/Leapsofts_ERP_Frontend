import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { KanbanBoard, KanbanCard } from '@/types';

const kanbanApi = {
  getBoards: () => api.get<{ data: KanbanBoard[] }>('/kanban/boards'),
  getBoard: (id: string) => api.get<{ data: KanbanBoard }>(`/kanban/boards/${id}`),
  createBoard: (data: { name: string }) => api.post('/kanban/boards', data),
  updateBoard: ({ id, data }: { id: string; data: Partial<KanbanBoard> }) =>
    api.put(`/kanban/boards/${id}`, data),
  moveCard: ({ cardId, data }: { cardId: string; data: { columnId: string; position: number } }) =>
    api.put(`/kanban/cards/${cardId}/move`, data),
  addComment: ({ cardId, data }: { cardId: string; data: { text: string; mentions?: string[] } }) =>
    api.post(`/kanban/cards/${cardId}/comments`, data),
  updateCardMembers: ({ cardId, data }: { cardId: string; data: { members: string[] } }) =>
    api.put(`/kanban/cards/${cardId}/members`, data),
  getCard: (id: string) => api.get<{ data: KanbanCard }>(`/kanban/cards/${id}`),
};

const optimisticMoveCard = (
  board: KanbanBoard | undefined,
  cardId: string,
  data: { columnId: string; position: number },
): KanbanBoard | undefined => {
  if (!board) return board;
  let movedCard: KanbanCard | undefined;
  const columns = board.columns.map((col) => {
    const cards = col.cards.filter((c) => {
      if (c._id === cardId) {
        movedCard = { ...c, columnId: data.columnId, position: data.position };
        return false;
      }
      return true;
    });
    return { ...col, cards };
  });
  if (!movedCard) return board;
  return {
    ...board,
    columns: columns.map((col) =>
      col._id === data.columnId
        ? {
            ...col,
            cards: [
              ...col.cards.slice(0, data.position),
              movedCard!,
              ...col.cards.slice(data.position),
            ],
          }
        : col,
    ),
  };
};

export const useKanbanBoards = () =>
  useQuery({
    queryKey: ['kanbanBoards'],
    queryFn: () => kanbanApi.getBoards().then((r) => r.data.data),
  });

export const useKanbanBoard = (id: string | undefined) =>
  useQuery({
    queryKey: ['kanbanBoard', id],
    queryFn: () => kanbanApi.getBoard(id!).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.createBoard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanbanBoards'] }),
  });
};

export const useMoveCard = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.moveCard,
    onMutate: async ({ cardId, data }) => {
      const key = ['kanbanBoard', boardId];
      await queryClient.cancelQueries({ queryKey: key });
      const previousBoard = queryClient.getQueryData<KanbanBoard>(key);
      queryClient.setQueryData<KanbanBoard>(key, (old) =>
        optimisticMoveCard(old, cardId, data),
      );
      return { previousBoard, key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBoard && context.key) {
        queryClient.setQueryData(context.key, context.previousBoard);
      }
    },
    onSettled: (_data, _err, _vars, context) => {
      if (context?.key) {
        queryClient.invalidateQueries({ queryKey: context.key });
      }
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.addComment,
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] });
      queryClient.invalidateQueries({ queryKey: ['card', variables.cardId] });
    },
  });
};

export const useUpdateCardMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.updateCardMembers,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanbanBoard'] }),
  });
};

export const useCard = (id: string | undefined) =>
  useQuery({
    queryKey: ['card', id],
    queryFn: () => kanbanApi.getCard(id!).then((r) => r.data.data),
    enabled: !!id,
  });
