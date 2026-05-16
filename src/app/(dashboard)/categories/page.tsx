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
import { Plus, Search, Edit2, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="flex items-center relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search categories..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Products Count</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading categories...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className={!category.isActive ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>{category._count?.products || 0}</TableCell>
                  <TableCell>
                    {category.isActive ? (
                      <Badge variant="default" className="bg-green-600">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(category)} title="Edit">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleToggleStatus(category)}
                      title={category.isActive ? "Deactivate" : "Activate"}
                      className={category.isActive ? 'text-destructive' : 'text-green-600'}
                    >
                      {category.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
