import { sql } from "drizzle-orm";
import { index, sqliteTable } from "drizzle-orm/sqlite-core";
import { customType } from "drizzle-orm/sqlite-core";


export const customBoolean = customType<{
  data: boolean;
}>({
  dataType() {
    return "integer";
  },
  toDriver(value) {
    return value ? 1 : 0;
  },
  fromDriver(value) {
    return !!value;
  },
});

export const languages = sqliteTable(
  "glossary_languages",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 128 }).notNull(),
    isPrimary: customBoolean().notNull().default(false),
  }),
  (t) => [index("primary_language_idx").on(t.isPrimary)],
);

export const glossaryEntries = sqliteTable(
  "glossary_entries",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    term: d.text({ length: 512 }).notNull(),
    definition: d.text().notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("term_idx").on(t.term),
  ],
);

export const entryTranslations = sqliteTable(
  "entry_translations",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    termId: d.integer({ mode: "number" }).notNull(),
    languageId: d.integer({ mode: "number" }).notNull(),
    translation: d.text().notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("term_translation_idx").on(t.termId, t.languageId),
  ],
);