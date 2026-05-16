'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productSchema, ProductInput } from '@/lib/validations/product';
import { createProduct, updateProduct } from '@/actions/product.actions';
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

  const form = useForm<z.input<typeof productSchema>, any, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category: '',
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
        category: productToEdit.category,
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
              <Input {...form.register('category')} disabled={isLoading} />
              {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
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
