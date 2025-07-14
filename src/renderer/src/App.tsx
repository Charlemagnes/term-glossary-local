import toast, { Toaster } from 'react-hot-toast';
import { useState, useMemo } from 'react';
import { useTerms, useLanguages } from './lib/queries';
import { Input } from './components/ui/input';
import { Button } from './components/ui/button';
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from './components/ui/table';
import { Languages, Plus, X } from 'lucide-react';
import { AddTermModal } from './components/add-term';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  insertGlossaryEntry,
  updateGlossaryEntry,
  deleteGlossaryEntry,
} from './lib/database-actions';
import { InsertGlossaryEntryProps, updateGlossaryEntryProps } from 'src/main/database';

export default function GlossaryPage() {
  const queryClient = useQueryClient();
  const [filterTerm, setFilterTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('english');
  const [termToEdit, setTermToEdit] = useState<updateGlossaryEntryProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TanStack Query hooks
  const { data: dbTerms, isLoading: isLoadingTerms, error: termsError } = useTerms();
  const {
    data: dbLanguages,
    isLoading: isLoadingLanguages,
    error: languagesError,
  } = useLanguages();

  // Use database terms if available, otherwise fall back to initial terms
  const currentTerms = dbTerms && dbTerms.length > 0 ? dbTerms : [];

  // Use database languages if available, otherwise fall back to static languages
  const availableLanguages =
    dbLanguages && dbLanguages.length > 0
      ? dbLanguages
      : [
          { id: 1, key: 'english', name: 'English', isPrimary: true },
          { id: 2, key: 'spanish', name: 'Spanish', isPrimary: false },
          { id: 3, key: 'french', name: 'French', isPrimary: false },
          { id: 4, key: 'german', name: 'German', isPrimary: false },
        ];

  const filteredTerms = useMemo(() => {
    if (!filterTerm) {
      return currentTerms;
    }
    const lowerCaseFilterTerm = filterTerm.toLowerCase();
    console.log(currentTerms, 'current terms');
    const filteredTerms = currentTerms.filter((term) => {
      const valueToSearch = term.translations[filterLanguage];
      return (
        typeof valueToSearch === 'string' &&
        valueToSearch.toLowerCase().includes(lowerCaseFilterTerm)
      );
    });
    console.log(filteredTerms, 'filtered terms');
    return filteredTerms;
  }, [currentTerms, filterTerm, filterLanguage]);

  const newTermMutation = useMutation({
    mutationFn: insertGlossaryEntry,
    onSuccess: () => {
      toast.success('New term added successfully');
    },
    onError: (error) => {
      toast.error('Error adding new term: ' + error.message);
    },
    onSettled: () => {
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
  });

  // Mutation for editing a term
  const editTermMutation = useMutation({
    mutationFn: (props: updateGlossaryEntryProps) => updateGlossaryEntry(props),
    onSuccess: () => {
      toast.success('Term updated successfully');
    },
    onError: (error) => {
      toast.error('Error updating term: ' + error.message);
    },
    onSettled: () => {
      setTermToEdit(null);
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
  });

  // Mutation for deleting a term
  const deleteTermMutation = useMutation({
    mutationFn: deleteGlossaryEntry,
    onSuccess: () => {
      toast.success('Term deleted successfully');
    },
    onError: (error) => {
      toast.error('Error deleting term: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
  });

  // Dynamically determine columns based on existing data
  const dynamicLanguages = useMemo(() => {
    const languagesInUse = new Set<string>();
    currentTerms.forEach((term) => {
      Object.keys(term).forEach((key) => {
        if (key !== 'id' && availableLanguages.some((lang) => lang.key === key)) {
          languagesInUse.add(key);
        }
      });
    });
    return availableLanguages.filter(
      (lang) => languagesInUse.has(lang.key) || lang.key === 'english' || lang.key === 'spanish'
    );
  }, [currentTerms]);

  function handleFilterTermChange(value: string): void {
    setFilterLanguage(value);
    setFilterTerm('');
  }

  function handleAddTerm(newTerm: InsertGlossaryEntryProps | updateGlossaryEntryProps): void {
    console.log(newTerm, 'editing or adding term?');
    if (termToEdit) {
      editTermMutation.mutate(newTerm as updateGlossaryEntryProps);
    } else {
      newTermMutation.mutate(newTerm as InsertGlossaryEntryProps);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="mb-6 text-3xl font-bold">Term Translation Glossary</h1>

      {/* Show error message if terms failed to load */}
      {termsError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Error loading terms from database: {termsError.message}
        </div>
      )}

      {/* Show error message if languages failed to load */}
      {languagesError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Error loading languages from database: {languagesError.message}
        </div>
      )}

      {/* Show loading indicator for terms or languages */}
      {(isLoadingTerms || isLoadingLanguages) && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-700">
          Loading data from database...
        </div>
      )}

      <div className="mb-6 flex flex-col items-center gap-4 md:flex-row">
        <div className="relative w-full max-w-sm flex-grow">
          <Input
            placeholder="Filter by term..."
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            className="w-full pr-10"
            aria-label="Filter terms"
          />
          {filterTerm && (
            <button
              type="button"
              onClick={() => setFilterTerm('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
              aria-label="Clear filter"
            >
              <X className="w-4" />
            </button>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex shrink-0 items-center gap-2 bg-transparent">
              <Languages className="h-4 w-4" />
              Filter Language:
              {availableLanguages.find((lang) => lang.key === filterLanguage)?.name || 'English'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuRadioGroup value={filterLanguage} onValueChange={handleFilterTermChange}>
              {availableLanguages.map((lang) => (
                <DropdownMenuRadioItem key={lang.key} value={lang.key}>
                  {lang.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => setIsModalOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Term
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {dynamicLanguages.map((lang) => (
                <TableHead key={lang.key}>{lang.name}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTerms.length > 0 ? (
              filteredTerms.map((term) => (
                <TableRow key={term.termId}>
                  {dynamicLanguages.map((lang) => (
                    <TableCell key={`${term.termId}-${lang.key}`}>
                      {term.translations[lang.key] || '-'}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const termToEdit: updateGlossaryEntryProps = {
                            termId: term.termId,
                            primaryTerm: term.translations.english,
                            translations: {
                              spanish: term.translations.spanish,
                            },
                          };
                          setTermToEdit(termToEdit);
                          setIsModalOpen(true);
                        }}
                        disabled={editTermMutation.isPending}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          deleteTermMutation.mutate(term.termId);
                        }}
                        disabled={deleteTermMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={dynamicLanguages.length + 1}
                  className="text-muted-foreground h-24 text-center"
                >
                  No terms found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddTermModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        termData={termToEdit ?? null}
        onAddTerm={(newTerm) => handleAddTerm(newTerm)}
      />
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Define default options
          className: '',
          duration: 5000,
          removeDelay: 1000,
          style: {
            background: '#363636',
            color: '#fff',
          },

          // Default options for specific types
          success: {
            duration: 3000,
            iconTheme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </div>
  );
}
