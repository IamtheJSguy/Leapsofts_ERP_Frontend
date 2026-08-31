import { lazy, type ComponentType } from 'react';
import { isChunkLoadError, reloadOnceForStaleChunk } from './chunkLoad';

export function lazyRetry<T extends { default: ComponentType }>(
  factory: () => Promise<T>,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error) {
      if (isChunkLoadError(error) && reloadOnceForStaleChunk()) {
        return new Promise<T>(() => {});
      }
      throw error;
    }
  });
}
