'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, IndianRupee, ShoppingCart, AlertCircle, Edit2, PowerOff, Power } from 'lucide-react';

interface ProductDetailsDialogProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: any) => void;
  onEdit?: (product: any) => void;
  onToggleStatus?: (product: any) => void;
}

export function ProductDetailsDialog({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onEdit,
  onToggleStatus,
}: ProductDetailsDialogProps) {
  if (!product) return null;

  const isLowStock = product.stock <= product.lowStockThreshold;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span className="line-clamp-1 pr-4">{product.name}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="font-mono text-xs">
              {product.sku}
            </Badge>
            {product.category && (
              <Badge variant="outline" className="text-xs">
                {product.category.name}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ml-auto ${product.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-muted text-muted-foreground'}`}>
              {product.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col gap-6">
          <div className="flex items-end justify-between bg-muted/30 p-4 rounded-lg border border-border/50">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <IndianRupee className="h-3 w-3" />
                Unit Price
              </span>
              <span className="text-3xl font-bold text-foreground">
                ₹{Number(product.price).toFixed(2)}
              </span>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" />
                In Stock
              </span>
              <div className="flex items-center gap-2">
                {isLowStock && <AlertCircle className="h-4 w-4 text-destructive" />}
                <span className={`text-xl font-bold ${isLowStock ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {product.stock}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Description</span>
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/10 p-3 rounded-md border border-dashed">
              {product.description || 'No description available for this product.'}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="icon" onClick={() => { onEdit(product); onClose(); }} title="Edit">
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onToggleStatus && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => { onToggleStatus(product); onClose(); }}
                title={product.isActive ? "Deactivate" : "Activate"}
                className={product.isActive ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'}
              >
                {product.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant={onAddToCart ? "outline" : "default"} onClick={onClose}>
              {onAddToCart ? "Cancel" : "Close"}
            </Button>
            {onAddToCart && (
              <Button 
                className="flex items-center gap-2" 
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                disabled={product.stock <= 0}
              >
                <ShoppingCart className="h-4 w-4" />
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
