'use server';

import { db } from '~/server/db';
import { languages, glossaryEntries, entryTranslations } from '~/server/db/schema';
import { count, eq } from 'drizzle-orm';
import defaultData from '~/default-data.json';

export async function addDefaultData(): Promise<{ success: boolean; message: string }> {
  try {
    // Check if there's already data in the glossary entries table
    const [entryCount] = await db.select({ count: count() }).from(glossaryEntries);

    if ((entryCount?.count ?? 0) > 0) {
      return {
        success: false,
        message: 'Database already contains terms. Default data not added.',
      };
    }

    // Check if languages exist, if not create them
    const [languageCount] = await db.select({ count: count() }).from(languages);
    let englishLang, spanishLang;

    if ((languageCount?.count ?? 0) === 0) {
      // Insert default languages (English and Spanish)
      const insertedLanguages = await db
        .insert(languages)
        .values([
          { name: 'English', isPrimary: true },
          { name: 'Spanish', isPrimary: false },
        ])
        .returning({ id: languages.id, name: languages.name });

      englishLang = insertedLanguages.find((lang) => lang.name === 'English');
      spanishLang = insertedLanguages.find((lang) => lang.name === 'Spanish');
    } else {
      // Languages already exist, find them
      const existingLanguages = await db.select().from(languages);
      englishLang = existingLanguages.find((lang) => lang.name === 'English');
      spanishLang = existingLanguages.find((lang) => lang.name === 'Spanish');

      // If English or Spanish don't exist, create them
      if (!englishLang || !spanishLang) {
        const languagesToInsert = [];
        if (!englishLang) languagesToInsert.push({ name: 'English', isPrimary: true });
        if (!spanishLang) languagesToInsert.push({ name: 'Spanish', isPrimary: false });

        const newLanguages = await db
          .insert(languages)
          .values(languagesToInsert)
          .returning({ id: languages.id, name: languages.name });

        if (!englishLang) englishLang = newLanguages.find((lang) => lang.name === 'English');
        if (!spanishLang) spanishLang = newLanguages.find((lang) => lang.name === 'Spanish');
      }
    }

    if (!englishLang || !spanishLang) {
      throw new Error('Failed to insert languages');
    }

    // Insert glossary entries and translations
    let successCount = 0;
    const batchSize = 50; // Process in batches to avoid overwhelming the database

    for (let i = 0; i < defaultData.length; i += batchSize) {
      const batch = defaultData.slice(i, i + batchSize);

      for (const item of batch) {
        try {
          // Insert the glossary entry (using English term as the main term)
          const [insertedEntry] = await db
            .insert(glossaryEntries)
            .values({
              term: item.english,
              definition: item.english, // Using the term as definition for now
            })
            .returning({ id: glossaryEntries.id });

          if (insertedEntry) {
            // no need to insert english as it is the main term
            await db.insert(entryTranslations).values([
              {
                termId: insertedEntry.id,
                languageId: spanishLang.id,
                translation: item.spanish,
              },
            ]);
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to insert term: ${item.english}`, error);
          // Continue with the next item instead of failing completely
        }
      }
    }

    return {
      success: true,
      message: `Successfully added ${successCount} terms to the database.`,
    };
  } catch (error) {
    console.error('Error adding default data:', error);
    return {
      success: false,
      message: `Failed to add default data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function getTermsFromDatabase(): Promise<Term[]> {
  try {
    // First, check if there are any terms in the database
    const [entryCount] = await db.select({ count: count() }).from(glossaryEntries);

    // If no terms exist, automatically add default data
    if ((entryCount?.count ?? 0) === 0) {
      console.log('No terms found in database, adding default data...');
      const result = await addDefaultData();
      if (!result.success) {
        console.warn('Failed to add default data:', result.message);
      } else {
        console.log('Default data added successfully');
      }
    }

    // Get all glossary entries with their translations
    const results = await db
      .select({
        entryId: glossaryEntries.id,
        term: glossaryEntries.term,
        languageName: languages.name,
        translation: entryTranslations.translation,
      })
      .from(glossaryEntries)
      .leftJoin(entryTranslations, eq(glossaryEntries.id, entryTranslations.termId))
      .leftJoin(languages, eq(entryTranslations.languageId, languages.id));

    // Group translations by entry
    const termsMap = new Map<number, Term>();

    results.forEach((row) => {
      if (!termsMap.has(row.entryId)) {
        termsMap.set(row.entryId, {
          id: row.entryId.toString(),
          // Set the main term as English (since that's what we store in glossaryEntries.term)
          english: row.term,
        });
      }

      const term = termsMap.get(row.entryId)!;
      if (row.languageName && row.translation) {
        // Store translation with lowercase language name as key
        term[row.languageName.toLowerCase()] = row.translation;
      }
    });

    return Array.from(termsMap.values());
  } catch (error) {
    console.error('Error fetching terms from database:', error);
    return [];
  }
}

// Type definition for Term - flexible interface for dynamic languages
export interface Term {
  id: string;
  // Index signature to allow any language as a property
  [languageKey: string]: string | undefined;
}

// Type for language information
export interface Language {
  id: number;
  name: string;
  key: string; // lowercase version for use as object keys
  isPrimary: boolean;
}

export async function getAvailableLanguages(): Promise<Language[]> {
  try {
    const dbLanguages = await db.select().from(languages);

    return dbLanguages.map((lang) => ({
      id: lang.id,
      name: lang.name,
      key: lang.name.toLowerCase(),
      isPrimary: lang.isPrimary,
    }));
  } catch (error) {
    console.error('Error fetching languages from database:', error);
    // Return default languages if database query fails
    return [
      { id: 1, name: 'English', key: 'english', isPrimary: true },
      { id: 2, name: 'Spanish', key: 'spanish', isPrimary: false },
    ];
  }
}
