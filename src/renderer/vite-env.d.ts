/// <reference types="vite/client" />

import type { GestaoApi } from '../main/preload';

declare global {
  interface Window {
    gestaoApi: GestaoApi;
  }
}
