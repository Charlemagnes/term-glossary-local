// This file contains the renderer-side database actions that communicate with the main process via IPC

// Type definitions (must match the ones in preload/index.ts)
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

/**
 * Add default data to the database
 */
export async function addDefaultData(): Promise<{ success: boolean; message: string }> {
  try {
    return await window.api.addDefaultData();
  } catch (error) {
    console.error('Error calling addDefaultData via IPC:', error);
    return {
      success: false,
      message: 'Failed to communicate with main process',
    };
  }
}

/**
 * Get all terms from the database
 */
export async function getTermsFromDatabase() {
  try {
    return await window.api.getTerms();
  } catch (error) {
    console.error('Error calling getTerms via IPC:', error);
    return [];
  }
}

/**
 * Get available languages from the database
 */
export async function getAvailableLanguages() {
  try {
    return await window.api.getLanguages();
  } catch (error) {
    console.error('Error calling getLanguages via IPC:', error);
    // Return default languages if IPC call fails
    return [
      { id: 1, name: 'English', key: 'english', isPrimary: true },
      { id: 2, name: 'Spanish', key: 'spanish', isPrimary: false },
    ];
  }
}
