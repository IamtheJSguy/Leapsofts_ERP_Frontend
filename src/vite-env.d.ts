/// <reference types="vite/client" />

import 'axios';

declare global {
  const __APP_BUILD_ID__: string;
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}
