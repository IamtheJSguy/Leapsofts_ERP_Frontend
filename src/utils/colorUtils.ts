import type { ConnectionStatus, MessageStatus } from '@/types';
import {
  connectionStatusTokens,
  messageStatusTokens,
  kpiStatusTokens,
} from '@/styles/tokens';

export interface StatusColorPair {
  color: string;
  bg: string;
}

const CONNECTION_COLORS: Record<ConnectionStatus, StatusColorPair> = connectionStatusTokens;
const MESSAGE_COLORS: Record<MessageStatus, StatusColorPair> = messageStatusTokens;

export const getConnectionColors = (status?: ConnectionStatus): StatusColorPair =>
  status ? CONNECTION_COLORS[status] : CONNECTION_COLORS.pending;

export const getMessageColors = (status?: MessageStatus): StatusColorPair =>
  status ? MESSAGE_COLORS[status] : MESSAGE_COLORS.not_sent;

/** @deprecated Use getConnectionColors for bg + color */
export const getConnectionColor = (status?: ConnectionStatus): string =>
  getConnectionColors(status).color;

/** @deprecated Use getMessageColors for bg + color */
export const getMessageColor = (status?: MessageStatus): string =>
  getMessageColors(status).color;

export const getKpiIndicatorColor = (current: number, target: number): string => {
  if (target === 0) return kpiStatusTokens.success;
  const rate = (current / target) * 100;
  if (rate >= 90) return kpiStatusTokens.success;
  if (rate >= 70) return kpiStatusTokens.warning;
  return kpiStatusTokens.error;
};

export const formatStatusLabel = (status: string): string =>
  status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
