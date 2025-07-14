import { ElectronAPI } from '@electron-toolkit/preload';
import { DatabaseAPI } from './index';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: DatabaseAPI;
  }
}
