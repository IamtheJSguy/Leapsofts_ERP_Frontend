export type KpiPriority = 'low' | 'medium' | 'high' | 'urgent';

export const PRIORITY_CONFIG: Record<
  KpiPriority,
  { label: string; color: string; bg: string; dot: string; border: string }
> = {
  low: { label: 'Low', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', dot: '#3b82f6', border: 'rgba(96,165,250,0.2)' },
  medium: { label: 'Medium', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', dot: '#d97706', border: 'rgba(251,191,36,0.2)' },
  high: { label: 'High', color: '#fb923c', bg: 'rgba(251,146,60,0.08)', dot: '#ea580c', border: 'rgba(251,146,60,0.2)' },
  urgent: { label: 'Urgent', color: '#f87171', bg: 'rgba(248,113,113,0.08)', dot: '#dc2626', border: 'rgba(248,113,113,0.2)' },
};

export const PRIORITY_RANK: Record<KpiPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const getPriorityConfig = (priority?: string) =>
  PRIORITY_CONFIG[(priority as KpiPriority) ?? 'medium'] ?? PRIORITY_CONFIG.medium;

export const sortByPriority = <T extends { priority?: string }>(a: T, b: T) =>
  PRIORITY_RANK[(a.priority as KpiPriority) ?? 'medium'] - PRIORITY_RANK[(b.priority as KpiPriority) ?? 'medium'];

export const KPI_PRIORITY_OPTIONS: KpiPriority[] = ['low', 'medium', 'high', 'urgent'];
