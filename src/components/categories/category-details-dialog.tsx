'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Layers, Edit2, PowerOff, Power } from 'lucide-react';

interface CategoryDetailsDialogProps {
  category: any | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (category: any) => void;
  onToggleStatus?: (category: any) => void;
}

export function CategoryDetailsDialog({
  category,
  isOpen,
  onClose,
  onEdit,
  onToggleStatus,
}: CategoryDetailsDialogProps) {
  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between">
            <span className="line-clamp-1 pr-4">{category.name}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 mt-1">
            Category Details
            <Badge variant="outline" className={`text-xs ml-auto ${category.isActive ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'bg-muted text-muted-foreground'}`}>
              {category.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col gap-6">
          <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Layers className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Total Products</span>
              <span className="text-2xl font-bold text-foreground">
                {category._count?.products || 0}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Description</span>
            <p className="text-sm text-muted-foreground leading-relaxed bg-muted/10 p-3 rounded-md border border-dashed">
              {category.description || 'No description available for this category.'}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="outline" size="icon" onClick={() => { onEdit(category); onClose(); }} title="Edit">
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onToggleStatus && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => { onToggleStatus(category); onClose(); }}
                title={category.isActive ? "Deactivate" : "Activate"}
                className={category.isActive ? 'text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'}
              >
                {category.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
