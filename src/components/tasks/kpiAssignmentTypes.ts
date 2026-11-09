import { WEEKDAY_SHORT_LABELS } from '@/lib/constants';
import type { KpiPriority, KpiRecurrenceMode, KpiScheduleMode } from '@/types';

export interface UIKPITemplateItem {
  name: string;
  description: string;
  targetValue?: number;
  assignedTo: string[];
  daysOfWeek?: number[];
  scheduleMode?: KpiScheduleMode;
  startTime?: string;
  endTime?: string;
  recurrenceMode?: KpiRecurrenceMode;
}

export interface UIKPITemplate {
  _id: string;
  name: string;
  description?: string;
  kpis: UIKPITemplateItem[];
}

export interface ActiveAssignmentItem {
  _id?: string;
  itemId?: string;
  name: string;
  description: string;
  targetValue?: number;
  dueDate?: string;
  daysOfWeek?: number[];
  scheduleMode?: KpiScheduleMode;
  startTime?: string | null;
  endTime?: string | null;
  recurrenceMode?: KpiRecurrenceMode;
  priority?: KpiPriority;
  assignedTo: string[];
  completed: boolean;
}

export interface ActiveAssignment {
  _id: string;
  templateId: string;
  templateName: string;
  assignedTo: string[];
  assignedBy?: string;
  deadlineDate: string;
  deadlineTime: string;
  kpis: ActiveAssignmentItem[];
}

/** Stable empty list — inline `= []` on React Query `data` is a new array every render. */
export const EMPTY_KPI_LIST: never[] = [];

export const emptyTemplateItem = (): UIKPITemplateItem => ({
  name: '',
  description: '',
  targetValue: undefined,
  assignedTo: [],
  daysOfWeek: [],
  scheduleMode: 'per_day',
  startTime: '',
  endTime: '',
  recurrenceMode: 'weekly',
});

export const formatDaysLabel = (days?: number[]) => {
  if (!days?.length) return '';
  return [...days].sort((a, b) => a - b).map((d) => WEEKDAY_SHORT_LABELS[d]).join(', ');
};

export const invalidItemTimeWindow = (item: UIKPITemplateItem) => {
  if (!item.startTime || !item.endTime || !item.daysOfWeek?.length) return false;
  const sameDay = item.scheduleMode !== 'span' || item.daysOfWeek.length <= 1;
  return sameDay && item.startTime >= item.endTime;
};
