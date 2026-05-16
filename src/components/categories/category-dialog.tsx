'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { categorySchema, CategoryInput } from '@/lib/validations/category';
import { createCategory, updateCategory } from '@/actions/category.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryToEdit?: any;
}

export function CategoryDialog({ open, onOpenChange, categoryToEdit }: CategoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.input<typeof categorySchema>, any, CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (categoryToEdit && open) {
      form.reset({
        name: categoryToEdit.name,
        description: categoryToEdit.description || '',
      });
    } else if (!open) {
      form.reset();
    }
  }, [categoryToEdit, open, form]);

  async function onSubmit(data: CategoryInput) {
    setIsLoading(true);
    try {
      const result = categoryToEdit 
        ? await updateCategory(categoryToEdit.id, data)
        : await createCategory(data);
        
      if (result.success) {
        toast.success(`Category ${categoryToEdit ? 'updated' : 'created'} successfully`);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{categoryToEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogDescription>
            {categoryToEdit ? 'Make changes to your category here.' : 'Add a new category to organize products.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input {...form.register('name')} disabled={isLoading} placeholder="e.g. Electronics" />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input {...form.register('description')} disabled={isLoading} placeholder="Short description..." />
              {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
