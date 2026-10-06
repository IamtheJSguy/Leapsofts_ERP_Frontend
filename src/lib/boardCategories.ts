import type { BoardCategory } from '@/types';

export const BOARD_CATEGORY_OPTIONS: Array<{
  value: BoardCategory;
  label: string;
  color: string;
  backgroundColor: string;
}> = [
  { value: 'general', label: 'General', color: '#64748B', backgroundColor: 'rgba(100, 116, 139, 0.12)' },
  { value: 'sales', label: 'Sales', color: '#16A34A', backgroundColor: 'rgba(22, 163, 74, 0.12)' },
  { value: 'technology', label: 'Technology', color: '#2563EB', backgroundColor: 'rgba(37, 99, 235, 0.12)' },
  { value: 'marketing', label: 'Marketing', color: '#9333EA', backgroundColor: 'rgba(147, 51, 234, 0.12)' },
  { value: 'operations', label: 'Operations', color: '#D97706', backgroundColor: 'rgba(217, 119, 6, 0.12)' },
  { value: 'support', label: 'Support', color: '#0891B2', backgroundColor: 'rgba(8, 145, 178, 0.12)' },
];

export const getBoardCategoryOption = (category?: BoardCategory) =>
  BOARD_CATEGORY_OPTIONS.find((option) => option.value === (category || 'general'))
  ?? BOARD_CATEGORY_OPTIONS[0];
