import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Define the API interface for better TypeScript support
export interface DatabaseAPI {
  addDefaultData: () => Promise<{ success: boolean; message: string }>;
  getTerms: () => Promise<Term[]>;
  getLanguages: () => Promise<Language[]>;
}

// Type definitions (matching the ones in database.ts)
export interface Term {
  id: string;
  [languageKey: string]: string | undefined;
}

export interface Language {
  id: number;
  name: string;
  key: string;
  isPrimary: boolean;
}

// Custom APIs for renderer
const api: DatabaseAPI = {
  addDefaultData: () => ipcRenderer.invoke('db:addDefaultData'),
  getTerms: () => ipcRenderer.invoke('db:getTerms'),
  getLanguages: () => ipcRenderer.invoke('db:getLanguages'),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
