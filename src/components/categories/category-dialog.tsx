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
import { Loader2 } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[500px] bg-card overflow-hidden p-0 border-border/50 shadow-lg">
        <div className="px-6 pt-6 pb-4 border-b bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-xl">{categoryToEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {categoryToEdit ? 'Make changes to your category details below.' : 'Add a new category to organize products.'}
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 pt-4 space-y-5">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Category Name</label>
              <Input 
                {...form.register('name')} 
                disabled={isLoading} 
                placeholder="e.g. Electronics" 
                className="transition-all focus-visible:ring-primary shadow-sm"
              />
              {form.formState.errors.name && <p className="text-xs text-destructive mt-1 font-medium">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description <span className="text-muted-foreground font-normal">(Optional)</span></label>
              <Input 
                {...form.register('description')} 
                disabled={isLoading} 
                placeholder="Short description..." 
                className="transition-all focus-visible:ring-primary shadow-sm"
              />
              {form.formState.errors.description && <p className="text-xs text-destructive mt-1 font-medium">{form.formState.errors.description.message}</p>}
            </div>
          </div>
          
          <DialogFooter className="pt-4 mt-6 border-t border-border/50 gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="mt-2 sm:mt-0">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="shadow-sm">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {categoryToEdit ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
