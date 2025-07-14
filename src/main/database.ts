import { db } from '../server/db/index';
import { languages, glossaryEntries, entryTranslations } from '../server/db/schema';
import { count, eq, and } from 'drizzle-orm';
import defaultData from '../server/db/default-data.json';

// Type definitions
export interface Term {
  termId: number;
  // Index signature to allow any language as a property
  translations: { [languageKey: string]: string };
}

export interface Language {
  id: number;
  name: string;
  key: string; // lowercase version for use as object keys
  isPrimary: boolean;
}

export interface InsertGlossaryEntryProps {
  primaryTerm: string;
  definition: string;
  translations?: { [languageKey: string]: string };
}

export type updateGlossaryEntryProps = Partial<InsertGlossaryEntryProps> & { termId: number };

export interface BaseResponse {
  success: boolean;
  message: string;
}

export async function addDefaultData(): Promise<BaseResponse> {
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
        .returning();

      englishLang = insertedLanguages[0];
      spanishLang = insertedLanguages[1];
    } else {
      // Get existing languages
      const existingLanguages = await db.select().from(languages);
      englishLang = existingLanguages.find((lang) => lang.name === 'English');
      spanishLang = existingLanguages.find((lang) => lang.name === 'Spanish');

      if (!englishLang || !spanishLang) {
        return {
          success: false,
          message: 'Required languages (English/Spanish) not found in database.',
        };
      }
    }

    // Insert glossary entries
    let successCount = 0;
    for (const item of defaultData) {
      if (item.english && item.spanish) {
        try {
          const [insertedEntry] = await db
            .insert(glossaryEntries)
            .values({
              term: item.english,
              definition: `Definition for ${item.english}`,
            })
            .returning();

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
      const result = await addDefaultData();
      if (!result.success) {
        console.error('Failed to add default data:', result.message);
        return [];
      }
    }

    // Get all available languages first
    const availableLanguages = await db.select().from(languages);
    const primaryLang = availableLanguages.find((lang) => lang.isPrimary)!;

    // Get all terms with their translations
    const terms = await db
      .select({
        id: glossaryEntries.id,
        term: glossaryEntries.term,
        definition: glossaryEntries.definition,
        createdAt: glossaryEntries.createdAt,
        updatedAt: glossaryEntries.updatedAt,
      })
      .from(glossaryEntries);

    // Get all translations
    const translations = await db
      .select({
        termId: entryTranslations.termId,
        languageId: entryTranslations.languageId,
        translation: entryTranslations.translation,
      })
      .from(entryTranslations);

    // Create a map for quick language lookups
    const languageMap = new Map(availableLanguages.map((lang) => [lang.id, lang]));

    // Transform the data into the expected format
    const result: Term[] = terms.map((term) => {
      const termObj: Term = {
        termId: term.id,
        translations: {},
      };

      // Add the primary language (English) term
      if (primaryLang) {
        termObj.translations[primaryLang.name.toLowerCase()] = term.term;
      }

      // Add translations for other languages
      const termTranslations = translations.filter((t) => t.termId === term.id);
      for (const translation of termTranslations) {
        const language = languageMap.get(translation.languageId);
        if (language) {
          termObj.translations[language.name.toLowerCase()] = translation.translation;
        }
      }

      return termObj;
    });

    result.sort((a, b) => {
      // Sort by primary term (English) first
      const aPrimary = a.translations[primaryLang.name.toLowerCase()] || '';
      const bPrimary = b.translations[primaryLang.name.toLowerCase()] || '';
      return aPrimary.localeCompare(bPrimary);
    });

    return result;
  } catch (error) {
    console.error('Error fetching terms from database:', error);
    return [];
  }
}

