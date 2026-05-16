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

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productToEdit?: any; // Will type properly later
}

export function ProductDialog({ open, onOpenChange, productToEdit }: ProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{productToEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
          <DialogDescription>
            {productToEdit ? 'Make changes to your product here.' : 'Add a new product to your catalogue.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Name</label>
              <Input {...form.register('name')} disabled={isLoading} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU/Code</label>
              <Input {...form.register('sku')} disabled={isLoading || !!productToEdit} />
              {form.formState.errors.sku && <p className="text-sm text-destructive">{form.formState.errors.sku.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <select
                {...form.register('categoryId')}
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {form.formState.errors.categoryId && <p className="text-sm text-destructive">{form.formState.errors.categoryId.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Price (₹)</label>
              <Input type="number" step="0.01" {...form.register('price')} disabled={isLoading} />
              {form.formState.errors.price && <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stock Quantity</label>
              <Input type="number" {...form.register('stock')} disabled={isLoading} />
              {form.formState.errors.stock && <p className="text-sm text-destructive">{form.formState.errors.stock.message}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Low Stock Alert at</label>
              <Input type="number" {...form.register('lowStockThreshold')} disabled={isLoading} />
              {form.formState.errors.lowStockThreshold && <p className="text-sm text-destructive">{form.formState.errors.lowStockThreshold.message}</p>}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
