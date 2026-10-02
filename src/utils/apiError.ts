import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useUIStore } from '@/store/useUIStore';

const FALLBACK = 'Request failed';

type ApiErrorDetail = { field?: string; message?: string };

type ApiErrorBody = {
  error?: {
    message?: unknown;
    details?: ApiErrorDetail[];
  };
};

const readBody = (error: unknown): ApiErrorBody | undefined => {
  if (axios.isAxiosError(error)) {
    return error.response?.data as ApiErrorBody | undefined;
  }
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data;
  if (data && typeof data === 'object') return data as ApiErrorBody;
  return undefined;
};

export const getApiErrorMessage = (error: unknown): string => {
  const body = readBody(error);
  const rawMessage = body?.error?.message;
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
  const details = Array.isArray(body?.error?.details)
    ? body.error.details
        .map((detail) => (typeof detail?.message === 'string' ? detail.message.trim() : ''))
        .filter(Boolean)
    : [];
  const extra = details.filter((detail) => detail !== message);

  if (message && extra.length) return `${message}: ${extra.join('. ')}`;
  if (message) return message;
  if (extra.length) return extra.join('. ');
  return FALLBACK;
};

export const showApiError = (error: unknown) => {
  const data = axios.isAxiosError(error) ? error.response?.data : undefined;
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    void data.text().then((text) => {
      try {
        showApiError({ response: { data: JSON.parse(text) } });
      } catch {
        useUIStore.getState().addToast({ message: FALLBACK, severity: 'error' });
      }
    });
    return;
  }

  useUIStore.getState().addToast({
    message: getApiErrorMessage(error),
    severity: 'error',
  });
};

export const useApiErrorToast = (error: unknown, active: boolean) => {
  const toasted = useRef(false);

  useEffect(() => {
    if (!active) {
      toasted.current = false;
      return;
    }
    if (!error || toasted.current) return;
    toasted.current = true;
    showApiError(error);
  }, [active, error]);
};
