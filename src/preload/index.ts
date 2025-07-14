import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
import {
  BaseResponse,
  InsertGlossaryEntryProps,
  Language,
  Term,
  updateGlossaryEntryProps,
} from 'src/main/database';

// Define the API interface for better TypeScript support
export interface DatabaseAPI {
  addDefaultData: () => Promise<BaseResponse>;
  getTerms: () => Promise<Term[]>;
  getLanguages: () => Promise<Language[]>;
  insertGlossaryEntry: (props: InsertGlossaryEntryProps) => Promise<BaseResponse>;
  updateGlossaryEntry: (props: updateGlossaryEntryProps) => Promise<BaseResponse>;
  deleteGlossaryEntry: (id: number) => Promise<BaseResponse>;
}

// Custom APIs for renderer
const api: DatabaseAPI = {
  addDefaultData: () => ipcRenderer.invoke('db:addDefaultData'),
  getTerms: () => ipcRenderer.invoke('db:getTerms'),
  getLanguages: () => ipcRenderer.invoke('db:getLanguages'),
  insertGlossaryEntry: (props: InsertGlossaryEntryProps) =>
    ipcRenderer.invoke('db:insertGlossaryEntry', props),
  updateGlossaryEntry: (props: updateGlossaryEntryProps) =>
    ipcRenderer.invoke('db:updateGlossaryEntry', props),
  deleteGlossaryEntry: (id: number) => ipcRenderer.invoke('db:deleteGlossaryEntry', id),
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
