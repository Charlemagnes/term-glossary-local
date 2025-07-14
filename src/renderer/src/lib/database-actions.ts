// This file contains the renderer-side database actions that communicate with the main process via IPC

import { BaseResponse } from 'src/main/database';

// Type definitions (must match the ones in preload/index.ts)
export interface Term {
  termId: string;
  translations?: { [languageKey: string]: string | undefined };
}

export interface Language {
  id: number;
  name: string;
  key: string;
  isPrimary: boolean;
}

export interface InsertGlossaryEntryProps {
  primaryTerm: string;
  definition: string;
  translations?: { [languageKey: string]: string };
}

export type updateGlossaryEntryProps = Partial<InsertGlossaryEntryProps> & { termId: number };

/**
 * Add default data to the database
 */
export async function addDefaultData(): Promise<BaseResponse> {
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

/**
 * insert new term and translations into the database
 * @param props The properties of the term to insert
 * @returns A promise that resolves to the result of the insert operation
 */
export async function insertGlossaryEntry(props: InsertGlossaryEntryProps) {
  try {
    console.log('attempting inser....');
    console.log(props, 'props in insertGlossaryEntry');
    return await window.api.insertGlossaryEntry(props);
  } catch (error) {
    console.error('Error calling insertGlossaryEntry via IPC:', error);
    return {
      success: false,
      message: 'Failed to communicate with main process',
    };
  }
}

/**
 * Update an existing term in the database
 * @param id The ID of the term to update
 * @param props The updated term data
 * @returns A promise that resolves to the result of the update operation
 */
export async function updateGlossaryEntry(props: updateGlossaryEntryProps): Promise<BaseResponse> {
  try {
    return await window.api.updateGlossaryEntry(props);
  } catch (error) {
    console.error('Error calling updateGlossaryEntry via IPC:', error);
    return {
      success: false,
      message: 'Failed to communicate with main process',
    };
  }
}

export async function deleteGlossaryEntry(id: number): Promise<BaseResponse> {
  try {
    return await window.api.deleteGlossaryEntry(id);
  } catch (error) {
    console.error('Error calling deleteGlossaryEntry via IPC:', error);
    return {
      success: false,
      message: 'Failed to communicate with main process',
    };
  }
}
