'use client';
import type React from 'react';
import { useEffect, useState } from 'react';
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
import { InsertGlossaryEntryProps, updateGlossaryEntryProps } from 'src/main/database';

interface AddTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTerm: (term: InsertGlossaryEntryProps | updateGlossaryEntryProps) => void;
  termData: updateGlossaryEntryProps | null;
}

export function AddTermModal({ isOpen, onClose, onAddTerm, termData }: AddTermModalProps) {
  const [isEdit, setIsEdit] = useState(false);
  const [englishTerm, setEnglishTerm] = useState('');
  const [spanishTranslation, setSpanishTranslation] = useState('');

  useEffect(() => {
    if (termData) {
      setIsEdit(true);
      setEnglishTerm(termData.primaryTerm || '');
      setSpanishTranslation(termData.translations?.spanish || '');
    } else {
      setIsEdit(false);
      setEnglishTerm('');
      setSpanishTranslation('');
    }
    console.log(isEdit, termData);
  }, [termData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (englishTerm.trim() && spanishTranslation.trim()) {
      onAddTerm({
        termId: isEdit ? termData?.termId || 0 : undefined, // Use existing termId if editing
        primaryTerm: englishTerm.trim(),
        definition: '', // Assuming definition is not required for this modal
        translations: {
          spanish: spanishTranslation.trim(),
        },
      });
      setEnglishTerm('');
      setSpanishTranslation('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'Add New'} Term</DialogTitle>
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
