import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { KanbanBoard, KanbanBoardResponse, KanbanCard, KanbanCardLink } from '@/types';

export type CreateMeetingOnCardPayload = {
  title: string;
  meetingLink?: string;
  scheduledAt: string;
  participants: string[];
  description?: string;
  leadId?: string;
};

const kanbanApi = {
  getBoards: () => api.get<{ data: KanbanBoard[] }>('/kanban/boards'),
  getBoard: (id: string) => api.get<{ data: KanbanBoardResponse }>(`/kanban/board/${id}`),
  createBoard: (data: { name: string; type?: string; description?: string; status?: string; techStack?: string[] }) => api.post('/kanban/boards', data),
  updateBoard: ({ id, data }: { id: string; data: Partial<KanbanBoard> }) =>
    api.put(`/kanban/boards/${id}`, data),
  createColumn: ({ boardId, name }: { boardId: string; name: string }) =>
    api.post(`/kanban/boards/${boardId}/columns`, { name }),
  moveCard: ({ cardId, data }: { cardId: string; data: { columnId: string; position: number } }) =>
    api.patch(`/kanban/cards/${cardId}/move`, { columnId: data.columnId, order: data.position }),
  addComment: ({ cardId, data }: { cardId: string; data: { text: string; mentions?: string[] } }) =>
    api.post(`/kanban/cards/${cardId}/comments`, data),
  updateCardMembers: ({ cardId, data }: { cardId: string; data: { members: string[] } }) =>
    api.put(`/kanban/cards/${cardId}/members`, data),
  getCard: (id: string) => api.get<{ data: KanbanCard }>(`/kanban/cards/${id}`),
  getBoardCards: (boardId: string) => api.get<{ data: KanbanCard[] }>(`/kanban/boards/${boardId}/cards`),
  deleteBoard: (boardId: string) => api.delete(`/kanban/boards/${boardId}`),
  shareBoard: ({ boardId, userIds }: { boardId: string; userIds: string[] }) =>
    api.patch(`/kanban/boards/${boardId}/share`, { userIds }),
  renameColumn: ({ boardId, columnId, name }: { boardId: string; columnId: string; name: string }) =>
    api.patch(`/kanban/boards/${boardId}/columns/${columnId}`, { name }),
  deleteColumn: ({ boardId, columnId }: { boardId: string; columnId: string }) =>
    api.delete(`/kanban/boards/${boardId}/columns/${columnId}`),
  reorderColumns: ({ boardId, columnIds }: { boardId: string; columnIds: string[] }) =>
    api.patch(`/kanban/boards/${boardId}/columns/reorder`, { columnIds }),
  createCard: (data: {
    boardId: string;
    columnId: string;
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: string;
    assignedTo?: string[];
    profileSections?: Array<{ title: string; content: string }>;
  }) =>
    api.post('/kanban/cards', data),
  assignCard: ({ cardId, data }: { cardId: string; data: { assignedTo: string[]; dueDate?: string; kpiEndDate?: string } }) =>
    api.patch(`/kanban/cards/${cardId}/assign`, data),
  updateCard: ({
    cardId,
    data,
  }: {
    cardId: string;
    data: Partial<KanbanCard> & {
      assignedTo?: string[];
      labelIds?: string[];
      links?: KanbanCardLink[];
      meetingIds?: string[];
    };
  }) => api.patch(`/kanban/cards/${cardId}`, data),
  deleteCard: (cardId: string) =>
    api.delete(`/kanban/cards/${cardId}`),
  editComment: ({ cardId, commentId, text }: { cardId: string; commentId: string; text: string }) =>
    api.patch(`/kanban/cards/${cardId}/comments/${commentId}`, { text }),
  deleteComment: ({ cardId, commentId }: { cardId: string; commentId: string }) =>
    api.delete(`/kanban/cards/${cardId}/comments/${commentId}`),
  createLabel: ({ boardId, data }: { boardId: string; data: { name: string; color: string } }) =>
    api.post(`/kanban/boards/${boardId}/labels`, data),
  updateLabel: ({
    boardId,
    labelId,
    data,
  }: {
    boardId: string;
    labelId: string;
    data: { name?: string; color?: string };
  }) => api.patch(`/kanban/boards/${boardId}/labels/${labelId}`, data),
  deleteLabel: ({ boardId, labelId }: { boardId: string; labelId: string }) =>
    api.delete(`/kanban/boards/${boardId}/labels/${labelId}`),
  attachMeeting: ({ cardId, meetingId }: { cardId: string; meetingId: string }) =>
    api.post(`/kanban/cards/${cardId}/meetings`, { meetingId }),
  detachMeeting: ({ cardId, meetingId }: { cardId: string; meetingId: string }) =>
    api.delete(`/kanban/cards/${cardId}/meetings/${meetingId}`),
  createMeetingOnCard: ({ cardId, data }: { cardId: string; data: CreateMeetingOnCardPayload }) =>
    api.post<{ data: KanbanCard }>(`/kanban/cards/${cardId}/meetings/create`, data),
};

