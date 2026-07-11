import { registerPlugin } from '@capacitor/core';

export interface PiPPluginType {
  setAutoPipEnabled(options: { enabled: boolean }): Promise<void>;
  setPlayState(options: { playing: boolean }): Promise<void>;
}

// Register PiP plugin ONCE in a shared module to prevent "Cannot register plugins twice" error
export const PiPPlugin = registerPlugin<PiPPluginType>('PiP');
