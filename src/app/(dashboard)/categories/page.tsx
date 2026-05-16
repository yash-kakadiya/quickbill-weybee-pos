'use client';

import { useState, useEffect } from 'react';
import { getCategories, toggleCategoryStatus } from '@/actions/category.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CategoryDialog } from '@/components/categories/category-dialog';
import { Plus, Search, Edit2, Power, PowerOff, Loader2, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-states/empty-state';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCategories();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  async function fetchCategories() {
    setIsLoading(true);
    const result = await getCategories(search);
    if (result.success && result.data) {
      setCategories(result.data);
    } else {
      toast.error('Failed to load categories');
    }
    setIsLoading(false);
  }

  async function handleToggleStatus(category: any) {
    const result = await toggleCategoryStatus(category.id, !category.isActive);
    if (result.success) {
      toast.success(`${category.name} is now ${!category.isActive ? 'Active' : 'Inactive'}`);
      fetchCategories();
    } else {
      toast.error(result.error);
    }
  }

  function handleEdit(category: any) {
    setEditingCategory(category);
    setIsDialogOpen(true);
  }

  function handleAddNew() {
    setEditingCategory(null);
    setIsDialogOpen(true);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1 text-sm">Organize your products for easy discovery.</p>
        </div>
        <Button onClick={handleAddNew} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="flex items-center relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search categories..."
          className="pl-9 bg-card shadow-sm transition-all focus-visible:ring-primary"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="whitespace-nowrap">Name</TableHead>
                <TableHead className="whitespace-nowrap">Slug</TableHead>
                <TableHead className="whitespace-nowrap">Products Count</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-64 text-center p-0">
                    <EmptyState 
                      icon={Tags}
                      title="No categories found"
                      description="Get started by creating your first product category."
                      actionLabel="Add Category"
                      onAction={handleAddNew}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} className={`hover:bg-muted/40 transition-colors ${!category.isActive ? 'opacity-60 bg-muted/20' : ''}`}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium bg-background">
                        {category._count?.products || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {category.isActive ? (
                        <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 font-medium">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground font-medium">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(category)} title="Edit" className="h-8 w-8 hover:bg-primary/10 hover:text-primary">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleToggleStatus(category)}
                          title={category.isActive ? "Deactivate" : "Activate"}
                          className={`h-8 w-8 ${category.isActive ? 'hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30' : 'hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30'}`}
                        >
                          {category.isActive ? <PowerOff className="h-4 w-4 text-rose-500" /> : <Power className="h-4 w-4 text-emerald-500" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CategoryDialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) fetchCategories();
        }}
        categoryToEdit={editingCategory} 
      />
    </div>
  );
}
