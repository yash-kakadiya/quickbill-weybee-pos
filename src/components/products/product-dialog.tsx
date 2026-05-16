'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productSchema, ProductInput } from '@/lib/validations/product';
import { createProduct, updateProduct } from '@/actions/product.actions';
import { getActiveCategories } from '@/actions/category.actions';
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
import { Loader2, Sparkles } from 'lucide-react';
import { generateProductDescription } from '@/actions/ai.actions';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: any; // Will type properly later
}

export function ProductDialog({ open, onOpenChange, productToEdit }: ProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function loadCategories() {
      const res = await getActiveCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    }
    if (open) loadCategories();
  }, [open]);

  const form = useForm<z.input<typeof productSchema>, any, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      categoryId: '',
      description: '',
      price: 0,
      stock: 0,
      lowStockThreshold: 5,
    },
  });

  useEffect(() => {
    if (productToEdit && open) {
      form.reset({
        name: productToEdit.name,
        sku: productToEdit.sku,
        categoryId: productToEdit.categoryId,
        description: productToEdit.description || '',
        price: productToEdit.price,
        stock: productToEdit.stock,
        lowStockThreshold: productToEdit.lowStockThreshold,
      });
    } else if (!open) {
      form.reset();
    }
  }, [productToEdit, open, form]);

  async function handleGenerateDescription() {
    const name = form.getValues('name');
    const categoryId = form.getValues('categoryId');
    const price = form.getValues('price');
    const currentDesc = form.getValues('description');

    if (!name) {
      toast.error('Please enter a product name first to generate a description.');
      return;
    }

    if (currentDesc && !hasGenerated) {
      if (!confirm('This will overwrite your existing description. Do you want to proceed?')) {
        return;
      }
    }

    setIsGeneratingDesc(true);
    try {
      const categoryName = categories.find(c => c.id === categoryId)?.name;
      const res = await generateProductDescription({ name, categoryName, price: price ? Number(price) : undefined });
      
      if (res.success && res.description) {
        form.setValue('description', res.description, { shouldValidate: true, shouldDirty: true });
        setHasGenerated(true);
        toast.success('Description generated successfully!');
      } else {
        toast.error(res.error || 'Failed to generate description');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsGeneratingDesc(false);
    }
  }

  async function onSubmit(data: ProductInput) {
    setIsLoading(true);
    try {
      const result = productToEdit 
        ? await updateProduct(productToEdit.id, data)
        : await createProduct(data);
        
      if (result.success) {
        toast.success(`Product ${productToEdit ? 'updated' : 'created'} successfully`);
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
      <DialogContent className="sm:max-w-[600px] bg-card overflow-hidden p-0 border-border/50 shadow-lg">
        <div className="px-6 pt-6 pb-4 border-b bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-xl">{productToEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>
              {productToEdit ? 'Make changes to your product details below.' : 'Add a new product to your catalogue.'}
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 pt-4 space-y-5">
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium text-foreground">Product Name</label>
              <Input 
                {...form.register('name')} 
                disabled={isLoading} 
                className="transition-all focus-visible:ring-primary shadow-sm"
                placeholder="e.g. Premium Wireless Headphones"
              />
              {form.formState.errors.name && <p className="text-xs text-destructive mt-1 font-medium">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">SKU / Code</label>
              <Input 
                {...form.register('sku')} 
                disabled={isLoading || !!productToEdit} 
                className={`transition-all shadow-sm ${!!productToEdit ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'focus-visible:ring-primary'}`}
                placeholder="e.g. WH-1000XM4"
              />
              {form.formState.errors.sku && <p className="text-xs text-destructive mt-1 font-medium">{form.formState.errors.sku.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                {...form.register('categoryId')}
                disabled={isLoading}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {form.formState.errors.categoryId && <p className="text-xs text-destructive mt-1 font-medium">{form.formState.errors.categoryId.message}</p>}
            </div>

            <div className="space-y-1.5 col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleGenerateDescription}
                  disabled={isGeneratingDesc || isLoading}
                  className="h-7 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/20 shadow-sm transition-all"
                >
                  {isGeneratingDesc ? (
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1.5" />
                  )}
                  {hasGenerated ? 'Regenerate' : '✨ Generate Description'}
                </Button>
              </div>
              <div className="relative">
                <textarea
                  {...form.register('description')}
                  disabled={isLoading || isGeneratingDesc}
                  rows={3}
                  placeholder="Product description..."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                {hasGenerated && (
                  <span className="absolute bottom-2 right-2 text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-1.5 py-0.5 rounded shadow-sm">
                    AI Generated
                  </span>
                )}
              </div>
              {form.formState.errors.description && <p className="text-xs text-destructive mt-1 font-medium">{form.formState.errors.description.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center justify-between">
                Price
                <span className="text-xs text-muted-foreground font-normal">in Rupees (₹)</span>
              </label>
              <Input 
                type="number" 
                step="0.01" 
                {...form.register('price')} 
                disabled={isLoading} 
                className="transition-all focus-visible:ring-primary shadow-sm"
              />
              {form.formState.errors.price && <p className="text-xs text-destructive mt-1 font-medium">{form.formState.errors.price.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Current Stock</label>
              <Input 
                type="number" 
                {...form.register('stock')} 
                disabled={isLoading} 
                className="transition-all focus-visible:ring-primary shadow-sm"
              />
              {form.formState.errors.stock && <p className="text-xs text-destructive mt-1 font-medium">{form.formState.errors.stock.message}</p>}
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium text-foreground">Low Stock Threshold</label>
              <Input 
                type="number" 
                {...form.register('lowStockThreshold')} 
                disabled={isLoading} 
                className="transition-all focus-visible:ring-primary shadow-sm"
              />
              <p className="text-xs text-muted-foreground">You will be alerted when stock falls below this number.</p>
              {form.formState.errors.lowStockThreshold && <p className="text-xs text-destructive mt-1 font-medium">{form.formState.errors.lowStockThreshold.message}</p>}
            </div>
          </div>
          
          <DialogFooter className="pt-4 mt-6 border-t border-border/50 gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="mt-2 sm:mt-0">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="shadow-sm">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {productToEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
