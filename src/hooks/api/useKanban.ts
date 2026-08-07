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
      isDone?: boolean;
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

const sortByOrder = (a: any, b: any) =>
  (a.order ?? a.position ?? 0) - (b.order ?? b.position ?? 0);

/** Query cache shape is `{ board, cards }` (KanbanBoardResponse). */
const optimisticMoveCard = (
  oldData: any,
  cardId: string,
  data: { columnId: string; position: number },
): any => {
  if (!oldData?.cards) return oldData;

  const cards = oldData.cards.map((c: any) => ({ ...c }));
  const cardIndex = cards.findIndex((c: any) => c._id === cardId);
  if (cardIndex === -1) return oldData;

  const movedCard = { ...cards[cardIndex] };
  const fromColumnId = String(movedCard.columnId);
  const toColumnId = String(data.columnId);
  const others = cards.filter((c: any) => c._id !== cardId);

  const reindexColumn = (columnId: string, insertAt?: number) => {
    const colCards = others
      .filter((c: any) => String(c.columnId) === columnId)
      .sort(sortByOrder);

    if (insertAt !== undefined) {
      const placed = {
        ...movedCard,
        columnId: data.columnId,
        order: insertAt,
        position: insertAt,
      };
      colCards.splice(Math.min(insertAt, colCards.length), 0, placed);
    }

    colCards.forEach((c: any, i: number) => {
      c.order = i;
      c.position = i;
    });
    return colCards;
  };

  const targetCards = reindexColumn(toColumnId, data.position);
  const sourceCards =
    fromColumnId !== toColumnId ? reindexColumn(fromColumnId) : [];
  const unaffected = others.filter((c: any) => {
    const col = String(c.columnId);
    return col !== toColumnId && col !== fromColumnId;
  });

  return { ...oldData, cards: [...unaffected, ...targetCards, ...sourceCards] };
};

const optimisticReorderColumns = (oldData: any, columnIds: string[]): any => {
  if (!oldData?.board?.columns) return oldData;

  const orderMap = new Map(columnIds.map((id, index) => [id, index]));
  const newColumns = [...oldData.board.columns]
    .map((col: any) => {
      const id = col._id || col.id;
      const nextOrder = orderMap.get(id);
      return nextOrder === undefined ? col : { ...col, order: nextOrder };
    })
    .sort((a: any, b: any) => {
      const idA = a._id || a.id;
      const idB = b._id || b.id;
      const indexA = orderMap.has(idA) ? (orderMap.get(idA) as number) : Number.MAX_SAFE_INTEGER;
      const indexB = orderMap.has(idB) ? (orderMap.get(idB) as number) : Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    });

  return {
    ...oldData,
    board: { ...oldData.board, columns: newColumns },
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
      const previousBoard = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old: any) =>
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
      const previousBoard = queryClient.getQueryData(key);

      queryClient.setQueryData(key, (old: any) =>
        optimisticReorderColumns(old, variables.columnIds),
      );

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
    onMutate: async ({ cardId, data }) => {
      const key = ['kanbanBoard', boardId];
      const cardKey = ['card', cardId];
      await queryClient.cancelQueries({ queryKey: key });
      await queryClient.cancelQueries({ queryKey: cardKey });

      const previousBoard = queryClient.getQueryData(key);
      const previousCard = queryClient.getQueryData(cardKey);

      queryClient.setQueryData(key, (old: any) => {
        if (!old?.cards) return old;
        return {
          ...old,
          cards: old.cards.map((c: any) =>
            c._id === cardId ? { ...c, ...data } : c,
          ),
        };
      });

      if (previousCard) {
        queryClient.setQueryData(cardKey, (old: any) =>
          old ? { ...old, ...data } : old,
        );
      }

      return { previousBoard, previousCard, key, cardKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousBoard && context.key) {
        queryClient.setQueryData(context.key, context.previousBoard);
      }
      if (context?.previousCard !== undefined && context.cardKey) {
        queryClient.setQueryData(context.cardKey, context.previousCard);
      }
    },
    onSettled: (_data, _err, variables, context) => {
      if (context?.key) {
        queryClient.invalidateQueries({ queryKey: context.key });
      } else if (boardId) {
        queryClient.invalidateQueries({ queryKey: ['kanbanBoard', boardId] });
      }
      queryClient.invalidateQueries({ queryKey: ['card', variables.cardId] });
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