export async function insertGlossaryEntry(
  props: InsertGlossaryEntryProps
): Promise<BaseResponse & { termId?: number }> {
  try {
    const { primaryTerm, definition, translations } = props;

    // Get all available languages
    const availableLanguages = await db.select().from(languages);
    const languageMap = new Map(availableLanguages.map((lang) => [lang.name.toLowerCase(), lang]));

    // Insert the main glossary entry
    const [insertedEntry] = await db
      .insert(glossaryEntries)
      .values({
        term: primaryTerm,
        definition: definition,
      })
      .returning();

    if (!insertedEntry) {
      return {
        success: false,
        message: 'Failed to insert glossary entry.',
      };
    }

    // Insert translations if provided
    let translationCount = 0;
    if (translations) {
      for (const [languageKey, translation] of Object.entries(translations)) {
        const language = languageMap.get(languageKey.toLowerCase());

        if (language && !language.isPrimary && translation.trim()) {
          try {
            await db.insert(entryTranslations).values({
              termId: insertedEntry.id,
              languageId: language.id,
              translation: translation.trim(),
            });
            translationCount++;
          } catch (error) {
            console.error(`Failed to insert translation for ${languageKey}:`, error);
            // Continue with other translations instead of failing completely
          }
        }
      }
    }

    const message =
      translationCount > 0
        ? `Successfully added term "${primaryTerm}" with ${translationCount} translation(s).`
        : `Successfully added term "${primaryTerm}" without translations.`;

    return {
      success: true,
      message: message,
      termId: insertedEntry.id,
    };
  } catch (error) {
    console.error('Error inserting glossary entry:', error);
    return {
      success: false,
      message: `Failed to insert glossary entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
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

export async function updateGlossaryEntry(props: updateGlossaryEntryProps): Promise<BaseResponse> {
  try {
    const { termId, primaryTerm, definition, translations } = props;

    if (isNaN(termId)) {
      return {
        success: false,
        message: 'Invalid term ID provided.',
      };
    }

    // Check if the term exists
    const [existingTerm] = await db
      .select()
      .from(glossaryEntries)
      .where(eq(glossaryEntries.id, termId))
      .limit(1);

    if (!existingTerm) {
      return {
        success: false,
        message: 'Term not found.',
      };
    }

    // Get all available languages
    const availableLanguages = await db.select().from(languages);
    const languageMap = new Map(availableLanguages.map((lang) => [lang.name.toLowerCase(), lang]));

    // Update the main glossary entry if primaryTerm or definition is provided
    if (primaryTerm !== undefined || definition !== undefined) {
      const updateData: any = {};
      if (primaryTerm !== undefined) updateData.term = primaryTerm;
      if (definition !== undefined) updateData.definition = definition;

      await db.update(glossaryEntries).set(updateData).where(eq(glossaryEntries.id, termId));

      console.log('finished updating..');
    }

    // Update translations if provided
    let translationCount = 0;
    if (translations) {
      for (const [languageKey, translation] of Object.entries(translations)) {
        const language = languageMap.get(languageKey.toLowerCase());

        if (language && !language.isPrimary) {
          try {
            if (translation.trim()) {
              // Check if translation already exists
              const [existingTranslation] = await db
                .select()
                .from(entryTranslations)
                .where(
                  and(
                    eq(entryTranslations.termId, termId),
                    eq(entryTranslations.languageId, language.id)
                  )
                )
                .limit(1);

              if (existingTranslation) {
                // Update existing translation
                await db
                  .update(entryTranslations)
                  .set({ translation: translation.trim() })
                  .where(
                    and(
                      eq(entryTranslations.termId, termId),
                      eq(entryTranslations.languageId, language.id)
                    )
                  );
              } else {
                // Insert new translation
                await db.insert(entryTranslations).values({
                  termId: termId,
                  languageId: language.id,
                  translation: translation.trim(),
                });
              }
              translationCount++;
            } else {
              // Delete translation if empty string provided
              await db
                .delete(entryTranslations)
                .where(
                  and(
                    eq(entryTranslations.termId, termId),
                    eq(entryTranslations.languageId, language.id)
                  )
                );
            }
          } catch (error) {
            console.error(`Failed to update translation for ${languageKey}:`, error);
            // Continue with other translations instead of failing completely
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully updated term with ${translationCount} translation(s).`,
    };
  } catch (error) {
    console.error('Error updating glossary entry:', error);
    return {
      success: false,
      message: `Failed to update glossary entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function deleteGlossaryEntry(termId: number): Promise<BaseResponse> {
  try {
    // Check if the term exists
    const [existingTerm] = await db
      .select()
      .from(glossaryEntries)
      .where(eq(glossaryEntries.id, termId))
      .limit(1);

    if (!existingTerm) {
      return {
        success: false,
        message: 'Term not found.',
      };
    }

    // Delete all translations for this term first (foreign key constraint)
    await db.delete(entryTranslations).where(eq(entryTranslations.termId, termId));

    // Delete the main glossary entry
    await db.delete(glossaryEntries).where(eq(glossaryEntries.id, termId));

    return {
      success: true,
      message: 'Successfully deleted term and all its translations.',
    };
  } catch (error) {
    console.error('Error deleting glossary entry:', error);
    return {
      success: false,
      message: `Failed to delete glossary entry: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
