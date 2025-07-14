'use client';

import { useState, useMemo } from 'react';
import { useAddDefaultData, useTerms, useLanguages } from './lib/queries';
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
import { Languages, Plus } from 'lucide-react';
import { AddTermModal } from './components/add-term';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';

// const initialTerms: Term[] = [
//   { id: '1', english: 'Hello', spanish: 'Hola', french: 'Bonjour' },
//   { id: '2', english: 'Goodbye', spanish: 'Adiós', french: 'Au revoir' },
//   { id: '3', english: 'Thank you', spanish: 'Gracias', french: 'Merci' },
//   { id: '4', english: 'Please', spanish: 'Por favor', french: "S'il vous plaît" },
//   { id: '5', english: 'Excuse me', spanish: 'Disculpe', french: 'Excusez-moi' },
//   { id: '6', english: 'Yes', spanish: 'Sí', french: 'Oui' },
//   { id: '7', english: 'No', spanish: 'No', french: 'Non' },
//   { id: '8', english: 'Water', spanish: 'Agua', french: 'Eau' },
//   { id: '9', english: 'Food', spanish: 'Comida', french: 'Nourriture' },
//   { id: '10', english: 'Travel', spanish: 'Viajar', french: 'Voyager' },
// ];

export default function GlossaryPage() {
  const [filterTerm, setFilterTerm] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('english');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // TanStack Query hooks
  const { data: dbTerms, isLoading: isLoadingTerms, error: termsError } = useTerms();
  const {
    data: dbLanguages,
    isLoading: isLoadingLanguages,
    error: languagesError,
  } = useLanguages();
  const addDefaultDataMutation = useAddDefaultData();

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
    return currentTerms.filter((term) => {
      const valueToSearch = term[filterLanguage];
      return (
        typeof valueToSearch === 'string' &&
        valueToSearch.toLowerCase().includes(lowerCaseFilterTerm)
      );
    });
  }, [currentTerms, filterTerm, filterLanguage]);

  const handleAddTerm = (newTermData: { english: string; spanish: string; french?: string }) => {
    const newId = (
      currentTerms.length > 0 ? Math.max(...currentTerms.map((t) => Number.parseInt(t.id))) + 1 : 1
    ).toString();
    // TODO: Implement adding new terms to database
    // This functionality needs to be implemented
    console.log('Adding new term:', { id: newId, ...newTermData });
    // handle this with a db insert
    // setTerms((prevTerms) => [...prevTerms, newTerm]);
  };

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
  const addDefaultData = () => {
    addDefaultDataMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.success) {
          alert(result.message);
        } else {
          alert(result.message);
        }
      },
      onError: (error) => {
        console.error('Error adding default data:', error);
        alert('Failed to add default data. Please check the console for details.');
      },
    });
  };

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
        <Input
          placeholder="Filter by term..."
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          className="max-w-sm flex-grow"
          aria-label="Filter terms"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex shrink-0 items-center gap-2 bg-transparent">
              <Languages className="h-4 w-4" />
              Filter Language:
              {availableLanguages.find((lang) => lang.key === filterLanguage)?.name || 'English'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuRadioGroup value={filterLanguage} onValueChange={setFilterLanguage}>
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
        <Button
          onClick={() => addDefaultData()}
          className="shrink-0"
          disabled={addDefaultDataMutation.isPending}
        >
          <Plus className="mr-2 h-4 w-4" />
          {addDefaultDataMutation.isPending ? 'Loading...' : 'Add default data'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {dynamicLanguages.map((lang) => (
                <TableHead key={lang.key}>{lang.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTerms.length > 0 ? (
              filteredTerms.map((term) => (
                <TableRow key={term.id}>
                  {dynamicLanguages.map((lang) => (
                    <TableCell key={`${term.id}-${lang.key}`}>{term[lang.key] || '-'}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={dynamicLanguages.length}
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
        onAddTerm={handleAddTerm}
      />
    </div>
  );
}
