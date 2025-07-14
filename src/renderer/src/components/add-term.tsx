'use client';
import type React from 'react';
import { useState } from 'react';
import { Button } from './ui/button';
import {
  DialogHeader,
  DialogFooter,
  DialogDescription,
  DialogTitle,
  DialogContent,
  Dialog,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { InsertGlossaryEntryProps } from 'src/main/database';

interface AddTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTerm: (term: InsertGlossaryEntryProps) => void;
}

export function AddTermModal({ isOpen, onClose, onAddTerm }: AddTermModalProps) {
  const [englishTerm, setEnglishTerm] = useState('');
  const [spanishTranslation, setSpanishTranslation] = useState('');
  // const [frenchTranslation, setFrenchTranslation] = useState(''); // Optional additional language

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (englishTerm.trim() && spanishTranslation.trim()) {
      onAddTerm({
        primaryTerm: englishTerm.trim(),
        definition: '', // Assuming definition is not required for this modal
        translations: {
          spanish: spanishTranslation.trim(),
          // french: frenchTranslation.trim() || undefined,
        },
      });
      setEnglishTerm('');
      setSpanishTranslation('');
      // setFrenchTranslation('');
      // onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Term</DialogTitle>
          <DialogDescription>
            Enter the English term and its translations. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="english" className="text-right">
              English
            </Label>
            <Input
              id="english"
              value={englishTerm}
              onChange={(e) => setEnglishTerm(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="spanish" className="text-right">
              Spanish
            </Label>
            <Input
              id="spanish"
              value={spanishTranslation}
              onChange={(e) => setSpanishTranslation(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          {/* <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="french" className="text-right">
              French (Optional)
            </Label>
            <Input
              id="french"
              value={frenchTranslation}
              onChange={(e) => setFrenchTranslation(e.target.value)}
              className="col-span-3"
            />
          </div> */}
          <DialogFooter>
            <Button type="submit">Save Term</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
