import type { KanbanCard } from '@/types';
import { fetchKanbanCardById } from '@/hooks/api/useKanban';

export type KanbanCardRouteInfo = KanbanCard & {
  boardId?: string;
  projectId?: string;
};

export const loadKanbanCardRouteInfo = (id: string) =>
  fetchKanbanCardById(id) as Promise<KanbanCardRouteInfo>;

export const kanbanCardNavigatePath = (card: KanbanCardRouteInfo) => {
  if (!card.boardId) return null;
  const projectSegment = card.projectId || card.boardId;
  return `/projects/${projectSegment}/boards/${card.boardId}?card=${card._id}`;
};