const optimisticMoveCard = (
  oldData: any,
  cardId: string,
  data: { columnId: string; position: number },
): any => {
  if (!oldData || !oldData.cards) return oldData;
  const newCards = [...oldData.cards];
  const cardIndex = newCards.findIndex((c: any) => c._id === cardId);
  if (cardIndex === -1) return oldData;

  const movedCard = { ...newCards[cardIndex], columnId: data.columnId, position: data.position };
  newCards[cardIndex] = movedCard;

  // We should also recalculate positions or just let the backend handle the final sort.
  // For optimistic UI, just updating the card's columnId and position is enough because
  // KanbanBoardPage sorts them before rendering.
  return { ...oldData, cards: newCards };
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
    staleTime: 0,                  // Always re-fetch when invalidated
    refetchOnWindowFocus: true,    // Catch missed socket updates when tab is refocused
  });

export const useCreateBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.createBoard,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanbanBoards'] }),
  });
};

export const useDeleteBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoards'] });
    },
  });
};

export const useBoardCards = (boardId: string | undefined) =>
  useQuery({
    queryKey: ['kanbanBoardCards', boardId],
    queryFn: () => kanbanApi.getBoardCards(boardId!).then((r) => r.data.data),
    enabled: !!boardId,
  });


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

export const useAddComment = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.addComment,
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
      queryClient.invalidateQueries({ queryKey: ['card', variables.cardId] });
    },
  });
};

export const useUpdateCardMembers = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.updateCardMembers,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] }),
  });
};

export const useCreateColumn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.createColumn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', variables.boardId] });
    },
  });
};

export const useRenameColumn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.renameColumn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', variables.boardId] });
    },
  });
};

export const useDeleteColumn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.deleteColumn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', variables.boardId] });
    },
  });
};

export const useReorderColumns = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.reorderColumns,
    onMutate: async (variables) => {
      const key = ['kanbanBoard', variables.boardId];
      await queryClient.cancelQueries({ queryKey: key });
      const previousBoard = queryClient.getQueryData<KanbanBoard>(key);
      
      queryClient.setQueryData<KanbanBoard>(key, (old: any) => {
        if (!old || !old.columns) return old;
        const newColumns = [...old.columns];
        newColumns.sort((a, b) => {
          const idA = a._id || a.id;
          const idB = b._id || b.id;
          const indexA = variables.columnIds.indexOf(idA);
          const indexB = variables.columnIds.indexOf(idB);
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        return { ...old, columns: newColumns };
      });
      
      return { previousBoard, key };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previousBoard && context.key) {
        queryClient.setQueryData(context.key, context.previousBoard);
      }
    },
    onSettled: (_data, _err, _vars, context: any) => {
      if (context?.key) {
        queryClient.invalidateQueries({ queryKey: context.key });
      }
    },
  });
};

export const useCreateCard = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.createCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
    },
  });
};

export const useAssignCard = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.assignCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
      queryClient.invalidateQueries({ queryKey: ['dailyKpis'] });
      queryClient.invalidateQueries({ queryKey: ['dailyKpiSummary'] });
    },
  });
};

export const useUpdateCard = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.updateCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
    },
  });
};

export const useDeleteCard = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.deleteCard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
    },
  });
};

export const useEditComment = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.editComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
    },
  });
};

export const useDeleteComment = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
    },
  });
};

export const useCard = (id: string | undefined) =>
  useQuery({
    queryKey: ['card', id],
    queryFn: () => kanbanApi.getCard(id!).then((r) => r.data.data),
    enabled: !!id,
  });

export const useShareBoard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.shareBoard,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kanbanBoard', variables.boardId] });
      queryClient.invalidateQueries({ queryKey: ['kanbanBoards'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

const invalidateBoard = (queryClient: ReturnType<typeof useQueryClient>, boardId?: string) => {
  if (boardId) queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
};

export const useCreateLabel = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.createLabel,
    onSuccess: () => invalidateBoard(queryClient, boardId),
  });
};

export const useUpdateLabel = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.updateLabel,
    onSuccess: () => invalidateBoard(queryClient, boardId),
  });
};

export const useDeleteLabel = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.deleteLabel,
    onSuccess: () => invalidateBoard(queryClient, boardId),
  });
};

export const useAttachCardMeeting = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.attachMeeting,
    onSuccess: () => {
      invalidateBoard(queryClient, boardId);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
};

export const useDetachCardMeeting = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.detachMeeting,
    onSuccess: () => {
      invalidateBoard(queryClient, boardId);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });
};

export const useCreateMeetingOnCard = (boardId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kanbanApi.createMeetingOnCard,
    onSuccess: () => {
      invalidateBoard(queryClient, boardId);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead'] });
    },
  });
};
