import { lazy, type ComponentType } from 'react';
import { isChunkLoadError, reloadOnceForStaleChunk } from './chunkLoad';

export function lazyRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      if (isChunkLoadError(error) && reloadOnceForStaleChunk()) {
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
